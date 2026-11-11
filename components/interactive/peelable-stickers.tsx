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
 * Original procedural sticker foley: bright peel friction and a short, damped contact body.
 * No recorded samples or dependencies. Reference analysis informs the sound family only.
 * One factory per board. Call unlock() from a real pointer/key gesture, never from render.
 */
type StickerMaterial = "paper" | "vinyl" | "foil"
type MaterialAudio = {
    unlock: () => Promise<boolean>
    pickup: (material: StickerMaterial, volume?: number) => void
    /** Normalized rate of the PEEL FRONT, not pointer velocity. Zero while carrying. */
    drag: (material: StickerMaterial, speed: number, volume?: number) => void
    /** Full adhesive separation; once per pickup, before carrying. */
    detach: (material: StickerMaterial, volume?: number) => void
    /** Invoke at the existing geometric contact threshold, once per release. */
    drop: (material: StickerMaterial, volume?: number) => void
    stop: () => void
    dispose: () => void
}

type PremiumProfile = {
    bodyCutoff: number; detailCutoff: number; detailHighpass: number
    bodyLevel: number; detailLevel: number; rate: number
    pickupLength: number; detachLength: number; contactLength: number
    contactStart: number; contactEnd: number; contactDecay: number; contactAir: number
}
const premiumProfiles: Record<StickerMaterial, PremiumProfile> = {
    paper: { bodyCutoff: 8500, detailCutoff: 11000, detailHighpass: 3300, bodyLevel: .15, detailLevel: .055, rate: .98, pickupLength: .028, detachLength: .014, contactLength: .10, contactStart: 275, contactEnd: 182, contactDecay: .015, contactAir: .045 },
    vinyl: { bodyCutoff: 7400, detailCutoff: 9500, detailHighpass: 2900, bodyLevel: .14, detailLevel: .04, rate: .92, pickupLength: .024, detachLength: .012, contactLength: .095, contactStart: 250, contactEnd: 167, contactDecay: .017, contactAir: .018 },
    foil: { bodyCutoff: 9600, detailCutoff: 12500, detailHighpass: 4100, bodyLevel: .13, detailLevel: .065, rate: 1.03, pickupLength: .030, detachLength: .016, contactLength: .105, contactStart: 288, contactEnd: 194, contactDecay: .014, contactAir: .06 },
}
const premiumClamp = (value: number, low = 0, high = 1) => Number.isFinite(value) ? Math.max(low, Math.min(high, value)) : low

type PremiumVoice = { sources: AudioBufferSourceNode[]; nodes: AudioNode[]; gain: GainNode; released: boolean }
type PremiumLoop = PremiumVoice & {
    body: AudioBufferSourceNode; detail: AudioBufferSourceNode
    bodyFilter: BiquadFilterNode; detailFilter: BiquadFilterNode; detailHighpass: BiquadFilterNode
    bodyGain: GainNode; detailGain: GainNode
}

function createMaterialAudio(): MaterialAudio {
    let context: AudioContext | null = null
    let output: GainNode | null = null
    let highpass: BiquadFilterNode | null = null
    let limiter: WaveShaperNode | null = null
    let bodyBuffer: AudioBuffer | null = null
    let detailBuffer: AudioBuffer | null = null
    let loop: PremiumLoop | null = null
    let disposed = false
    let activated = false
    let contactLatched = false
    let detachLatched = false
    let seed = 0x54ad29b1
    let removeListeners: (() => void) | null = null
    const voices = new Set<PremiumVoice>()
    const contacts = new Map<StickerMaterial, AudioBuffer[]>()
    const lifts = new Map<StickerMaterial, AudioBuffer[]>()
    const releases = new Map<StickerMaterial, AudioBuffer[]>()
    type FoleyKind = "pickup" | "detach" | "contact"

    const random = () => {
        seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
        return (seed >>> 0) / 4294967296
    }
    const onePole = (frequency: number, rate: number) => 1 - Math.exp(-2 * Math.PI * frequency / rate)

    function normalize(samples: Float32Array, peak: number) {
        let max = .00001
        for (let i = 0; i < samples.length; i++) max = Math.max(max, Math.abs(samples[i]))
        for (let i = 0; i < samples.length; i++) samples[i] *= peak / max
    }

    function makeTexture(ctx: AudioContext, detail: boolean): AudioBuffer {
        const rate = ctx.sampleRate, length = Math.ceil(rate * (detail ? 3.97 : 4.63))
        const buffer = ctx.createBuffer(1, length, rate), data = buffer.getChannelData(0)
        const aLow = onePole(detail ? 4300 : 2600, rate), aHigh = onePole(detail ? 12500 : 9500, rate)
        const decay = Math.exp(-1 / (rate * (detail ? .00085 : .0018)))
        const attackDecay = Math.exp(-1 / (rate * .00016))
        let low = 0, high = 0, grain = 0, attack = 0, nextGrain = 0
        // Fine, irregular high-band friction. The reference's peel is bright and sparse;
        // avoid the previous low-mid rustle and conspicuous multi-grain rattle clusters.
        for (let i = 0; i < length; i++) {
            const white = random() * 2 - 1
            low += aLow * (white - low); high += aHigh * (white - high)
            if (i >= nextGrain) {
                const strength = .20 + Math.pow(random(), 2) * 1.05
                grain += strength; attack += strength
                nextGrain = i + Math.round(rate * (.006 + random() * .019))
            }
            grain *= decay; attack *= attackDecay
            const envelope = .008 + Math.min(1.25, Math.max(0, grain - attack))
            data[i] = (high - low) * envelope
        }
        normalize(data, .85)
        // Loop starts after this prefix. End approaches prefix[N-1], followed by prefix[N].
        // This avoids the subtle discontinuity of crossfading then jumping back to sample zero.
        const seam = Math.round(rate * .045)
        for (let i = 0; i < seam; i++) {
            const t = i / (seam - 1), blend = t * t * (3 - 2 * t)
            data[length - seam + i] = data[length - seam + i] * (1 - blend) + data[i] * blend
        }
        return buffer
    }

    function makeTransient(ctx: AudioContext, material: StickerMaterial, kind: FoleyKind): AudioBuffer {
        const p = premiumProfiles[material], rate = ctx.sampleRate
        const contact = kind === "contact", detached = kind === "detach"
        const duration = contact ? p.contactLength : detached ? p.detachLength : p.pickupLength
        const buffer = ctx.createBuffer(1, Math.ceil(rate * duration), rate), data = buffer.getChannelData(0)
        const aLow = onePole(contact ? 1100 : 3100, rate), aHigh = onePole(contact ? 5500 : p.detailCutoff, rate)
        const variation = .975 + random() * .05
        let low = 0, high = 0, phase = 0
        for (let i = 0; i < data.length; i++) {
            const t = i / rate, u = t / duration, white = random() * 2 - 1
            low += aLow * (white - low); high += aHigh * (white - high)
            const fade = Math.pow(Math.max(0, 1 - u), 1.5)
            if (contact) {
                // A short, rounded damped mode, not a broadband noise impact. Independent
                // tuning/envelopes retain the reference family without copying its samples.
                const frequency = (p.contactEnd + (p.contactStart - p.contactEnd) * Math.exp(-t / .014)) * variation
                phase += 2 * Math.PI * frequency / rate
                const attack = 1 - Math.exp(-t / .0009)
                const body = Math.sin(phase) + .055 * Math.sin(phase * 2.07) * Math.exp(-t / .007)
                const envelope = attack * Math.exp(-t / p.contactDecay) * fade
                const surface = (high - low) * p.contactAir * attack * Math.exp(-t / .019) * fade
                data[i] = body * envelope + surface
            } else {
                // Pickup only cues the first actual peel movement; no additional loud snap
                // is invented at full separation. Detach is attenuated further at playback.
                const envelope = (1 - Math.exp(-t / .0004)) * Math.exp(-t / (detached ? .0018 : .004)) * fade
                data[i] = (high - low) * envelope
            }
        }
        // End samples are already zero; bounded peak makes material volume consistent.
        normalize(data, contact ? .80 : detached ? .55 : .65)
        data[0] = 0; data[data.length - 1] = 0
        return buffer
    }

    function available(): boolean {
        return activated && !disposed && context !== null && context.state === "running"
    }

    function disconnect(voice: PremiumVoice) {
        voice.nodes.forEach(node => { try { node.disconnect() } catch {} })
        voices.delete(voice)
    }

    function track(voice: PremiumVoice) {
        let remaining = voice.sources.length
        voice.sources.forEach(source => {
            source.onended = () => { if (--remaining === 0) disconnect(voice) }
        })
        voices.add(voice)
    }

    function hold(param: AudioParam, now: number) {
        if (typeof param.cancelAndHoldAtTime === "function") {
            try { param.cancelAndHoldAtTime(now); return } catch { /* partially implemented host */ }
        }
        {
            const value = param.value
            param.cancelScheduledValues(now)
            param.setValueAtTime(value, now)
        }
    }

    function release(voice: PremiumVoice, seconds = .065) {
        if (!context || voice.released) return
        voice.released = true
        const now = context.currentTime
        hold(voice.gain.gain, now)
        voice.gain.gain.linearRampToValueAtTime(0, now + seconds)
        voice.sources.forEach(source => { try { source.stop(now + seconds + .008) } catch {} })
    }

    function stop() {
        if (!loop) return
        const old = loop; loop = null
        release(old)
    }

    function interrupt() {
        stop()
        voices.forEach(voice => release(voice, .025))
        // A suspended context must not replay old foley when Safari/tab audio resumes.
        if (context?.state !== "running") {
            voices.forEach(voice => {
                voice.sources.forEach(source => { try { source.stop() } catch {} })
                disconnect(voice)
            })
        }
    }

    async function unlock(): Promise<boolean> {
        if (disposed || typeof window === "undefined") return false
        try {
            if (!context) {
                const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
                if (!Ctor) return false
                context = new Ctor({ latencyHint: "interactive" })
                output = context.createGain(); output.gain.value = .58
                highpass = context.createBiquadFilter(); highpass.type = "highpass"
                highpass.frequency.value = 65; highpass.Q.value = .5
                limiter = context.createWaveShaper()
                const curve = new Float32Array(2049)
                for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1; curve[i] = .92 * Math.tanh(x / .92) }
                limiter.curve = curve
                // Final stage, after the highpass: <= .733 peak even with overlapping tails.
                // No filter after this stage; the bound applies to digital sample peaks.
                limiter.oversample = "none"
                output.connect(highpass); highpass.connect(limiter); limiter.connect(context.destination)
                bodyBuffer = makeTexture(context, false); detailBuffer = makeTexture(context, true)
                ;(["paper", "vinyl", "foil"] as StickerMaterial[]).forEach(material => {
                    contacts.set(material, Array.from({length:3}, () => makeTransient(context!, material, "contact")))
                    lifts.set(material, Array.from({length:3}, () => makeTransient(context!, material, "pickup")))
                    releases.set(material, Array.from({length:3}, () => makeTransient(context!, material, "detach")))
                })
                const hidden = () => { if (document.hidden) interrupt() }
                const state = () => { if (context?.state !== "running") interrupt() }
                window.addEventListener("blur", interrupt)
                document.addEventListener("visibilitychange", hidden)
                context.addEventListener("statechange", state)
                const owner = context
                removeListeners = () => {
                    window.removeEventListener("blur", interrupt)
                    document.removeEventListener("visibilitychange", hidden)
                    owner.removeEventListener("statechange", state)
                }
            }
            if (context.state !== "running") await context.resume()
            activated = !disposed && context?.state === "running"
            return activated
        } catch {
            activated = false
            interrupt()
            return false
        }
    }

    function transient(material: StickerMaterial, volume: number, kind: FoleyKind) {
        if (!available() || !context || !output || volume <= 0) return
        const ctx = context, now = ctx.currentTime
        const bank = kind === "contact" ? contacts : kind === "detach" ? releases : lifts
        const takes = bank.get(material) || bank.get("paper")!
        const buffer = takes[Math.floor(random() * takes.length)]
        const source = ctx.createBufferSource(), gain = ctx.createGain()
        source.buffer = buffer
        // Tiny take-to-take variation of texture length, never a within-sound pitch sweep.
        source.playbackRate.value = .98 + random() * .04
        gain.gain.value = volume * (kind === "contact" ? .52 : kind === "detach" ? .045 : .16) * (.96 + random() * .04)
        source.connect(gain); gain.connect(output)
        const voice: PremiumVoice = { sources: [source], nodes: [source, gain], gain, released: false }
        // Bound overlap during repeated keyboard/multi-sticker input.
        if (voices.size >= 12) release(voices.values().next().value!, .01)
        track(voice); source.start(now)
    }

    function pickup(material: StickerMaterial, volume = .65) {
        contactLatched = false
        detachLatched = false
        stop()
        transient(material, premiumClamp(volume), "pickup")
    }

    function makeLoop(ctx: AudioContext): PremiumLoop | null {
        if (!output || !bodyBuffer || !detailBuffer) return null
        const body = ctx.createBufferSource(), detail = ctx.createBufferSource()
        const bodyFilter = ctx.createBiquadFilter(), detailFilter = ctx.createBiquadFilter(), detailHighpass = ctx.createBiquadFilter()
        const bodyGain = ctx.createGain(), detailGain = ctx.createGain(), gain = ctx.createGain()
        body.buffer = bodyBuffer; detail.buffer = detailBuffer
        body.loop = detail.loop = true
        body.loopStart = detail.loopStart = .045
        body.loopEnd = bodyBuffer.duration; detail.loopEnd = detailBuffer.duration
        bodyFilter.type = detailFilter.type = "lowpass"
        bodyFilter.Q.value = detailFilter.Q.value = .45
        detailHighpass.type = "highpass"; detailHighpass.Q.value = .4
        gain.gain.value = 0
        body.connect(bodyFilter); bodyFilter.connect(bodyGain); bodyGain.connect(gain)
        detail.connect(detailHighpass); detailHighpass.connect(detailFilter); detailFilter.connect(detailGain); detailGain.connect(gain)
        gain.connect(output)
        const voice: PremiumLoop = {
            sources: [body, detail], nodes: [body, detail, bodyFilter, detailFilter, detailHighpass, bodyGain, detailGain, gain],
            gain, released: false, body, detail, bodyFilter, detailFilter, detailHighpass, bodyGain, detailGain,
        }
        track(voice)
        body.start(ctx.currentTime, .045 + random() * 2); detail.start(ctx.currentTime, .045 + random() * 2)
        return voice
    }

    function drag(material: StickerMaterial, speed: number, volume = .65) {
        if (!available() || !context || contactLatched || detachLatched) return
        const ctx = context, now = ctx.currentTime, velocity = premiumClamp(speed), amount = premiumClamp(volume)
        if (velocity < .004 || amount === 0) {
            if (loop) { hold(loop.gain.gain, now); loop.gain.gain.setTargetAtTime(0, now, .026) }
            return
        }
        const p = premiumProfiles[material] || premiumProfiles.paper
        if (!loop) loop = makeLoop(ctx)
        if (!loop) return
        const response = Math.pow(velocity, .40) * velocity / (velocity + .012)
        loop.bodyFilter.frequency.setTargetAtTime(p.bodyCutoff * (.74 + velocity * .45), now, .035)
        loop.detailFilter.frequency.setTargetAtTime(p.detailCutoff * (.72 + velocity * .33), now, .035)
        loop.detailHighpass.frequency.setTargetAtTime(p.detailHighpass, now, .05)
        loop.bodyGain.gain.setTargetAtTime(p.bodyLevel, now, .025)
        loop.detailGain.gain.setTargetAtTime(p.detailLevel * (.65 + .35 * velocity), now, .025)
        loop.body.playbackRate.setTargetAtTime(p.rate * (.82 + velocity * .48), now, .045)
        loop.detail.playbackRate.setTargetAtTime(p.rate * (.94 + velocity * .53), now, .045)
        hold(loop.gain.gain, now)
        loop.gain.gain.setTargetAtTime(response * amount, now, .008)
        // Audio-clock watchdog: a frozen RAF or lost move event cannot leave friction running.
        loop.gain.gain.setTargetAtTime(0, now + .11, .035)
    }

    function detach(material: StickerMaterial, volume = .65) {
        stop()
        if (detachLatched || contactLatched) return
        detachLatched = true
        transient(material, premiumClamp(volume), "detach")
    }

    function drop(material: StickerMaterial, volume = .65) {
        stop()
        if (!available() || !context) return
        // Latch out the tiny returning-front delta after visible contact. Next pickup re-arms.
        if (contactLatched) return
        contactLatched = true
        transient(material, premiumClamp(volume), "contact")
    }

    function dispose() {
        if (disposed) return
        disposed = true; activated = false; loop = null
        removeListeners?.(); removeListeners = null
        voices.forEach(voice => {
            voice.sources.forEach(source => { try { source.stop() } catch {} })
            disconnect(voice)
        })
        voices.clear(); contacts.clear(); lifts.clear(); releases.clear()
        try { output?.disconnect(); highpass?.disconnect(); limiter?.disconnect() } catch {}
        if (context && context.state !== "closed") void context.close().catch(() => undefined)
        context = null; output = null; highpass = null; limiter = null; bodyBuffer = null; detailBuffer = null
    }

    // Audio is optional feedback. A device/context error must never interrupt
    // the caller's animation frame, pointer release, or landing geometry.
    let failed = false
    const safely = (action: () => void) => {
        if (failed) return
        try { action() } catch (error) {
            failed = true
            try { dispose() } catch {}
            console.warn("Peelable Stickers: audio feedback was stopped after a device error.", error)
        }
    }
    return {
        unlock: () => failed ? Promise.resolve(false) : unlock(),
        pickup: (material, volume) => safely(() => pickup(material, volume)),
        drag: (material, speed, volume) => safely(() => drag(material, speed, volume)),
        detach: (material, volume) => safely(() => detach(material, volume)),
        drop: (material, volume) => safely(() => drop(material, volume)),
        stop: () => safely(stop),
        dispose: () => safely(dispose),
    }
}


const clamp = (value: number, min = 0, max = 1) =>
    Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min

/** A dependency-free WebGL sticker sheet. Inputs use screen coordinates: +Y is down. */
type StickerRendererMaterial = "paper" | "vinyl" | "foil"

interface StickerPeelGeometry {
    /** Explicit crease coordinate, measured along the outward bend normal. */
    peelLine?: number
    /** 0 = attached; 1 = peel front has crossed the opposite edge. */
    peel?: number
    /** Backwards-compatible alias for peel. Prefer peelLine for a hand-driven peel. */
    lift?: number
    bendX: number
    bendY: number
    /** Curl radius in artwork-width units. 0.055 is a tight, soft paper roll. */
    radius?: number
    /** Radians, from flat (0) to a complete backfold (Math.PI). */
    curlAngle?: number
    /** Whole sheet height above the board in artwork-width units. */
    elevation?: number
}

interface StickerRenderState extends StickerPeelGeometry {
    lightX: number
    lightY: number
    material: StickerRendererMaterial
    wear: number
    /** Strength of pressure creases and fine strain wrinkles while peeling. */
    foldDetail?: number
    /** Last remembered crease normal; same artwork coordinates as bendX/bendY. */
    creaseX?: number
    creaseY?: number
    /** Remember an interior peelLine, rather than the final detached edge. */
    creaseLine?: number
    /** 0 removes the remembered crease; 1 gives the full material impression. */
    creaseStrength?: number
}

interface StickerRendererOptions {
    /** Fraction of the canvas occupied by the unbent artwork. Keep room for curl/shadow. */
    artworkScale?: number
    maxDpr?: number
    /** Useful before the source has loaded. Its natural aspect ratio wins after loading. */
    sourceAspect?: number
    segments?: number
    /** Soft alpha shadow generated from the deformed artwork. Default false. */
    shadows?: boolean
    /** Called on image, shader, or context failure so a normal image can be shown. */
    onError?: () => void
}

interface StickerRendererHandle {
    ready: Promise<boolean>
    draw: (state: StickerRenderState) => void
    resize: (width: number, height: number, dpr?: number) => void
    projectedGrip: (grip: { x: number; y: number }, state: StickerPeelGeometry) => { x: number; y: number; z: number }
    getArtworkSize: () => { width: number; height: number; aspect: number }
    dispose: () => void
}

const stickerClamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min))

/** Coordinates are artwork-width units: x +/-0.5; y +/-0.5/aspect; +Y down. */
function stickerPeelGeometry(state: StickerPeelGeometry, aspect = 1) {
    const safeAspect = stickerClamp(aspect, 0.1, 10)
    let nx = Number.isFinite(state.bendX) ? state.bendX : 0.7
    let ny = Number.isFinite(state.bendY) ? state.bendY : -0.7
    if (Math.hypot(nx, ny) < 0.0001) { nx = 0.7; ny = -0.7 }
    const length = Math.hypot(nx, ny)
    nx /= length; ny /= length
    const maxSupport = (Math.abs(nx) + Math.abs(ny) / safeAspect) * 0.5
    const radius = stickerClamp(state.radius ?? 0.055, 0.003, 0.5)
    const angle = stickerClamp(state.curlAngle ?? Math.PI, 0, Math.PI)
    const line = Number.isFinite(state.peelLine)
        ? state.peelLine!
        : maxSupport - stickerClamp(state.peel ?? state.lift ?? 0, 0, 1) * maxSupport * 2
    return { nx, ny, maxSupport, minSupport: -maxSupport, radius, angle, line,
        elevation: stickerClamp(state.elevation ?? 0, 0, 2) }
}

/**
 * Solve a physical cylindrical peel for inward hand travel. No preset lift is used.
 * The edge's projected retreat equals pull, so its position can stay under the hand.
 * A full backfold takes slightly more travel than detachment: allow peelLine to
 * continue beyond minSupport if that additional roll is desired.
 */
function solveStickerPeel(
    pull: number, normalX: number, normalY: number, aspect = 1,
    radius = 0.055, curlAngle = Math.PI
) {
    const g = stickerPeelGeometry({ bendX: normalX, bendY: normalY, radius, curlAngle }, aspect)
    const delta = Math.max(0, Number.isFinite(pull) ? pull : 0)
    const angle = Math.max(0.001, g.angle)
    const arc = angle * g.radius
    const arcRetreat = g.radius * (angle - Math.sin(angle))
    let peeledLength = 0
    if (delta <= arcRetreat) {
        let lo = 0, hi = arc
        for (let i = 0; i < 24; i++) {
            const q = (lo + hi) / 2
            if (q - g.radius * Math.sin(q / g.radius) < delta) lo = q
            else hi = q
        }
        peeledLength = delta === 0 ? 0 : (lo + hi) / 2
    } else {
        peeledLength = (delta - Math.cos(angle) * arc + g.radius * Math.sin(angle)) / Math.max(0.0000001, 1 - Math.cos(angle))
    }
    const span = g.maxSupport * 2
    const peelLine = g.maxSupport - peeledLength
    return {
        peelLine, progress: stickerClamp(peeledLength / Math.max(0.0001, span), 0, 1),
        detached: peelLine <= g.minSupport + 0.00001,
        fullBackfold: peeledLength >= span + arc,
        minSupport: g.minSupport, maxSupport: g.maxSupport, gripU: g.maxSupport,
        peeledLength, normalX: g.nx, normalY: g.ny,
    }
}

/** Exact CPU equivalent of the vertex deformation, including its tangent tail. */
function projectedStickerGrip(
    grip: { x: number; y: number }, state: StickerPeelGeometry, aspect = 1
) {
    const g = stickerPeelGeometry(state, aspect)
    const distance = Math.max(0, grip.x * g.nx + grip.y * g.ny - g.line)
    const angle = Math.min(distance / g.radius, g.angle)
    const tail = Math.max(0, distance - g.angle * g.radius)
    const curved = Math.sin(angle) * g.radius + Math.cos(angle) * tail
    const height = (1 - Math.cos(angle)) * g.radius + Math.sin(angle) * tail
    return {
        x: grip.x + g.nx * (curved - distance),
        y: grip.y + g.ny * (curved - distance),
        z: height + g.elevation,
    }
}

const stickerVertexShader = `
precision highp float;
attribute vec2 aUV;
uniform float uArtWidth;
uniform float uImageAspect;
uniform float uCanvasAspect;
uniform vec2 uBend;
uniform float uPeelLine;
uniform float uRadius;
uniform float uCurlAngle;
uniform float uElevation;
uniform float uShadowPass;
uniform vec2 uShadowJitter;
varying vec2 vUV;
varying vec3 vNormal;
varying float vHeight;

void main() {
    vUV = aUV;
    // Work in artwork-width coordinates, with screen-positive Y. Rendering is
    // orthographic so the CPU grip solver and the visible surface agree exactly.
    vec2 point = vec2(aUV.x - 0.5, (0.5 - aUV.y) / uImageAspect);
    vec2 direction = uBend;
    float distancePastFold = max(0.0, dot(point, direction) - uPeelLine);
    float angle = min(distancePastFold / uRadius, uCurlAngle);
    float tail = max(0.0, distancePastFold - uCurlAngle * uRadius);
    float curvedDistance = sin(angle) * uRadius + cos(angle) * tail;
    float height = (1.0 - cos(angle)) * uRadius + sin(angle) * tail + uElevation;
    vec2 bentPoint = point + direction * (curvedDistance - distancePastFold);
    vNormal = vec3(-direction.x * sin(angle), direction.y * sin(angle), cos(angle));
    vHeight = height;
    if (uShadowPass > 0.5) {
        bentPoint += vec2(0.009, 0.015) + height * vec2(0.23, 0.42)
                   + uShadowJitter * (0.009 + height * 0.13);
    }
    gl_Position = vec4(
        bentPoint.x * uArtWidth * 2.0 / uCanvasAspect,
        -bentPoint.y * uArtWidth * 2.0,
        uShadowPass > 0.5 ? 0.8 : -height * 0.4,
        1.0
    );
}
`

const stickerFragmentShader = `
precision highp float;
uniform sampler2D uArtwork;
uniform vec2 uTexel;
uniform vec2 uLight;
uniform float uMaterial;
uniform float uWear;
uniform float uShadowPass;
uniform float uImageAspect;
uniform vec2 uBend;
uniform float uPeelLine;
uniform float uRadius;
uniform float uCurlAngle;
uniform float uFoldDetail;
uniform vec2 uCreaseNormal;
uniform float uCreaseLine;
uniform float uCreaseStrength;
uniform float uArtPixel;
varying vec2 vUV;
varying vec3 vNormal;
varying float vHeight;

float randomValue(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 rainbow(float t) {
    return 0.58 + 0.42 * cos(6.2831853 * (vec3(0.02, 0.35, 0.67) + t));
}

// Analytic height derivatives for a narrow compression ridge. Its slight
// waviness follows the paper fibres, not the pointer, so the material stays put.
// These are surface-normal details only: the exact grip geometry is unchanged.
vec2 ridgeGradient(vec2 point, vec2 direction, float line, float width, float amplitude) {
    vec2 tangent = vec2(-direction.y, direction.x);
    float lateral = dot(point, tangent);
    float waviness = sin(lateral * 39.0) * 0.0011 + sin(lateral * 91.0) * 0.0005;
    float wavinessSlope = cos(lateral * 39.0) * 0.0429 + cos(lateral * 91.0) * 0.0455;
    float distance = (dot(point, direction) - line + waviness) / width;
    float slope = -distance * exp(-0.5 * distance * distance) * amplitude / width;
    return (direction + tangent * wavinessSlope) * slope;
}

// Small lateral wrinkles occur where the peel bends toward the free side edges.
// Both derivatives include their envelope, keeping the raised fibres continuous.
vec2 wrinkleGradient(vec2 point, vec2 direction, float distance, float amplitude) {
    vec2 tangent = vec2(-direction.y, direction.x);
    float lateral = dot(point, tangent);
    float support = max(0.01, (abs(tangent.x) + abs(tangent.y) / uImageAspect) * 0.5);
    float sideT = clamp((abs(lateral) / support - 0.38) / 0.56, 0.0, 1.0);
    float side = sideT * sideT * (3.0 - 2.0 * sideT);
    float sideSlope = 6.0 * sideT * (1.0 - sideT) * sign(lateral) / (support * 0.56);
    float attachT = clamp(distance / 0.022, 0.0, 1.0);
    float attached = attachT * attachT * (3.0 - 2.0 * attachT);
    float attachedSlope = 6.0 * attachT * (1.0 - attachT) / 0.022;
    float spread = uRadius * 1.4 + 0.035;
    float longitudinal = (distance - uRadius * 0.9 - 0.022) / spread;
    float envelope = exp(-longitudinal * longitudinal);
    float envelopeSlope = -2.0 * longitudinal * envelope / spread;
    float phase = lateral * 112.0 + distance * 27.0 + sin(lateral * 29.0) * 0.7;
    float wave = sin(phase) * 0.68 + sin(phase * 0.47 + 1.7) * 0.32;
    float waveSlope = cos(phase) * 0.68 + cos(phase * 0.47 + 1.7) * 0.1504;
    float along = ((envelopeSlope * attached + envelope * attachedSlope) * wave
                + envelope * attached * waveSlope * 27.0) * side;
    float across = envelope * attached * (sideSlope * wave
                 + side * waveSlope * (112.0 + cos(lateral * 29.0) * 20.3));
    return (direction * along + tangent * across) * amplitude;
}

void main() {
    vec4 artwork = texture2D(uArtwork, vUV);
    if (artwork.a < 0.012) discard;
    if (uShadowPass > 0.5) {
        float opacity = artwork.a * 0.028 / (1.0 + vHeight * 2.0);
        gl_FragColor = vec4(vec3(0.17, 0.14, 0.10) * opacity, opacity);
        return;
    }
    vec2 point = vec2(vUV.x - 0.5, (0.5 - vUV.y) / uImageAspect);
    vec2 tangent = vec2(-uBend.y, uBend.x);
    float pastFold = dot(point, uBend) - uPeelLine;
    float surfaceAngle = min(max(0.0, pastFold) / uRadius, uCurlAngle);
    float sine = sin(surfaceAngle), cosine = cos(surfaceAngle);
    vec3 baseNormal = vec3(-uBend.x * sine, uBend.y * sine, cosine);
    vec3 alongSurface = vec3(uBend.x * cosine, -uBend.y * cosine, sine);
    vec3 acrossSurface = vec3(tangent.x, -tangent.y, 0.0);
    float pressureWidth = max(uArtPixel * 1.35, max(0.0055, uRadius * 0.13));
    float pressureHeight = uMaterial < 0.5 ? 0.0035 : (uMaterial > 1.5 ? 0.0029 : 0.0010);
    float wrinkleHeight = uMaterial < 0.5 ? 0.00095 : (uMaterial > 1.5 ? 0.00125 : 0.00016);
    float folding = uFoldDetail * smoothstep(0.06, 0.65, uCurlAngle);
    vec2 detail = ridgeGradient(point, uBend, uPeelLine + pressureWidth * 0.35,
                               pressureWidth, pressureHeight) * folding;
    detail += wrinkleGradient(point, uBend, pastFold, wrinkleHeight) * folding;

    // A shallow furrow with soft shoulders remains after bending. Moving the
    // light reverses its bright/dark sides; it is never painted into the artwork.
    float memoryWidth = max(uArtPixel * 1.20, 0.0048);
    float memoryHeight = uMaterial < 0.5 ? 0.0017 : (uMaterial > 1.5 ? 0.0020 : 0.00065);
    detail += (ridgeGradient(point, uCreaseNormal, uCreaseLine, memoryWidth, -memoryHeight)
             + ridgeGradient(point, uCreaseNormal, uCreaseLine, memoryWidth * 2.6, memoryHeight * 0.38))
             * uCreaseStrength;
    vec3 surfaceNormal = normalize(baseNormal - alongSurface * dot(detail, uBend)
                                             - acrossSurface * dot(detail, tangent));
    vec3 normal = gl_FrontFacing ? surfaceNormal : -surfaceNormal;
    vec3 light = normalize(vec3(uLight.x * 0.9 - 0.32, uLight.y * 0.75 + 0.55, 1.35));
    vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
    float diffuse = max(0.0, dot(normal, light));
    float specular = max(0.0, dot(normal, halfVector));
    float grain = randomValue(floor(vUV / max(uTexel * 0.82, vec2(0.00025)))) - 0.5;
    vec3 base = artwork.rgb;
    vec3 color;

    if (!gl_FrontFacing) {
        // The adhesive backing stays quiet so the lifted edge reads as material.
        vec3 backing = uMaterial > 1.5 ? vec3(0.83, 0.85, 0.84) : vec3(0.93, 0.915, 0.87);
        float fiber = sin(vUV.y * 1150.0) * 0.007 + grain * 0.024;
        color = (backing + fiber + base * 0.018) * (0.72 + diffuse * 0.28);
        color += pow(specular, 28.0) * (uMaterial > 1.5 ? 0.17 : 0.025);
    } else {
        color = base * (uMaterial < 0.5 ? 0.76 + diffuse * 0.25 : 0.84 + diffuse * 0.17);
        if (uMaterial < 0.5) {
            // Uncoated stock: diffuse fibres, very broad and muted reflection.
            color += grain * 0.036 + pow(specular, 8.0) * 0.028;
        } else if (uMaterial < 1.5) {
            // Clear vinyl catches a soft moving light without washing the print out.
            float sheen = pow(specular, 42.0);
            float broad = pow(specular, 7.0);
            color = mix(color, vec3(1.0), sheen * 0.38 + broad * 0.055);
            color += grain * 0.008;
        } else {
            // Diffraction follows both the pointer and the actual surface normal.
            float phase = dot(vUV - 0.5, vec2(0.78, -0.5))
                        + dot(normal.xy, vec2(0.37, 0.23))
                        + dot(uLight, vec2(0.16, -0.11));
            vec3 foil = rainbow(phase * 1.85);
            float facing = 0.18 + 0.17 * pow(specular, 4.0);
            vec3 coated = base * (0.72 + foil * 0.50) + foil * 0.13;
            color = mix(color, coated, 0.82);
            color = mix(color, vec3(1.0), pow(specular, 56.0) * 0.50);
            color += grain * 0.018 + foil * facing * 0.10;
        }

        // Very small chips and hairline scratches; alpha silhouette is preserved.
        float inside = min(min(texture2D(uArtwork, vUV + vec2(uTexel.x * 2.0, 0.0)).a,
                               texture2D(uArtwork, vUV - vec2(uTexel.x * 2.0, 0.0)).a),
                           min(texture2D(uArtwork, vUV + vec2(0.0, uTexel.y * 2.0)).a,
                               texture2D(uArtwork, vUV - vec2(0.0, uTexel.y * 2.0)).a));
        float edgeWear = (1.0 - inside) * step(0.30, grain + 0.5);
        vec2 cell = floor(vUV * vec2(15.0, 87.0));
        float scratch = step(0.962, fract(vUV.y * 87.0 + randomValue(vec2(cell.x, 8.0))))
                      * step(0.91, randomValue(cell));
        color = mix(color, vec3(0.94, 0.925, 0.89), uWear * (edgeWear * 0.60 + scratch * 0.19));
    }
    // The rolled valley is gently occluded; the rest of the artwork stays true.
    color *= 1.0 - 0.075 * (1.0 - abs(baseNormal.z));
    gl_FragColor = vec4(clamp(color, 0.0, 1.0) * artwork.a, artwork.a);
}
`

/** Drop-in renderer block. Reuses the surrounding sticker types, shaders and geometry helpers. */
type StickerSharedOptions = StickerRendererOptions & {
    shadowSamples?: number
    /** Fires after a successful live GPU-to-2D copy, including recovery. */
    onReady?: () => void
    onStatus?: (ready: boolean) => void
}
type StickerSharedAsset = {
    source: string; image: HTMLImageElement | null; aspect: number; texture: WebGLTexture | null
    textureWidth: number; textureHeight: number; loaded: boolean; failed: boolean
    clients: Set<StickerSharedClient>
}
type StickerSharedClient = {
    canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; options: StickerSharedOptions
    asset: StickerSharedAsset; state: StickerRenderState; width: number; height: number; dpr: number
    disposed: boolean; painted: boolean; lastSignature: string; force: boolean
    settle: (result: boolean) => void
}
type StickerSharedMesh = { vertices: WebGLBuffer; indices: WebGLBuffer; count: number }
type StickerSharedPool = {
    attach: (client: StickerSharedClient) => void
    detach: (client: StickerSharedClient) => void
    asset: (source: string, aspect: number) => StickerSharedAsset
    request: (client: StickerSharedClient) => void
}
let stickerSharedPool: StickerSharedPool | null = null

function makeStickerSharedPool(): StickerSharedPool | null {
    const surface = document.createElement("canvas")
    surface.width = surface.height = 1
    const gl = surface.getContext("webgl", {
        alpha: true, antialias: true, premultipliedAlpha: true,
        depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: "low-power",
    }) as WebGLRenderingContext | null
    if (!gl) return null
    const clients = new Set<StickerSharedClient>()
    const assets = new Map<string, StickerSharedAsset>()
    const queue = new Set<StickerSharedClient>()
    const meshes = new Map<number, StickerSharedMesh>()
    let program: WebGLProgram | null = null
    let shaders: WebGLShader[] = []
    let uniforms: Record<string, WebGLUniformLocation | null> = {}
    let attribute = 0, frame = 0, lost = false, disposed = false
    let idleTimer: ReturnType<typeof setTimeout> | null = null
    const maxSide = Math.min(2048, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number)
    const clamp = stickerClamp
    const failClient = (client: StickerSharedClient) => {
        if (client.disposed || client.painted) return
        client.settle(false)
        client.options.onStatus?.(false)
        client.options.onError?.()
    }
    const releaseGPU = () => {
        if (!gl.isContextLost()) {
            for (const asset of assets.values()) if (asset.texture) gl.deleteTexture(asset.texture)
            for (const mesh of meshes.values()) { gl.deleteBuffer(mesh.vertices); gl.deleteBuffer(mesh.indices) }
            if (program) gl.deleteProgram(program)
            for (const shader of shaders) gl.deleteShader(shader)
        }
        for (const asset of assets.values()) asset.texture = null
        meshes.clear(); program = null; shaders = []; uniforms = {}
    }
    const initialize = () => {
        releaseGPU()
        const compile = (kind: number, source: string) => {
            const shader = gl.createShader(kind)
            if (!shader) throw new Error("Sticker shader unavailable")
            shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Sticker shader failed")
            return shader
        }
        program = gl.createProgram()
        if (!program) throw new Error("Sticker program unavailable")
        gl.attachShader(program, compile(gl.VERTEX_SHADER, stickerVertexShader))
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, stickerFragmentShader))
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Sticker program failed")
        gl.useProgram(program); attribute = gl.getAttribLocation(program, "aUV")
        for (const name of ["uArtWidth", "uImageAspect", "uCanvasAspect", "uBend", "uPeelLine", "uRadius", "uCurlAngle", "uElevation", "uShadowPass", "uShadowJitter", "uArtwork", "uTexel", "uLight", "uMaterial", "uWear", "uFoldDetail", "uCreaseNormal", "uCreaseLine", "uCreaseStrength", "uArtPixel"]) uniforms[name] = gl.getUniformLocation(program, name)
        gl.uniform1i(uniforms.uArtwork, 0)
        gl.disable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL)
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0)
    }
    const meshFor = (segments: number) => {
        let mesh = meshes.get(segments)
        if (mesh) return mesh
        const data = new Float32Array((segments + 1) * (segments + 1) * 2)
        const indices = new Uint16Array(segments * segments * 6)
        let v = 0, i = 0
        for (let row = 0; row <= segments; row++) for (let col = 0; col <= segments; col++) {
            data[v++] = col / segments; data[v++] = row / segments
            if (row < segments && col < segments) {
                const a = row * (segments + 1) + col, b = a + 1, c = a + segments + 2, d = a + segments + 1
                indices[i++] = a; indices[i++] = b; indices[i++] = c; indices[i++] = a; indices[i++] = c; indices[i++] = d
            }
        }
        const vertices = gl.createBuffer(), elementBuffer = gl.createBuffer()
        if (!vertices || !elementBuffer) {
            if (vertices) gl.deleteBuffer(vertices)
            if (elementBuffer) gl.deleteBuffer(elementBuffer)
            throw new Error("Sticker mesh unavailable")
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertices); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
        mesh = { vertices, indices: elementBuffer, count: indices.length }; meshes.set(segments, mesh)
        return mesh
    }
    const textureFor = (asset: StickerSharedAsset) => {
        if (asset.texture) return asset.texture
        if (!asset.image || !asset.loaded) throw new Error("Sticker image not loaded")
        let source: TexImageSource = asset.image
        let width = asset.image.naturalWidth, height = asset.image.naturalHeight
        if (width < 1 || height < 1) throw new Error("Empty sticker image")
        if (Math.max(width, height) > maxSide) {
            const scale = maxSide / Math.max(width, height), scratch = document.createElement("canvas")
            scratch.width = Math.max(1, Math.round(width * scale)); scratch.height = Math.max(1, Math.round(height * scale))
            const context = scratch.getContext("2d")
            if (!context) throw new Error("Sticker image resize unavailable")
            context.drawImage(asset.image, 0, 0, scratch.width, scratch.height)
            source = scratch; width = scratch.width; height = scratch.height
        }
        const texture = gl.createTexture()
        if (!texture) throw new Error("Sticker texture unavailable")
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
            if (gl.isContextLost()) throw new Error("Sticker context lost")
            if (gl.getError() !== gl.NO_ERROR) throw new Error("Sticker texture upload failed")
        } catch (error) { if (!gl.isContextLost()) gl.deleteTexture(texture); throw error }
        asset.texture = texture; asset.textureWidth = width; asset.textureHeight = height
        return texture
    }
    const signature = (client: StickerSharedClient) => JSON.stringify([client.width, client.height, client.dpr, client.asset.aspect, client.state])
    const render = (client: StickerSharedClient) => {
        if (client.disposed || !client.asset.loaded || !program || lost || gl.isContextLost()) return
        const stamp = signature(client)
        if (!client.force && client.lastSignature === stamp) return
        const state = client.state, asset = client.asset, options = client.options
        const requestedRatio = clamp(client.dpr, .25, clamp(options.maxDpr ?? 2, .25, 3))
        const ratio = Math.min(requestedRatio, maxSide / client.width, maxSide / client.height)
        const width = Math.max(1, Math.round(client.width * ratio)), height = Math.max(1, Math.round(client.height * ratio))
        // Keep a reusable bounded drawing buffer. Each job occupies its lower-left viewport.
        if (surface.width < width || surface.height < height) {
            surface.width = Math.max(surface.width, width); surface.height = Math.max(surface.height, height)
        }
        const texture = textureFor(asset), mesh = meshFor(Math.round(clamp(options.segments ?? 64, 28, 96)))
        const canvasAspect = client.width / client.height, scale = clamp(options.artworkScale ?? .30, .10, .90)
        const artWidth = Math.min(scale, scale * canvasAspect / asset.aspect) * asset.aspect
        const g = stickerPeelGeometry(state, asset.aspect)
        gl.viewport(0, 0, width, height); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices); gl.enableVertexAttribArray(attribute)
        gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices)
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1f(uniforms.uArtWidth, artWidth); gl.uniform1f(uniforms.uImageAspect, asset.aspect)
        gl.uniform1f(uniforms.uCanvasAspect, canvasAspect); gl.uniform2f(uniforms.uTexel, 1 / asset.textureWidth, 1 / asset.textureHeight)
        gl.uniform2f(uniforms.uBend, g.nx, g.ny); gl.uniform1f(uniforms.uPeelLine, g.line)
        gl.uniform1f(uniforms.uRadius, g.radius); gl.uniform1f(uniforms.uCurlAngle, g.angle); gl.uniform1f(uniforms.uElevation, g.elevation)
        gl.uniform2f(uniforms.uLight, clamp(state.lightX, -1, 1), -clamp(state.lightY, -1, 1))
        gl.uniform1f(uniforms.uMaterial, state.material === "foil" ? 2 : state.material === "vinyl" ? 1 : 0)
        gl.uniform1f(uniforms.uWear, clamp(state.wear, 0, 1)); gl.uniform1f(uniforms.uFoldDetail, clamp(state.foldDetail ?? 1, 0, 1))
        let cx = Number.isFinite(state.creaseX) ? state.creaseX! : g.nx, cy = Number.isFinite(state.creaseY) ? state.creaseY! : g.ny
        const length = Math.hypot(cx, cy)
        if (length < .0001) { cx = g.nx; cy = g.ny } else { cx /= length; cy /= length }
        gl.uniform2f(uniforms.uCreaseNormal, cx, cy)
        gl.uniform1f(uniforms.uCreaseLine, Number.isFinite(state.creaseLine) ? state.creaseLine! : 0)
        gl.uniform1f(uniforms.uCreaseStrength, clamp(state.creaseStrength ?? 0, 0, 1))
        gl.uniform1f(uniforms.uArtPixel, 1 / Math.max(1, artWidth * height))
        if (options.shadows) {
            const samples = Math.round(clamp(options.shadowSamples ?? 9, 1, 24))
            gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.uniform1f(uniforms.uShadowPass, 1)
            for (let sample = 0; sample < samples; sample++) {
                const angle = sample * 2.399963229728653, radius = Math.sqrt((sample + .5) / samples)
                gl.uniform2f(uniforms.uShadowJitter, Math.cos(angle) * radius, Math.sin(angle) * radius)
                gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0)
            }
            gl.depthMask(true)
        }
        gl.enable(gl.DEPTH_TEST); gl.uniform1f(uniforms.uShadowPass, 0); gl.uniform2f(uniforms.uShadowJitter, 0, 0)
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0)
        if (gl.isContextLost()) return
        // No await/RAF can occur between the draw and this copy. Reusing/clearing
        // the shared GPU surface afterwards cannot erase this client's live canvas.
        if (client.canvas.width !== width || client.canvas.height !== height) {
            client.canvas.width = width; client.canvas.height = height
        }
        client.context.globalCompositeOperation = "copy"
        client.context.drawImage(surface, 0, surface.height - height, width, height, 0, 0, width, height)
        client.context.globalCompositeOperation = "source-over"
        const first = !client.painted
        client.painted = true; client.force = false; client.lastSignature = stamp
        client.settle(true)
        if (first) client.options.onStatus?.(true)
        client.options.onReady?.()
    }
    const schedule = () => {
        if (!frame && !lost && !disposed && queue.size) frame = requestAnimationFrame(flush)
    }
    const request = (client: StickerSharedClient) => {
        if (client.disposed || disposed || client.asset.failed) return
        if (!client.asset.loaded) return
        if (!client.force && client.lastSignature === signature(client)) return
        queue.add(client); schedule()
    }
    const flush = () => {
        frame = 0
        if (disposed || lost || gl.isContextLost()) return
        const start = performance.now()
        let count = 0
        for (const client of queue) {
            queue.delete(client)
            if (!client.disposed) {
                try { render(client) } catch { if (!gl.isContextLost()) failClient(client) }
            }
            count++
            if (gl.isContextLost() || count >= 12 || performance.now() - start > 9) break
        }
        schedule()
    }
    const onLost = (event: Event) => {
        event.preventDefault(); lost = true
        if (frame) { cancelAnimationFrame(frame); frame = 0 }
        // The 2D outputs remain intact and ready while GPU resources are unavailable.
        for (const client of clients) client.force = true
        releaseGPU()
    }
    const onRestored = () => {
        if (disposed) return
        try {
            initialize(); lost = false
            for (const client of clients) { client.force = true; request(client) }
        } catch { lost = true; for (const client of clients) failClient(client) }
    }
    surface.addEventListener("webglcontextlost", onLost)
    surface.addEventListener("webglcontextrestored", onRestored)
    const destroy = () => {
        disposed = true
        if (frame) cancelAnimationFrame(frame)
        if (idleTimer) clearTimeout(idleTimer)
        surface.removeEventListener("webglcontextlost", onLost); surface.removeEventListener("webglcontextrestored", onRestored)
        queue.clear(); releaseGPU()
        for (const asset of assets.values()) if (asset.image) { asset.image.onload = null; asset.image.onerror = null }
        assets.clear(); clients.clear()
        if (!gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext()
        if (stickerSharedPool === pool) stickerSharedPool = null
    }
    const pool: StickerSharedPool = {
        asset(source, aspect) {
            const existing = assets.get(source)
            if (existing) return existing
            const asset: StickerSharedAsset = { source, image: null, aspect, texture: null, textureWidth: 1, textureHeight: 1, loaded: false, failed: false, clients: new Set() }
            assets.set(source, asset)
            return asset
        },
        attach(client) {
            if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
            clients.add(client); client.asset.clients.add(client)
            const asset = client.asset
            if (asset.failed) { failClient(client); return }
            if (asset.loaded) { request(client); return }
            if (asset.image) return
            if (!asset.source.startsWith("data:image/svg+xml;charset=utf-8,") && !trustedStickerUpload(asset.source)) { asset.failed = true; failClient(client); return }
            const image = new Image(); asset.image = image; image.crossOrigin = "anonymous"; image.referrerPolicy = "no-referrer"
            image.onload = () => {
                if (disposed || !asset.clients.size) return
                asset.loaded = true; asset.aspect = clamp(image.naturalWidth / Math.max(1, image.naturalHeight), .1, 10)
                for (const subscriber of asset.clients) { subscriber.force = true; request(subscriber) }
            }
            image.onerror = () => {
                asset.failed = true
                for (const subscriber of asset.clients) failClient(subscriber)
            }
            image.src = asset.source
        },
        detach(client) {
            queue.delete(client); clients.delete(client); client.asset.clients.delete(client)
            if (!client.asset.clients.size) {
                if (client.asset.texture && !gl.isContextLost()) gl.deleteTexture(client.asset.texture)
                if (client.asset.image) { client.asset.image.onload = null; client.asset.image.onerror = null }
                client.asset.texture = null; client.asset.image = null; assets.delete(client.asset.source)
            }
            if (!clients.size && !idleTimer) idleTimer = setTimeout(destroy, 500)
        },
        request,
    }
    try { initialize() } catch { destroy(); return null }
    return pool
}

function createStickerRenderer(
    canvas: HTMLCanvasElement, source: string, options: StickerSharedOptions = {}
): StickerRendererHandle {
    let settled = false, resolve: (ready: boolean) => void = () => {}
    const ready = new Promise<boolean>(done => { resolve = done })
    const settle = (result: boolean) => { if (!settled) { settled = true; resolve(result) } }
    const fallback: StickerRendererHandle = {
        ready, draw: () => {}, resize: () => {}, dispose: () => settle(false),
        projectedGrip: (grip, state) => projectedStickerGrip(grip, state, options.sourceAspect ?? 1),
        getArtworkSize: () => ({ width: 0, height: 0, aspect: options.sourceAspect ?? 1 }),
    }
    if (typeof window === "undefined" || !canvas || !source) { settle(false); return fallback }
    // A fresh DOM canvas is required when migrating from the previous WebGL output.
    const context = canvas.getContext("2d", { alpha: true })
    if (!context) { settle(false); options.onStatus?.(false); options.onError?.(); return fallback }
    if (!stickerSharedPool) stickerSharedPool = makeStickerSharedPool()
    const pool = stickerSharedPool
    if (!pool) { settle(false); options.onStatus?.(false); options.onError?.(); return fallback }
    const asset = pool.asset(source, stickerClamp(options.sourceAspect ?? 1, .1, 10))
    const client: StickerSharedClient = {
        canvas, context, options, asset, width: 256, height: 256, dpr: window.devicePixelRatio || 1,
        disposed: false, painted: false, lastSignature: "", force: true, settle,
        state: { peel: 0, bendX: .7, bendY: -.7, lightX: 0, lightY: 0, material: "paper", wear: .15 },
    }
    const getArtworkSize = () => {
        const scale = stickerClamp(options.artworkScale ?? .30, .10, .90)
        const height = Math.min(scale, scale * client.width / client.height / asset.aspect) * client.height
        return { width: height * asset.aspect, height, aspect: asset.aspect }
    }
    pool.attach(client)
    return {
        ready,
        draw(state) {
            if (client.disposed) return
            client.state = { ...state }; pool.request(client)
        },
        resize(width, height, dpr = window.devicePixelRatio || 1) {
            if (client.disposed) return
            client.width = Math.max(1, Number.isFinite(width) ? width : 256)
            client.height = Math.max(1, Number.isFinite(height) ? height : 256)
            client.dpr = Number.isFinite(dpr) ? dpr : 1
            // Preserve the last complete output until the replacement frame is ready.
            pool.request(client)
        },
        getArtworkSize,
        projectedGrip: (grip, state) => projectedStickerGrip(grip, state, asset.aspect),
        dispose() {
            if (client.disposed) return
            client.disposed = true; settle(false); pool.detach(client)
        },
    }
}


type StickerItem = {
    design: string; label: string; subtitle: string; material: StickerMaterial;
    color: string; ink: string; width: number; x: number; y: number; rotation: number;
    image?: { src: string; alt?: string }; wear: number; mobileX?:number; mobileY?:number
}
/**
 * Designer desk sticker artwork. All art uses a square 300 × 300 viewBox.
 * Keys: framer, figma, notion, react, memo, cursor, asterisk, save, command, webflow.
 * Brands identify the design tools; these are independent demo graphics.
 * Geometry checked against official brand assets:
 * https://www.framer.com/brand
 * https://www.figma.com/using-the-figma-brand/
 * https://github.com/react/react/blob/main/fixtures/dom/public/react-logo.svg
 * https://brand.webflow.com/brand-assets
 * https://notion.notion.site/Media-Kit-205535b1d9c4440497a3d7a2ac096286
 * Notion mirror: https://commons.wikimedia.org/wiki/File:Notion-logo.svg
 *
 * Integration: use designerHitShapes[item.design] before the legacy hit shape;
 * use designerSupportPoints[item.design] before legacy support-point generation.
 * Support coordinates use artwork-width units, centred at 0; +Y points down.
 * Keep the existing StickerItem type, adding optional mobileX/mobileY fields.
 */
const initialStickers: StickerItem[] = [
    {
        "design": "framer",
        "label": "Framer",
        "subtitle": "",
        "color": "#111111",
        "ink": "#FFFFFF",
        "material": "vinyl",
        "width": 246,
        "x": 19,
        "y": 25,
        "mobileX": 26,
        "mobileY": 16,
        "rotation": -18,
        "wear": 0.06
    },
    {
        "design": "figma",
        "label": "Figma",
        "subtitle": "",
        "color": "#FFFFFF",
        "ink": "#111111",
        "material": "vinyl",
        "width": 180,
        "x": 47,
        "y": 18,
        "mobileX": 72,
        "mobileY": 17,
        "rotation": 17,
        "wear": 0.03
    },
    {
        "design": "notion",
        "label": "Notion",
        "subtitle": "",
        "color": "#FFFFFF",
        "ink": "#111111",
        "material": "paper",
        "width": 184,
        "x": 78,
        "y": 27,
        "mobileX": 25,
        "mobileY": 36,
        "rotation": 9,
        "wear": 0.13
    },
    {
        "design": "react",
        "label": "React",
        "subtitle": "",
        "color": "#61DAFB",
        "ink": "#173B4B",
        "material": "vinyl",
        "width": 230,
        "x": 65,
        "y": 51,
        "mobileX": 72,
        "mobileY": 37,
        "rotation": -22,
        "wear": 0.04
    },
    {
        "design": "claude",
        "label": "Claude",
        "subtitle": "",
        "color": "#D97757",
        "ink": "#FFFDF7",
        "material": "paper",
        "width": 226,
        "x": 39,
        "y": 48,
        "mobileX": 30,
        "mobileY": 55,
        "rotation": -10,
        "wear": 0.08
    },
    {
        "design": "cursor",
        "label": "Cursor",
        "subtitle": "",
        "color": "#214DE7",
        "ink": "#FFFFFF",
        "material": "vinyl",
        "width": 194,
        "x": 16,
        "y": 64,
        "mobileX": 23,
        "mobileY": 76,
        "rotation": -27,
        "wear": 0.1
    },
    {
        "design": "asterisk",
        "label": "Asterisk",
        "subtitle": "",
        "color": "#CED3D5",
        "ink": "#293242",
        "material": "foil",
        "width": 230,
        "x": 44,
        "y": 80,
        "mobileX": 53,
        "mobileY": 87,
        "rotation": 12,
        "wear": 0.08
    },
    {
        "design": "save",
        "label": "Save",
        "subtitle": "v.03",
        "color": "#F36B38",
        "ink": "#382518",
        "material": "vinyl",
        "width": 202,
        "x": 76,
        "y": 81,
        "mobileX": 81,
        "mobileY": 75,
        "rotation": -12,
        "wear": 0.17
    },
    {
        "design": "chatgpt",
        "label": "ChatGPT",
        "subtitle": "",
        "color": "#111111",
        "ink": "#FFFDF7",
        "material": "vinyl",
        "width": 184,
        "x": 87,
        "y": 54,
        "mobileX": 76,
        "mobileY": 56,
        "rotation": 15,
        "wear": 0.035
    }
]
const safeText = (s: string) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!))

// Pixel-space silhouettes. The interaction maps below derive from these same points.
const designerMemoPoints = [[31,24],[57,29],[78,22],[100,27],[123,23],[147,28],[170,21],[191,25],[219,20],[242,26],[267,22],[272,57],[268,88],[275,116],[269,148],[275,177],[270,205],[276,239],[268,271],[246,267],[223,275],[201,270],[177,277],[153,272],[129,278],[106,272],[81,277],[58,271],[29,275],[33,244],[26,213],[31,186],[25,154],[31,123],[26,91],[32,61]]
const designerCursorPoints = [[46,24],[252,166],[168,181],[209,258],[171,278],[128,199],[72,260]]
const designerSavePoints = [[51,31],[219,31],[268,80],[268,255],[256,269],[44,269],[31,256],[31,45]]
const designerAsteriskPoints = Array.from({length:8}, (_,i) => {
    const a = i * Math.PI / 4 - Math.PI / 2
    return [[Math.cos(a-.105)*132+150,Math.sin(a-.105)*132+150],[Math.cos(a+.105)*132+150,Math.sin(a+.105)*132+150],[Math.cos(a+Math.PI/8)*55+150,Math.sin(a+Math.PI/8)*55+150]]
}).flat()
const designerFramerPolygons = [
    [[74,27],[226,27],[226,103],[150,103]],
    [[74,103],[150,103],[226,179],[74,179]],
    [[74,179],[150,179],[150,255]],
]
const designerFigmaPaths = [
    "M66 234C66 210.804 84.804 192 108 192H150V234C150 257.196 131.196 276 108 276C84.804 276 66 257.196 66 234Z",
    "M150 24V108H192C215.196 108 234 89.196 234 66C234 42.804 215.196 24 192 24H150Z",
    "M233.65 150A42 42 0 1 1 149.65 150A42 42 0 1 1 233.65 150Z",
    "M66 66C66 89.196 84.804 108 108 108H150V24H108C84.804 24 66 42.804 66 66Z",
    "M66 150C66 173.196 84.804 192 108 192H150V108H108C84.804 108 66 126.804 66 150Z",
]
const designerPolygon = (pts: number[][]) => pts.map(p=>p[0].toFixed(2)+","+p[1].toFixed(2)).join(" ")
const designerCSSPolygon = (pts: number[][]) => "polygon("+pts.map(p=>(p[0]/3).toFixed(3)+"% "+(p[1]/3).toFixed(3)+"%").join(",")+")"
const designerCircle = (x:number,y:number,r:number,start=0,end=Math.PI*2,count=40) => Array.from({length:count+1},(_,i)=>[x+Math.cos(start+(end-start)*i/count)*r,y+Math.sin(start+(end-start)*i/count)*r])
// Approximate hit contour follows the five lobes, including their connecting white margin.
const designerFigmaHit = [
    [108,15],[192,15],...designerCircle(192,66,51,-Math.PI/2,Math.PI/2,16),
    ...designerCircle(191.65,150,51,-Math.PI/2,Math.PI/2,16),
    [159,201],[159,234],...designerCircle(108,234,51,0,Math.PI,16),
    [57,192],[57,108],...designerCircle(108,66,51,Math.PI,Math.PI*1.5,8),
]
const designerHitShapes: Record<string,string> = {
    framer: designerCSSPolygon([[66,19],[234,19],[234,111],[170,111],[234,175],[234,187],[158,187],[158,267],[66,183],[66,95],[128,95],[66,33]]),
    figma: designerCSSPolygon(designerFigmaHit),
    memo: designerCSSPolygon(designerMemoPoints),
    cursor: designerCSSPolygon(designerCursorPoints),
    asterisk: designerCSSPolygon(designerAsteriskPoints),
    save: designerCSSPolygon(designerSavePoints),
}
// White die-cut margins are part of the physical support. Sample their rounded joins.
const designerSupport = (pts:number[][],border:number) => pts.flatMap(p=>Array.from({length:border?12:1},(_,i)=>{
    const a=i*Math.PI/6
    return [(p[0]+Math.cos(a)*border-150)/300,(p[1]+Math.sin(a)*border-150)/300]
}))
const designerSupportPoints: Record<string,number[][]> = {
    framer: designerSupport(designerFramerPolygons.flat(),8),
    figma: designerSupport([
        ...designerCircle(108,66,42),...designerCircle(192,66,42),
        ...designerCircle(108,150,42),...designerCircle(191.65,150,42),
        ...designerCircle(108,234,42),[150,192],[150,234]
    ],9),
    memo: designerSupport(designerMemoPoints,1),
    cursor: designerSupport(designerCursorPoints,7),
    asterisk: designerSupport(designerAsteriskPoints,5),
    save: designerSupport(designerSavePoints,6),
}

// Source-checked marks: React official repository, Webflow official Brand Assets.
// Notion: Media Kit geometry mirrored at Wikimedia Commons; official ZIP link was unavailable.
const designerReactLogoPaths = ["M18.91 6.633q-.367-.126-.74-.234.062-.252.115-.506c.56-2.72.194-4.912-1.058-5.634-1.2-.692-3.162.03-5.144 1.755q-.293.255-.572.525-.187-.18-.38-.352C9.053.344 6.97-.432 5.72.29 4.523.984 4.168 3.045 4.67 5.623q.077.383.17.762c-.293.084-.578.173-.85.268-2.435.85-3.99 2.18-3.99 3.56 0 1.425 1.67 2.855 4.206 3.72q.308.106.622.196-.102.407-.18.82c-.482 2.533-.106 4.545 1.09 5.235 1.234.712 3.306-.02 5.325-1.784q.24-.208.48-.442.302.293.62.568c1.956 1.682 3.886 2.36 5.08 1.67 1.235-.715 1.636-2.876 1.115-5.505q-.06-.3-.138-.614.218-.064.428-.133C21.285 13.07 23 11.657 23 10.213c0-1.386-1.605-2.725-4.09-3.58zM12.73 2.756c1.698-1.478 3.285-2.06 4.01-1.644.77.444 1.068 2.235.584 4.584q-.047.23-.103.457a23.538 23.538 0 0 0-3.076-.486A23.08 23.08 0 0 0 12.2 3.24q.258-.248.528-.484zM6.79 11.39q.313.604.653 1.19.347.6.722 1.183a20.922 20.922 0 0 1-2.12-.34c.204-.657.454-1.34.746-2.032zm0-2.31c-.286-.678-.53-1.345-.73-1.99.655-.147 1.355-.267 2.084-.358q-.366.57-.705 1.16-.34.586-.65 1.188zm.522 1.156q.454-.945.98-1.854.522-.91 1.114-1.775c.684-.052 1.385-.08 2.094-.08.712 0 1.414.028 2.098.08q.585.865 1.108 1.77.526.906.992 1.845-.46.948-.988 1.862-.523.908-1.104 1.78c-.682.05-1.387.074-2.106.074-.716 0-1.412-.022-2.082-.066q-.596-.87-1.124-1.783-.526-.91-.982-1.854zm8.25 2.34q.346-.603.666-1.22A20.867 20.867 0 0 1 17 13.38a20.852 20.852 0 0 1-2.145.365q.364-.578.706-1.17zm.656-3.495q-.318-.604-.66-1.196-.338-.582-.7-1.15c.733.093 1.436.216 2.097.367a20.96 20.96 0 0 1-.737 1.98zM11.51 3.945a21.013 21.013 0 0 1 1.354 1.634q-1.358-.065-2.718 0c.447-.59.905-1.138 1.365-1.634zM6.214 1.14c.77-.445 2.47.19 4.264 1.783.115.102.23.208.345.318a23.545 23.545 0 0 0-1.96 2.426 24.008 24.008 0 0 0-3.068.477q-.088-.352-.158-.71v.002c-.433-2.21-.146-3.876.577-4.294zM5.09 13.183q-.285-.082-.566-.177A8.324 8.324 0 0 1 1.84 11.58a2.03 2.03 0 0 1-.857-1.368c0-.837 1.248-1.905 3.33-2.63q.393-.138.792-.25a23.565 23.565 0 0 0 1.12 2.904 23.922 23.922 0 0 0-1.134 2.946zm5.326 4.48a8.322 8.322 0 0 1-2.575 1.61 2.03 2.03 0 0 1-1.612.062c-.725-.42-1.027-2.034-.616-4.2q.074-.385.168-.764a23.104 23.104 0 0 0 3.1.448 23.91 23.91 0 0 1 1.974 2.44q-.214.207-.438.403zm1.122-1.112c-.466-.502-.93-1.058-1.384-1.656q.66.026 1.346.026.703 0 1.388-.03a20.894 20.894 0 0 1-1.35 1.66zm5.967 1.367a2.03 2.03 0 0 1-.753 1.428c-.725.42-2.275-.126-3.947-1.564q-.287-.246-.578-.526a23.09 23.09 0 0 0 1.928-2.448 22.936 22.936 0 0 0 3.115-.48q.07.284.124.556a8.32 8.32 0 0 1 .11 3.035zm.834-4.907c-.127.042-.256.082-.388.12a23.06 23.06 0 0 0-1.164-2.913 23.05 23.05 0 0 0 1.12-2.87c.234.067.463.14.683.215 2.13.732 3.428 1.816 3.428 2.65 0 .89-1.403 2.044-3.68 2.798z", "M11.5 8.159a2.054 2.054 0 1 1-2.054 2.052A2.054 2.054 0 0 1 11.5 8.16"]
const designerWebflowLogoPaths = ["M1080 0L735.386 673.684H411.695L555.916 394.481H549.445C430.464 548.934 252.942 650.61 -0.000488281 673.684V398.344C-0.000488281 398.344 161.813 388.787 256.938 288.776H-0.000488281V0.0053214H288.771V237.515L295.252 237.489L413.254 0.0053214H631.644V236.009L638.126 235.999L760.555 0H1080Z"]
const designerNotionLogoPaths = ["M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z", "M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z"]

const designerReactPoints = Array.from({length:144},(_,i)=>{
    const a=i*Math.PI/72
    const r=Math.max(...[0,Math.PI/3,Math.PI*2/3].map(t=>1/Math.sqrt(Math.pow(Math.cos(a-t)/120.75,2)+Math.pow(Math.sin(a-t)/43.05,2))))+7
    return [150+Math.cos(a)*r,150+Math.sin(a)*r]
})
const designerNotionPoints=[[39,44],[182,34],[217,39],[261,70],[261,246],[245,260],[91,269],[70,262],[39,220]]
const designerCommandPoints=[[64,34],[236,34],[254,50],[277,230],[276,246],[255,260],[45,260],[24,246],[23,230],[46,50]]
const designerWebflowPoints=[[28,74],[93.26,74],[93.26,127.68],[94.73,127.68],[121.4,74],[170.74,74],[170.74,127.34],[172.22,127.34],[199.89,74],[272.08,74],[194.2,226.25],[121.04,226.25],[153.64,163.15],[152.17,163.15],[127,191],[95,213],[62,223],[28,226.25],[28,164.03],[53,159],[74,147],[86.1,139.27],[28,139.27]]
Object.assign(designerHitShapes,{
    react:designerCSSPolygon(designerReactPoints),
    notion:designerCSSPolygon(designerNotionPoints),
    webflow:designerCSSPolygon(designerWebflowPoints),
    command:designerCSSPolygon(designerCommandPoints),
})
Object.assign(designerSupportPoints,{
    react:designerSupport(designerReactPoints,0),
    notion:designerSupport(designerNotionPoints,8),
    webflow:designerSupport(designerWebflowPoints,7),
    command:designerSupport(designerCommandPoints,6),
})


const designerClaudePath = "M54.375 118.75L56.125 111L58.125 101L59.75 93L61.25 83.125L62.125 79.875L62 79.625L61.375 79.75L53.875 90L42.5 105.375L33.5 114.875L31.375 115.75L27.625 113.875L28 110.375L30.125 107.375L42.5 91.5L50 81.625L54.875 76L54.75 75.25H54.5L21.5 96.75L15.625 97.5L13 95.125L13.375 91.25L14.625 90L24.5 83.125L49.125 69.375L49.5 68.125L49.125 67.5H47.875L43.75 67.25L29.75 66.875L17.625 66.375L5.75 65.75L2.75 65.125L0 61.375L0.25 59.5L2.75 57.875L6.375 58.125L14.25 58.75L26.125 59.5L34.75 60L47.5 61.375H49.5L49.75 60.5L49.125 60L48.625 59.5L36.25 51.25L23 42.5L16 37.375L12.25 34.75L10.375 32.375L9.625 27.125L13 23.375L17.625 23.75L18.75 24L23.375 27.625L33.25 35.25L46.25 44.875L48.125 46.375L49 45.875V45.5L48.125 44.125L41.125 31.375L33.625 18.375L30.25 13L29.375 9.75C29.0417 8.625 28.875 7.375 28.875 6L32.75 0.750006L34.875 0L40.125 0.750006L42.25 2.625L45.5 10L50.625 21.625L58.75 37.375L61.125 42.125L62.375 46.375L62.875 47.75H63.75V47L64.375 38L65.625 27.125L66.875 13.125L67.25 9.125L69.25 4.375L73.125 1.87501L76.125 3.25L78.625 6.875L78.25 9.125L76.875 18.75L73.875 33.875L72 44.125H73.125L74.375 42.75L79.5 36L88.125 25.25L91.875 21L96.375 16.25L99.25 14H104.625L108.5 19.875L106.75 26L101.25 33L96.625 38.875L90 47.75L86 54.875L86.375 55.375H87.25L102.125 52.125L110.25 50.75L119.75 49.125L124.125 51.125L124.625 53.125L122.875 57.375L112.625 59.875L100.625 62.25L82.75 66.5L82.5 66.625L82.75 67L90.75 67.75L94.25 68H102.75L118.5 69.125L122.625 71.875L125 75.125L124.625 77.75L118.25 80.875L109.75 78.875L89.75 74.125L83 72.5H82V73L87.75 78.625L98.125 88L111.25 100.125L111.875 103.125L110.25 105.625L108.5 105.375L97 96.625L92.5 92.75L82.5 84.375H81.875V85.25L84.125 88.625L96.375 107L97 112.625L96.125 114.375L92.875 115.5L89.5 114.875L82.25 104.875L74.875 93.5L68.875 83.375L68.25 83.875L64.625 121.625L63 123.5L59.25 125L56.125 122.625L54.375 118.75Z"
const designerChatGPTPath = "M508.749 317.399C516.777 287.314 508.991 253.884 485.389 230.282C461.788 206.681 428.36 198.895 398.273 206.923C376.231 184.928 343.39 174.956 311.148 183.596C278.906 192.234 255.45 217.292 247.36 247.361C217.291 255.451 192.233 278.91 183.595 311.149C174.957 343.391 184.927 376.232 206.924 398.274C198.896 428.359 206.683 461.789 230.284 485.391C253.885 508.992 287.313 516.779 317.401 508.75C339.442 530.745 372.286 540.717 404.525 532.079C436.767 523.441 460.223 498.384 468.313 468.315C498.383 460.224 523.44 436.766 532.078 404.526C540.716 372.285 530.747 339.443 508.749 317.402V317.399ZM470.899 244.776C486.892 260.77 493.488 282.601 490.687 303.412L415.577 260.046C412.411 258.218 408.509 258.218 405.345 260.046L317.401 310.82V277.526C317.401 275.191 318.652 273.005 320.676 271.837L387.644 233.174C414.178 218.353 448.346 222.223 470.901 244.776H470.899ZM357.837 311.144L398.275 334.491V381.185L357.837 404.532L317.398 381.185V334.491L357.837 311.144ZM264.776 269.693C265.207 239.305 285.644 211.649 316.453 203.393C338.3 197.54 360.505 202.744 377.127 215.573L302.014 258.937C298.848 260.764 296.898 264.144 296.898 267.798V369.346L268.065 352.699C266.043 351.531 264.776 349.353 264.776 347.017V269.691V269.693ZM203.391 316.454C209.244 294.608 224.854 277.978 244.276 269.999V356.73C244.276 360.384 246.226 363.763 249.392 365.591L337.337 416.365L308.503 433.013C306.481 434.181 303.961 434.188 301.939 433.02L234.971 394.357C208.868 378.789 195.138 347.261 203.391 316.454ZM244.775 470.9C228.781 454.906 222.186 433.075 224.986 412.264L300.096 455.63C303.263 457.457 307.164 457.457 310.328 455.63L398.273 404.856V438.149C398.273 440.485 397.022 442.671 394.997 443.839L328.029 482.502C301.495 497.322 267.327 493.452 244.772 470.9H244.775ZM450.897 445.982C450.466 476.371 430.029 504.027 399.22 512.283C377.373 518.136 355.168 512.932 338.547 500.102L413.659 456.738C416.826 454.911 418.775 451.532 418.775 447.877V346.329L447.609 362.977C449.631 364.145 450.897 366.323 450.897 368.659V445.985V445.982ZM512.282 399.221C506.429 421.068 490.819 437.697 471.397 445.676V358.946C471.397 355.292 469.448 351.912 466.281 350.085L378.336 299.311L407.17 282.663C409.192 281.495 411.712 281.487 413.734 282.655L480.702 321.318C506.805 336.887 520.536 368.415 512.282 399.221Z"
// Original marks: https://claude.com/ and the official OpenAI cookbook brand assets.
// Sample the original outer contour for matching pointer and peel geometry.
function designerPathPoints(d:string,tx:number,ty:number,scale:number){
    const tokens=d.match(/[MLHVCZ]|-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[]
    const points:number[][]=[];let i=0,x=0,y=0,sx=0,sy=0,command=""
    const number=()=>Number(tokens[i++])
    const push=(px:number,py:number)=>points.push([tx+px*scale,ty+py*scale])
    while(i<tokens.length){
        if(/^[MLHVCZ]$/i.test(tokens[i]))command=tokens[i++].toUpperCase()
        if(command==="M"||command==="L"){x=number();y=number();if(command==="M"){sx=x;sy=y;command="L"}push(x,y)}
        else if(command==="H"){x=number();push(x,y)}
        else if(command==="V"){y=number();push(x,y)}
        else if(command==="C"){
            const x0=x,y0=y,x1=number(),y1=number(),x2=number(),y2=number(),x3=number(),y3=number()
            for(let n=1;n<=12;n++){const t=n/12,u=1-t;push(u*u*u*x0+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,u*u*u*y0+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3)}
            x=x3;y=y3
        }else if(command==="Z"){x=sx;y=sy;push(x,y);command=""}
        else break
    }
    return points
}
const designerClaudePoints=designerPathPoints(designerClaudePath,25,25,2)
const designerChatGPTOuter=designerChatGPTPath.split("ZM")[0]+"Z"
const designerChatGPTPoints=designerPathPoints(designerChatGPTOuter,-88.56,-88.56,2/3)
Object.assign(designerHitShapes,{
    claude:designerCSSPolygon(designerClaudePoints),
    chatgpt:designerCSSPolygon(designerChatGPTPoints),
})
Object.assign(designerSupportPoints,{
    claude:designerSupport(designerClaudePoints,6),
    chatgpt:designerSupport(designerChatGPTPoints,7),
})


/** Uploaded images must stay on Framer's fixed asset origin. No arbitrary hosts or data URLs. */
function trustedStickerUpload(value: unknown): string | null {
    if (typeof value !== "string" || !value) return null
    try {
        const url = new URL(value)
        if (url.origin !== "https://framerusercontent.com" || url.username || url.password || !url.pathname.startsWith("/images/")) return null
        return url.href
    } catch { return null }
}

function stickerArtwork(item: StickerItem) {
    if (!designerHitShapes[item.design]) return legacyStickerArtwork(item)
    const color=safeText(item.color), ink=safeText(item.ink), title=safeText(item.label), sub=safeText(item.subtitle)
    let content="", shape="", defs=""
    const white="#FFFDF7"
    const tinySpeckles=Array.from({length:76},(_,i)=>{
        const x=17+((i*83+i*i*7)%270), y=17+((i*47+i*i*3)%270), r=i%7===0?1.05:.45
        return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#3F382C" opacity="'+(i%3===0?.09:.045)+'"/>'
    }).join("")
    if(item.design==="claude"){
        shape='<g transform="translate(25 25) scale(2)"><path d="'+designerClaudePath+'"/></g>'
        content='<use href="#cut" fill="#FFFDF7" stroke="#FFFDF7" stroke-width="6" stroke-linejoin="round"/><use href="#cut" fill="#D97757"/>'
        content+='<g clip-path="url(#clip)">'+tinySpeckles+'</g>'
    }else if(item.design==="chatgpt"){
        shape='<g transform="translate(-88.56 -88.56) scale(.666666667)"><path d="'+designerChatGPTOuter+'"/></g>'
        content='<use href="#cut" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="21" stroke-linejoin="round"/>'
        content+='<g transform="translate(-88.56 -88.56) scale(.666666667)"><path d="'+designerChatGPTPath+'" fill="#111111"/></g>'
    }else if(item.design==="react"){
        const outer=designerReactLogoPaths[0].split("zM")[0]+"z"
        shape='<g transform="translate(29.25 42.567) scale(10.5)"><path d="'+outer+'"/></g>'
        content='<use href="#cut" fill="#FFFDF7" stroke="#FFFDF7" stroke-width="1.333333" stroke-linejoin="round"/>'
        content+='<g transform="translate(29.25 42.567) scale(10.5)" fill="#61DAFB">'+designerReactLogoPaths.map(d=>'<path d="'+d+'"/>').join("")+'</g>'
    }else if(item.design==="notion"){
        shape='<g transform="translate(39 34) scale(2.32)"><path d="'+designerNotionLogoPaths[0]+'"/></g>'
        content='<use href="#cut" fill="#FFFDF7" stroke="#FFFDF7" stroke-width="6.896552" stroke-linejoin="round"/>'
        content+='<g transform="translate(39 34) scale(2.32)"><path d="'+designerNotionLogoPaths[0]+'" fill="#FFFFFF"/><path d="'+designerNotionLogoPaths[1]+'" fill="#111111" fill-rule="evenodd"/></g>'
    }else if(item.design==="webflow"){
        shape='<g transform="translate(28 74) scale(.226)"><path d="'+designerWebflowLogoPaths[0]+'"/></g>'
        content='<use href="#cut" fill="#FFFDF7" stroke="#FFFDF7" stroke-width="61.946903" stroke-linejoin="round"/><use href="#cut" fill="#146EF5" fill-rule="evenodd"/>'
    }else if(item.design==="command"){
        shape='<path d="M64 34H236Q251 34 254 50L277 230Q281 250 255 260H45Q19 250 23 230L46 50Q49 34 64 34Z"/>'
        content='<use href="#cut" fill="#FFFDF7" stroke="#FFFDF7" stroke-width="12" stroke-linejoin="round"/><use href="#cut" fill="#A9B392" stroke="#8C987B" stroke-width="1.3"/>'
        content+='<path d="M64 34H236Q251 34 254 50L262 218H38L46 50Q49 34 64 34Z" fill="'+color+'"/>'
        content+='<path d="M76 51H224Q232 51 233 60L244 201Q244 208 236 208H64Q56 208 56 201L67 60Q68 51 76 51Z" fill="#EFF4D9" stroke="#A6B48D" stroke-width="1.4"/>'
        content+='<path d="M78 57H222M61 201H238" stroke="#FFFFFF" stroke-width="2" opacity=".8"/>'
        content+='<g transform="translate(23 13) scale(.84)" stroke="'+ink+'" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M116 111H98Q82 111 82 95Q82 79 98 79Q116 79 116 97V193Q116 211 98 211Q82 211 82 195Q82 179 98 179H202Q218 179 218 195Q218 211 202 211Q184 211 184 193V97Q184 79 202 79Q218 79 218 95Q218 111 202 111H116"/></g>'
        content+='<text x="150" y="241" font-family="Courier New,monospace" font-size="10" letter-spacing="2" fill="#49563D">COMMAND</text><path d="M50 228H59M242 228H251" stroke="#6F7E5C" stroke-width="1.2"/>'
        content+='<g clip-path="url(#clip)">'+tinySpeckles+'</g>'
    }else if(item.design==="framer"){
        const paths=designerFramerPolygons.map(p=>'<polygon points="'+designerPolygon(p)+'"/>').join("")
        content='<g fill="'+white+'" stroke="'+white+'" stroke-width="16" stroke-linejoin="round">'+paths+'</g><g fill="#090909">'+paths+'</g>'
        // The mark stays black; edge highlights belong to its white sticker backing.
        content+='<path d="M75 22H223M69 111V174" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".9"/>'
    }else if(item.design==="figma"){
        const colors=["#24CB71","#FF7237","#00B6FF","#FF3737","#874FFF"]
        content='<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="18" stroke-linejoin="round">'+designerFigmaPaths.map(d=>'<path d="'+d+'"/>').join("")+'</g>'
        content+=designerFigmaPaths.map((d,i)=>'<path d="'+d+'" fill="'+colors[i]+'"/>').join("")
    }else if(item.design==="memo"){
        shape='<polygon points="'+designerPolygon(designerMemoPoints)+'"/>'
        defs='<pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#6E91BE" stroke-width=".65" opacity=".36"/></pattern>'
        content='<use href="#cut" fill="'+color+'" stroke="#EAE0C6" stroke-width="1.4"/>'
        content+='<g clip-path="url(#clip)"><rect x="0" y="0" width="300" height="300" fill="url(#grid)"/><path d="M58 18V282" stroke="#CF7565" stroke-width="1" opacity=".47"/>'+tinySpeckles
        content+='<text x="82" y="67" text-anchor="start" font-family="Bradley Hand,Comic Sans MS,cursive" font-size="20" font-weight="600" transform="rotate(-4 82 67)">'+(title||"idea / 03")+'</text>'
        content+='<g stroke="'+ink+'" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M84 100Q151 96 225 101L222 190Q155 187 86 192Z" stroke-width="2.5"/><path d="M86 117Q151 120 222 117M96 108H98M105 108H107M114 108H116" stroke-width="2"/><path d="M100 174L128 138L154 165L174 143L210 175Z" stroke-width="2.3"/><circle cx="192" cy="133" r="6" stroke-width="2"/><path d="M73 204Q115 230 161 210M153 207L162 210L156 220" stroke-width="2.6"/><path d="M198 220l7 8 17-21" stroke-width="3"/></g>'
        content+='<text x="91" y="250" text-anchor="start" font-family="Bradley Hand,Comic Sans MS,cursive" font-size="17" transform="rotate(-5 91 250)">'+(sub||"try this")+'</text></g>'
        content+='<path d="M33 31L58 36M243 266L266 261" stroke="#FFFFFF" stroke-width="2" opacity=".55"/>'
    }else if(item.design==="cursor"){
        shape='<polygon points="'+designerPolygon(designerCursorPoints)+'"/>'
        content='<use href="#cut" fill="'+white+'" stroke="'+white+'" stroke-width="14" stroke-linejoin="round"/><use href="#cut" fill="'+color+'"/>'
        content+='<g clip-path="url(#clip)"><path d="M58 47L228 164L154 178" stroke="#90A7FF" stroke-width="2" opacity=".68" fill="none"/>'+tinySpeckles+'</g>'
        content+='<path d="M174 261L187 254" stroke="#102C9A" stroke-width="2" opacity=".45"/>'
    }else if(item.design==="asterisk"){
        shape='<polygon points="'+designerPolygon(designerAsteriskPoints)+'"/>'
        defs='<linearGradient id="silver" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#EFF2F0"/><stop offset=".24" stop-color="#A6B0B8"/><stop offset=".46" stop-color="#F9FAF6"/><stop offset=".55" stop-color="#BAC6D1"/><stop offset=".77" stop-color="#DFDDE6"/><stop offset="1" stop-color="#929DA6"/></linearGradient><linearGradient id="prism" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8FA8D8"/><stop offset=".32" stop-color="#DFDDD3"/><stop offset=".57" stop-color="#BEA4D3"/><stop offset=".8" stop-color="#A4D5C4"/><stop offset="1" stop-color="#F0DFB4"/></linearGradient>'
        content='<use href="#cut" fill="'+white+'" stroke="'+white+'" stroke-width="10" stroke-linejoin="round"/><use href="#cut" fill="url(#silver)" stroke="#A7ADB3" stroke-width=".8" stroke-linejoin="round"/>'
        content+='<g clip-path="url(#clip)"><rect width="300" height="300" fill="url(#prism)" opacity=".32"/><path d="M-20 254L257-20M0 278L278 0M22 300L300 22" stroke="#FFFFFF" stroke-width="1" opacity=".45"/><circle cx="150" cy="150" r="41" fill="none" stroke="#FFFFFF" stroke-width=".9" opacity=".65"/>'+tinySpeckles+'</g>'
        content+='<circle cx="150" cy="150" r="8" fill="none" stroke="'+ink+'" stroke-width="1.4" opacity=".55"/><circle cx="150" cy="150" r="2" fill="'+ink+'" opacity=".7"/>'
    }else if(item.design==="save"){
        shape='<polygon points="'+designerPolygon(designerSavePoints)+'"/>'
        content='<use href="#cut" fill="'+white+'" stroke="'+white+'" stroke-width="12" stroke-linejoin="round"/><use href="#cut" fill="'+color+'" stroke="#D95427" stroke-width="1"/>'
        content+='<g clip-path="url(#clip)">'+tinySpeckles+'<path d="M42 49V252M52 260H253" stroke="#FFD2AD" stroke-width="2" opacity=".65"/></g>'
        content+='<path d="M80 31H214V119Q214 128 205 128H89Q80 128 80 119Z" fill="#FBE4C6"/><path d="M166 45H197V111H166Z" fill="'+ink+'"/>'
        content+='<path d="M65 171Q65 162 74 162H225Q234 162 234 171V268H65Z" fill="#FFF5DF"/><path d="M78 194H221M78 245H221" stroke="#D8BBA0" stroke-width=".9"/>'
        content+='<text x="80" y="185" text-anchor="start" font-family="Courier New,monospace" font-size="11" letter-spacing="1.5">'+(sub||"v.03")+'</text><text x="149" y="232" font-family="Arial,Helvetica,sans-serif" font-size="35" font-weight="800" letter-spacing="-1.5">SAVE</text>'
        content+='<rect x="44" y="237" width="8" height="15" rx="1.5" fill="'+ink+'" opacity=".65"/><rect x="247" y="237" width="8" height="15" rx="1.5" fill="'+ink+'" opacity=".65"/>'
    }
    const shapes=shape?'<g id="cut">'+shape+'</g><clipPath id="clip">'+shape+'</clipPath>':""
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 300 300"><defs>'+shapes+defs+'</defs><g fill="'+ink+'" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">'+content+'</g></svg>')
}

function legacyStickerArtwork(item: StickerItem) {
    if (item.design === "custom") { const upload = trustedStickerUpload(item.image?.src); if (upload) return upload }
    const color = safeText(item.color), ink = safeText(item.ink)
    const title = safeText(item.label), sub = safeText(item.subtitle)
    const base = `fill="${color}" stroke="#FFFDF3" stroke-width="10" stroke-linejoin="round"`
    let content = ""
    if (item.design === "burst") {
        const points = Array.from({ length: 32 }, (_, i) => {
            const angle = i * Math.PI / 16 - Math.PI / 2, radius = i % 2 ? 112 : 143
            return `${150 + Math.cos(angle) * radius},${150 + Math.sin(angle) * radius}`
        }).join(" ")
        content = `<polygon points="${points}" ${base}/><path d="M100 77 Q150 53 200 77" fill="none" stroke="${ink}" stroke-width="2"/><text x="150" y="143" font-size="48" font-weight="900" letter-spacing="-2">${title}</text><text x="150" y="181" font-size="29" font-weight="900" letter-spacing="-1">${sub}</text><path d="M126 213h48m-24-10v20" fill="none" stroke="${ink}" stroke-width="3"/>`
    } else if (item.design === "ticket") {
        content = `<path d="M18 60H282V112Q264 112 264 130Q264 148 282 148V233H18V148Q36 148 36 130Q36 112 18 112Z" ${base}/><rect x="40" y="78" width="220" height="137" rx="2" fill="none" stroke="${ink}" stroke-width="1.4"/><path d="M55 97H245M55 174H245" stroke="${ink}" stroke-width="1" stroke-dasharray="2 4"/><text x="150" y="91" font-family="monospace" font-size="9" letter-spacing="3">A SMALL COLLECTION</text><text x="150" y="144" font-size="31" font-weight="900" letter-spacing="-1.8">${title}</text><text x="150" y="163" font-family="monospace" font-size="8" letter-spacing="1">${sub}</text><g stroke="${ink}" stroke-width="2">${Array.from({ length: 27 }, (_, i) => `<path d="M${63+i*4} 186v${i%3===0?15:12}"/>`).join("")}</g><text x="225" y="199" font-family="monospace" font-size="13">No. 01</text>`
    } else if (item.design === "orbit") {
        content = `<path d="M150 12C180 12 190 36 213 40C240 44 249 64 252 88C278 107 287 133 277 157C289 184 274 209 251 221C245 251 220 261 197 261C178 287 149 291 125 279C95 288 73 274 64 251C33 244 25 218 28 195C7 175 10 145 23 125C14 98 31 73 56 65C67 36 94 29 117 33C125 18 137 12 150 12Z" ${base}/><circle cx="150" cy="145" r="69" fill="none" stroke="${ink}" stroke-width="2"/><ellipse cx="150" cy="145" rx="102" ry="30" transform="rotate(-32 150 145)" fill="none" stroke="${ink}" stroke-width="3"/><path d="M150 91l10 39 39 15-39 10-10 40-11-40-39-10 39-15Z" fill="${ink}"/><circle cx="222" cy="96" r="8" fill="${ink}"/><text x="150" y="236" font-family="monospace" font-size="15" font-weight="700" letter-spacing="2">${title}</text><text x="150" y="253" font-family="monospace" font-size="8" letter-spacing="1">${sub}</text>`
    } else if (item.design === "bubble") {
        content = `<path d="M47 39H247Q285 39 285 79V211Q285 245 247 245H104L55 279L62 245H47Q15 245 15 211V79Q15 39 47 39Z" ${base}/><path d="M50 78h33m-16-16v33" stroke="${ink}" stroke-width="3"/><circle cx="234" cy="80" r="13" fill="none" stroke="${ink}" stroke-width="2"/><text x="150" y="145" font-size="34" font-weight="800" letter-spacing="-1.6">${title}</text><text x="150" y="184" font-size="34" font-weight="800" letter-spacing="-1.6">${sub}</text><path d="M103 212Q150 224 197 212" fill="none" stroke="${ink}" stroke-width="2"/>`
    } else {
        content = `<path d="M52 21Q150 3 248 21Q275 29 279 56Q294 151 279 245Q275 272 248 279Q150 297 52 279Q25 272 21 245Q6 151 21 56Q25 29 52 21Z" ${base}/><path d="M61 69Q150 35 239 69" stroke="${ink}" stroke-width="2" fill="none"/><text x="150" y="151" font-size="75" font-weight="900" letter-spacing="-5">${title}</text><text x="150" y="184" font-size="22" font-weight="800" letter-spacing="-1">${sub}</text><path d="M131 226Q150 244 169 226" stroke="${ink}" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="136" cy="216" r="3" fill="${ink}"/><circle cx="164" cy="216" r="3" fill="${ink}"/>`
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 300 300"><g font-family="Arial,Helvetica,sans-serif" fill="${ink}" text-anchor="middle">${content}</g></svg>`)}`
}



function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update(); query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])
    return reduced
}

function StickerActor({ item, index, board, size, material, reset, z, onSelect, audio, sound, volume, peel, reduced, canvasMode, dragLock }: any) {
    const outer=React.useRef<HTMLDivElement>(null), sheet=React.useRef<HTMLDivElement>(null), canvas=React.useRef<HTMLCanvasElement>(null)
    const renderer=React.useRef<StickerRendererHandle|null>(null)
    const [ready,setReady]=React.useState(false), [keyFocus,setKeyFocus]=React.useState(false), [lifted,setLifted]=React.useState(false)
    const drag=React.useRef<any>(null), keyboard=React.useRef<any>(null), inputMode=React.useRef(false)
    const current=React.useRef({x:item.x/100,y:item.y/100,line:1,targetLine:1,radius:.055,angle:Math.PI,targetAngle:Math.PI,elevation:0,targetElevation:0,bx:1,by:0,lx:0,ly:0,targetLx:0,targetLy:0,tilt:0,targetTilt:0,progress:0,previousProgress:0,phase:"idle",frame:0,last:0,contact:false,hold:null as any})
    const compactBoard=size.w<520&&size.h>size.w*1.35
    const scale=Math.max(.01,Math.min(1,compactBoard?.55*Math.min(size.w/390,size.h/900):Math.min(size.w/1000,size.h/760))), artWidth=item.width*scale, width=artWidth/.30
    const settings=React.useRef<any>({})
    settings.current={item,material,sound,volume,peel,reduced,size,audio,artWidth,width,canvasMode}
    const src=React.useMemo(()=>stickerArtwork(item),[item.design,item.label,item.subtitle,item.color,item.ink,item.image?.src])
    const pose=():StickerRenderState=>{const c=current.current,s=settings.current;return {peelLine:c.line,bendX:c.bx,bendY:c.by,radius:c.radius,curlAngle:c.angle,elevation:c.elevation,lightX:c.lx,lightY:c.ly,material:s.material,wear:s.item.wear,foldDetail:0,creaseStrength:0}}
    const setPosition=()=>{const c=current.current;if(outer.current){outer.current.style.left=`${c.x*100}%`;outer.current.style.top=`${c.y*100}%`}}
    const rotate=(x:number,y:number,degrees:number)=>{const a=degrees*Math.PI/180;return {x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)}}
    const measuredWidth=()=>renderer.current?.getArtworkSize().width||settings.current.artWidth
    const measuredAspect=()=>renderer.current?.getArtworkSize().aspect||1
    const flatLine=()=>{const c=current.current,n=Math.hypot(c.bx,c.by)||1;return (Math.abs(c.bx)/n+Math.abs(c.by)/n/measuredAspect())*.5+.03}
    const gripWorld=(grip:any)=>{const c=current.current,s=settings.current,p=renderer.current?.projectedGrip(grip,pose())||projectedStickerGrip(grip,pose());return rotate(p.x*measuredWidth(),p.y*measuredWidth(),s.item.rotation+c.tilt)}
    const followGrip=()=>{
        const c=current.current,s=settings.current,h=c.hold;if(!h)return
        const p=gripWorld(h.grip);c.x=(h.x-h.offsetX-p.x)/s.size.w;c.y=(h.y-h.offsetY-p.y)/s.size.h
        if(c.phase==="detached"){
            const middle=gripWorld({x:0,y:0}),vx=c.x*s.size.w+middle.x,vy=c.y*s.size.h+middle.y
            c.x+=(clamp(vx,12,Math.max(12,s.size.w-12))-vx)/s.size.w
            c.y+=(clamp(vy,12,Math.max(12,s.size.h-12))-vy)/s.size.h
        }
        setPosition()
    }
    const wake=()=>{const c=current.current;if(!c.frame){c.last=performance.now();c.frame=requestAnimationFrame(tick)}}
    const tick=(time:number)=>{
        const c=current.current,s=settings.current,dt=Math.min(.032,Math.max(.001,(time-c.last)/1000||.016));c.last=time;c.frame=0
        const dragging=!!drag.current
        const ease=1-Math.exp(-dt*18)
        c.lx+=(c.targetLx-c.lx)*ease;c.ly+=(c.targetLy-c.ly)*ease
        if(c.phase==="peeling") c.line=c.targetLine
        else c.line+=(c.targetLine-c.line)*(1-Math.exp(-dt*(s.reduced?40:18)))
        c.angle+=(c.targetAngle-c.angle)*(1-Math.exp(-dt*(s.reduced?35:11)))
        c.elevation+=(c.targetElevation-c.elevation)*(1-Math.exp(-dt*(s.reduced?40:14)))
        c.tilt+=(c.targetTilt-c.tilt)*(1-Math.exp(-dt*13))
        if(c.phase==="detached"||c.phase==="settling")followGrip()
        const d=drag.current||keyboard.current, range=d||c.hold
        if(range?.max!==undefined)c.progress=clamp((range.max-c.line)/(range.max-range.min),0,1)
        if(sheet.current){sheet.current.style.transform=`rotate(${s.item.rotation+c.tilt}deg)`;sheet.current.style.filter="none"}
        renderer.current?.draw(pose())
        if(s.sound&&s.audio.current&&(dragLock.current===null||dragLock.current===index)){
            const rate=Math.abs(c.progress-c.previousProgress)/dt/2.5
            const movingFront=c.phase==="peeling"||c.phase==="returning"
            s.audio.current.drag(s.material,movingFront?clamp(rate,0,1):0,s.volume*(c.phase==="returning"?.28:.8))
        }
        c.previousProgress=c.progress
        // Fire on geometric surface contact, independent of light and tilt settling.
        if((c.phase==="settling"||c.phase==="returning")&&c.contact){
            const state=pose(),w=measuredWidth()
            const heightAt=(grip:{x:number;y:number})=>{
                const p=renderer.current?.projectedGrip(grip,state)??projectedStickerGrip(grip,state,measuredAspect())
                return Math.max(0,p.z*w)
            }
            const nearZ=heightAt(shapeSupport(-c.bx,-c.by).grip),farZ=heightAt(shapeSupport(c.bx,c.by).grip)
            if(Math.min(nearZ,farZ)<=1&&Math.max(nearZ,farZ)<=2){
                const detachedLanding=c.phase==="settling";c.contact=false
                if(s.sound&&(dragLock.current===null||dragLock.current===index)){
                    s.audio.current?.stop()
                    s.audio.current?.drop(s.material,s.volume*(detachedLanding?1:.2))
                }
            }
        }
        const settled=Math.abs(c.line-c.targetLine)<.0005&&Math.abs(c.angle-c.targetAngle)<.003&&Math.abs(c.elevation-c.targetElevation)<.0005&&Math.abs(c.tilt-c.targetTilt)<.02&&Math.abs(c.lx-c.targetLx)<.002&&Math.abs(c.ly-c.targetLy)<.002
        if(settled&&(c.phase==="returning"||c.phase==="settling")){
            const wasDetached=c.phase==="settling";c.phase="idle";c.hold=null;c.line=flatLine();c.targetLine=c.line;c.angle=Math.PI;c.targetAngle=Math.PI;c.elevation=0;c.progress=0;c.previousProgress=0
            setPosition();if(dragLock.current===null||dragLock.current===index){s.audio.current?.stop()}c.contact=false
            renderer.current?.draw(pose())
        }
        if(dragging||keyboard.current||!settled)c.frame=requestAnimationFrame(tick)
    }
    const moveTo=(x:number,y:number)=>{
        const s=settings.current,a=s.item.rotation*Math.PI/180,w=measuredWidth()
        const horizontal=shapeSupport(Math.cos(a),-Math.sin(a)),vertical=shapeSupport(Math.sin(a),Math.cos(a))
        const minX=(6-horizontal.min*w)/Math.max(1,s.size.w),maxX=(s.size.w-6-horizontal.max*w)/Math.max(1,s.size.w)
        const minY=(6-vertical.min*w)/Math.max(1,s.size.h),maxY=(s.size.h-6-vertical.max*w)/Math.max(1,s.size.h)
        current.current.x=minX<maxX?clamp(x,minX,maxX):.5
        current.current.y=minY<maxY?clamp(y,minY,maxY):.5
        setPosition()
    }
    React.useEffect(()=>{
        if(!canvas.current)return
        let live=true;setReady(false)
        const r=createStickerRenderer(canvas.current,src,{artworkScale:.30,segments:72,shadows:true,onStatus:(ok)=>{if(live)setReady(ok)},onError:()=>{if(live)setReady(false)}});renderer.current=r;r.resize(width,width);r.draw(pose())
        r.ready.then(ok=>{if(live){setReady(ok);wake()}})
        return()=>{live=false;r.dispose();renderer.current=null}
    },[src,canvasMode])
    React.useEffect(()=>{renderer.current?.resize(width,width);wake()},[width,material,item.rotation,item.wear,reduced,peel])
    React.useEffect(()=>{moveTo(item.x/100,item.y/100);wake()},[item.x,item.y,reset])
    const releaseCapture=()=>{const d=drag.current;if(d&&outer.current?.hasPointerCapture(d.id))outer.current.releasePointerCapture(d.id)}
    const cancel=()=>{
        const d=drag.current||keyboard.current;if(!d)return
        const c=current.current;drag.current=null;keyboard.current=null;if(dragLock.current===index)dragLock.current=null;setLifted(false)
        c.targetLx=0;c.targetLy=0;c.hold=null;c.x=d.startX;c.y=d.startY;c.phase="returning";c.targetLine=flatLine();c.targetAngle=Math.PI;c.targetElevation=0;c.targetTilt=0;c.contact=false;setPosition();settings.current.audio.current?.stop();wake()
        if(d.id!==undefined&&outer.current?.hasPointerCapture(d.id))outer.current.releasePointerCapture(d.id)
    }
    React.useEffect(()=>{
        const visibility=()=>{if(document.hidden)cancel()}, escape=(e:KeyboardEvent)=>{inputMode.current=true;if(e.key==="Escape")cancel()}, pointerMode=()=>{inputMode.current=false;setKeyFocus(false)}
        window.addEventListener("pointerdown",pointerMode,true);window.addEventListener("blur",cancel);document.addEventListener("visibilitychange",visibility);window.addEventListener("keydown",escape)
        return()=>{window.removeEventListener("pointerdown",pointerMode,true);window.removeEventListener("blur",cancel);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("keydown",escape);cancelAnimationFrame(current.current.frame);current.current.frame=0;if(dragLock.current===index){dragLock.current=null;settings.current.audio.current?.stop()}}
    },[])
    React.useEffect(()=>{if(!drag.current&&!keyboard.current)moveTo(current.current.x,current.current.y)},[size.w,size.h,width,item.rotation])
    const startAudio=()=>{if(sound){if(!audio.current)audio.current=createMaterialAudio();void audio.current.unlock()}}
    const shapeSupport=(nx:number,ny:number)=>{
        let pts:number[][]=[]
        if(designerSupportPoints[item.design])pts=designerSupportPoints[item.design]
        else if(item.design==="ticket")pts=[[-.46,-.30],[.46,-.30],[.46,.293],[-.46,.293]]
        else if(item.design==="bubble")pts=[[-.46,-.38],[.46,-.38],[.46,.333],[-.16,.333],[-.32,.45],[-.29,.333],[-.46,.333]]
        else if(item.design==="custom")pts=[[-.5,-.5/measuredAspect()],[.5,-.5/measuredAspect()],[.5,.5/measuredAspect()],[-.5,.5/measuredAspect()]]
        else if(item.design==="seal")pts=[[-.46,-.43],[.46,-.43],[.46,.43],[-.46,.43]]
        else pts=Array.from({length:64},(_,i)=>{const a=i*Math.PI/32,r=item.design==="orbit"?.47:.49;return [Math.cos(a)*r,Math.sin(a)*r]})
        const values=pts.map(p=>p[0]*nx+p[1]*ny);const max=Math.max(...values),p=pts[values.indexOf(max)];return {min:Math.min(...values),max,grip:{x:p[0],y:p[1]}}
    }
    const down=(e:React.PointerEvent)=>{
        if(canvasMode||e.button!==0||drag.current||dragLock.current!==null)return
        e.preventDefault();inputMode.current=false;setKeyFocus(false);e.currentTarget.setPointerCapture(e.pointerId);(e.currentTarget as HTMLElement).focus({preventScroll:true})
        const r=board.current.getBoundingClientRect(),c=current.current,px=(e.clientX-r.left)*size.w/r.width,py=(e.clientY-r.top)*size.h/r.height
        const local=rotate(px-c.x*size.w,py-c.y*size.h,-item.rotation)
        c.phase="peeling";c.hold=null;c.line=flatLine();c.targetLine=c.line;c.angle=Math.PI;c.targetAngle=Math.PI;c.elevation=0;c.targetElevation=0;c.tilt=0;c.targetTilt=0;c.progress=0;c.previousProgress=0;c.contact=false
        c.targetLx=0;c.targetLy=0
        c.radius=(material==="paper"?.043:material==="foil"?.060:.050)/Math.max(.5,peel)
        drag.current={id:e.pointerId,pointerType:e.pointerType,startX:c.x,startY:c.y,startPX:px,startPY:py,px,py,time:performance.now(),grip:{x:local.x/measuredWidth(),y:local.y/measuredWidth()},started:false,min:-.5,max:.5,detached:false}
        dragLock.current=index;onSelect(index);setLifted(true);startAudio();wake()
    }
    const moveHeld=(px:number,py:number,d:any)=>{
        const c=current.current,now=performance.now(),dt=Math.max(8,now-d.time)
            if(!d.detached){
                const delta=rotate(px-d.startPX,py-d.startPY,-item.rotation),distance=Math.hypot(delta.x,delta.y)
                if(distance>3||d.started){
                    if(distance>3){c.bx=-delta.x/distance;c.by=-delta.y/distance}
                    const support=shapeSupport(c.bx,c.by);d.min=support.min;d.max=support.max;d.grip=support.grip
                    const edge=rotate(d.grip.x*measuredWidth(),d.grip.y*measuredWidth(),item.rotation);d.offsetX=d.startPX-d.startX*size.w-edge.x;d.offsetY=d.startPY-d.startY*size.h-edge.y
                    const solved=solveStickerPeel(Math.max(0,distance-3)/measuredWidth(),c.bx,c.by,measuredAspect(),c.radius,Math.PI)
                    c.line=c.targetLine=support.max-(solved.maxSupport-solved.peelLine)
                    c.progress=clamp((support.max-c.line)/(support.max-support.min),0,1)
                    if(!d.started){d.started=true;if(sound)audio.current?.pickup(material,volume*.65)}
                    if(c.line<=support.min-.002){
                        d.detached=true;c.phase="detached";c.line=c.targetLine=support.min-.003;c.targetAngle=reduced?0:.10;c.targetElevation=reduced?.025:.065
                        const heldPoint=gripWorld(d.grip)
                        c.hold={grip:d.grip,x:px,y:py,offsetX:px-c.x*size.w-heldPoint.x,offsetY:py-c.y*size.h-heldPoint.y,min:d.min,max:d.max};followGrip()
                        audio.current?.stop()
                        if(sound)audio.current?.detach(material,volume*.85)
                    }
                }
            }else{
                c.hold.x=px;c.hold.y=py;c.targetTilt=reduced?0:clamp((px-d.px)/dt*2,-4,4);followGrip()
            }
        d.px=px;d.py=py;d.time=now
    }
    const move=(e:React.PointerEvent|PointerEvent)=>{
        const d=drag.current;if(!d||d.id!==e.pointerId)return
        const c=current.current,b=board.current?.getBoundingClientRect();if(!b)return
        const px=(e.clientX-b.left)*size.w/b.width,py=(e.clientY-b.top)*size.h/b.height
        c.targetLx=clamp((px-c.x*size.w)/artWidth*2,-1,1);c.targetLy=clamp((py-c.y*size.h)/artWidth*2,-1,1)
        moveHeld(px,py,d)
        wake()
    }
    const drop=()=>{
        const d=drag.current||keyboard.current;if(!d)return
        const c=current.current;drag.current=null;keyboard.current=null;if(dragLock.current===index)dragLock.current=null;setLifted(false)
        c.contact=!!d.started||!!d.detached;c.targetTilt=0;c.targetElevation=0;c.targetLx=0;c.targetLy=0
        if(d.detached){
            const middle=gripWorld({x:0,y:0})
            c.hold={grip:{x:0,y:0},x:c.x*size.w+middle.x,y:c.y*size.h+middle.y,offsetX:0,offsetY:0}
            c.phase="settling";c.targetAngle=0
        }else{c.phase="returning";c.hold={min:d.min,max:d.max};c.targetLine=d.max+.015;c.targetAngle=Math.PI}
        if(d.id!==undefined&&outer.current?.hasPointerCapture(d.id))outer.current.releasePointerCapture(d.id)
        wake()
    }
    const up=(e:React.PointerEvent|PointerEvent)=>{
        const d=drag.current;if(!d||d.id!==e.pointerId)return
        const r=board.current?.getBoundingClientRect()
        if(r&&r.width&&r.height)moveHeld((e.clientX-r.left)*size.w/r.width,(e.clientY-r.top)*size.h/r.height,d)
        drop()
    }
    // Listen above the moving/clipped hit shape. The ref keeps native listeners
    // on the latest render's handlers without re-subscribing during a gesture.
    const pointerHandlers=React.useRef<{move:(event:PointerEvent)=>void;up:(event:PointerEvent)=>void;cancel:()=>void}|null>(null)
    pointerHandlers.current={move,up,cancel}
    React.useEffect(()=>{
        if(canvasMode)return
        const nativeMove=(event:PointerEvent)=>{
            const d=drag.current;if(!d||d.id!==event.pointerId)return
            // Mouse-only recovery: a released mouse can re-enter the preview
            // without its original pointerup having reached this document.
            if(d.pointerType==="mouse"&&event.buttons===0){pointerHandlers.current?.up(event);return}
            pointerHandlers.current?.move(event)
        }
        const nativeUp=(event:PointerEvent)=>{
            if(drag.current?.id===event.pointerId)pointerHandlers.current?.up(event)
        }
        const nativeCancel=(event:PointerEvent)=>{
            if(drag.current?.id===event.pointerId)pointerHandlers.current?.cancel()
        }
        window.addEventListener("pointermove",nativeMove,true)
        window.addEventListener("pointerup",nativeUp,true)
        window.addEventListener("pointercancel",nativeCancel,true)
        return()=>{
            window.removeEventListener("pointermove",nativeMove,true)
            window.removeEventListener("pointerup",nativeUp,true)
            window.removeEventListener("pointercancel",nativeCancel,true)
        }
    },[canvasMode])
    const key=(e:React.KeyboardEvent)=>{
        inputMode.current=true;setKeyFocus(true)
        if(drag.current){if(e.key==="Escape"){cancel();e.preventDefault()}return}
        if(canvasMode||(dragLock.current!==null&&dragLock.current!==index))return
        if(e.key===" "||e.key==="Enter"){
            e.preventDefault();if(e.repeat)return
            if(keyboard.current){drop();return}
            const c=current.current,px=c.x*size.w,py=c.y*size.h;keyboard.current={startX:c.x,startY:c.y,startPX:px,startPY:py,px,py,time:performance.now(),detached:false,started:false,min:-.5,max:.5,grip:{x:0,y:0}};dragLock.current=index;onSelect(index);setLifted(true);startAudio();c.phase="peeling";c.hold=null;c.line=c.targetLine=flatLine();c.angle=c.targetAngle=Math.PI;c.elevation=c.targetElevation=0;c.tilt=c.targetTilt=0;c.progress=c.previousProgress=0;c.radius=(material==="paper"?.043:material==="foil"?.060:.050)/Math.max(.5,peel);wake()
        }
        if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
            e.preventDefault();onSelect(index);const step=e.shiftKey?22:6,dx=e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0,dy=e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0
            if(keyboard.current){moveHeld(keyboard.current.px+dx,keyboard.current.py+dy,keyboard.current)}else moveTo(current.current.x+dx/size.w,current.current.y+dy/size.h);wake()
        }
        if(e.key==="Escape"){cancel();e.preventDefault()}
    }
    const hitShape=designerHitShapes[item.design] || (item.design==="burst"?`polygon(${Array.from({length:32},(_,i)=>{const a=i*Math.PI/16-Math.PI/2,r=i%2?38:49;return `${50+Math.cos(a)*r}% ${50+Math.sin(a)*r}%`}).join(",")})`:item.design==="orbit"?"circle(47% at 50% 50%)":item.design==="ticket"?"inset(18% 4% 20% 4%)":item.design==="seal"?"inset(4% round 17%)":item.design==="bubble"?"polygon(6% 15%, 94% 15%, 94% 80%, 34% 80%, 18% 94%, 20% 80%, 6% 80%)":"inset(0)")
    return <div ref={outer} role="button" tabIndex={0} aria-label={`${item.image?.alt||item.label}. ${material} sticker. Pull across to peel; keep pulling to detach. Space to lift, arrows to move.`} aria-pressed={lifted} onFocus={()=>setKeyFocus(inputMode.current)} onBlur={()=>{setKeyFocus(false);if(keyboard.current)drop()}} onPointerDown={down} onLostPointerCapture={()=>{if(drag.current)cancel()}} onKeyDown={key} style={{position:"absolute",left:`${current.current.x*100}%`,top:`${current.current.y*100}%`,width,height:width,transform:"translate(-50%, -50%)",zIndex:z,pointerEvents:"none",touchAction:"none",cursor:lifted?"grabbing":"grab",outline:"none",WebkitTapHighlightColor:"transparent",WebkitUserSelect:"none",userSelect:"none"}}>
        <div ref={sheet} style={{position:"absolute",inset:0,transform:`rotate(${item.rotation}deg)`,filter:ready?"none":"drop-shadow(0px 1.2px 1.2px rgba(48,39,25,.22))",willChange:"transform",pointerEvents:"none"}}>
            <img alt="" draggable={false} src={src} style={{position:"absolute",width:"30%",height:"30%",left:"35%",top:"35%",objectFit:"contain",opacity:ready?0:1}}/>
            <canvas key={`${src}:shared2d-v1`} ref={canvas} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:ready?1:0}}/>
        </div>
        <div aria-hidden="true" style={{position:"absolute",inset:"35%",pointerEvents:"auto",clipPath:hitShape,transform:`rotate(${item.rotation}deg)`,touchAction:"none"}}/>
        {keyFocus&&<span style={{position:"absolute",left:"50%",top:"67%",transform:"translateX(-50%)",padding:"5px 8px",borderRadius:6,background:"#413F36",color:"#FFFDF2",fontSize:10,whiteSpace:"nowrap",pointerEvents:"none"}}>Space: grab/release · Arrows: pull · Shift: faster</span>}
    </div>
}

type Props = {
    stickers: StickerItem[]; background: string; dots: string; showDots: boolean; radius: any;
    sound: boolean; volume: number; peel: number; showControls: boolean; font: any; style?: React.CSSProperties
}
function SmallIcon({ kind }: { kind:string }) {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "reset" ? <><path d="M4 10a8 8 0 1 1 1 7"/><path d="M4 4v6h6"/></> : <><path d="M11 5 6 9H3v6h3l5 4Z"/>{kind === "sound" ? <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></> : <path d="m16 9 5 6m0-6-5 6"/>}</>}</svg>
}



function StaticStickerBoard(props: Props) {
    const { stickers=initialStickers, background="#F1EFE7", radius=24, style }=props
    const uid=React.useId().replace(/:/g,"")
    const corner=typeof radius==="object" ? `${radius.topLeft||0}px ${radius.topRight||0}px ${radius.bottomRight||0}px ${radius.bottomLeft||0}px` : radius
    return <div role="region" aria-label="Peelable Stickers" style={{width:960,height:760,position:"relative",overflow:"hidden",background,borderRadius:corner,...style}}>
        <svg viewBox="0 0 1000 760" width="100%" height="100%" style={{display:"block"}} role="img" aria-label="Sticker board — open Preview to peel and move stickers">
            <defs><linearGradient id={uid+"foil"} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a4dcff"/><stop offset=".28" stopColor="#e7baff"/><stop offset=".53" stopColor="#fff9b2"/><stop offset=".76" stopColor="#a5ffd8"/><stop offset="1" stopColor="#d7c4ff"/></linearGradient></defs>
            {stickers.slice(0,10).map((raw,index)=>{
                const item={...initialStickers[index%initialStickers.length],...raw}
                if(trustedStickerUpload(item.image?.src))item.design="custom"
                const src=stickerArtwork(item), w=item.width, mask=uid+"m"+index
                return <g key={index} transform={`translate(${item.x*10} ${item.y*7.6}) rotate(${item.rotation})`}>
                    <image href={src} x={-w/2} y={-w/2} width={w} height={w} preserveAspectRatio="xMidYMid meet" style={{filter:"drop-shadow(0px 2px 2px rgba(35,30,20,.22))"}}/>
                    {item.material==="foil"&&<><mask id={mask} style={{maskType:"alpha"}}><image href={src} x={-w/2} y={-w/2} width={w} height={w}/></mask><rect x={-w/2} y={-w/2} width={w} height={w} fill={`url(#${uid}foil)`} opacity=".65" mask={`url(#${mask})`}/></>}
                </g>
            })}
        </svg>
    </div>
}

const useStickerLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/**
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 760
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function PeelableStickers(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    return isStaticRenderer ? <StaticStickerBoard {...props}/> : <InteractiveStickerBoard {...props}/>
}

function InteractiveStickerBoard(props: Props) {
    const { stickers = initialStickers, background="#F1EFE7", dots="#BDB8AA", showDots=false, radius=24, sound=true, volume=.8, peel=.95, showControls=false, font={}, style } = props
    const board=React.useRef<HTMLDivElement>(null), audio=React.useRef<MaterialAudio|null>(null), dragLock=React.useRef<number|null>(null)
    const [size,setSize]=React.useState({w:960,h:760}), [selected,setSelected]=React.useState(2), [reset,setReset]=React.useState(0)
    const [measured,setMeasured]=React.useState(false)
    const [muted,setMuted]=React.useState(false), [overrides,setOverrides]=React.useState<Record<number,StickerMaterial>>({})
    const [order,setOrder]=React.useState<number[]>([]), reduced=useReducedMotion()
    const canvasMode=RenderTarget.current() === RenderTarget.canvas
    useStickerLayoutEffect(()=>{
        const element=board.current;if(!element)return
        const commit=(w:number,h:number)=>{
            w=Math.round(w);h=Math.round(h)
            if(w<=0||h<=0)return
            setSize(previous=>Math.abs(previous.w-w)<.1&&Math.abs(previous.h-h)<.1?previous:{w,h})
            setMeasured(true)
        }
        // Read logical CSS pixels before showing any sticker; canvas zoom must not affect size.
        commit(element.clientWidth,element.clientHeight)
        const observer=new ResizeObserver(entries=>{
            const r=entries[0]?.contentRect;if(r)commit(r.width,r.height)
        })
        observer.observe(element)
        return()=>observer.disconnect()
    },[stickers.length,size.w<520])
    React.useEffect(()=>()=>{audio.current?.dispose();audio.current=null},[])
    React.useEffect(()=>{if(!sound||muted)audio.current?.stop()},[sound,muted])
    const select=(index:number)=>{setSelected(index);setOrder(o=>[...o.filter(n=>n!==index),index])}
    const activeIndex=Math.max(0,Math.min(selected,stickers.length-1)), active=stickers[activeIndex], activeMaterial=overrides[activeIndex]||active?.material
    const compact=size.w<520&&size.h>size.w*1.35
    const narrowBoard=size.w<520
    const count=Math.min(10,stickers.length)
    const naturalHeight=Math.round((narrowBoard?Math.max(480,Math.ceil(count/2)*168+60):Math.max(480,Math.ceil(count/3)*220+100))*Math.min(1,size.w/(narrowBoard?390:1000)))
    const control:React.CSSProperties={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,border:0,background:"transparent",color:"inherit",font:"inherit",cursor:"pointer",height:36,minWidth:36,padding:"0 10px",borderRadius:18,WebkitTapHighlightColor:"transparent"}
    return <div ref={board} role="region" aria-label="Peelable Stickers" style={{position:"relative",width:960,height:"auto",minWidth:0,overflow:"hidden",isolation:"isolate",background,borderRadius:typeof radius === "object" ? `${radius.topLeft||0}px ${radius.topRight||0}px ${radius.bottomRight||0}px ${radius.bottomLeft||0}px`:radius,fontFamily:"Inter, system-ui, sans-serif",fontSize:11,fontWeight:500,color:"#635F55",...font,...style}}>
        <div aria-hidden="true" style={{height:naturalHeight,width:1,visibility:"hidden",pointerEvents:"none",flexShrink:0}}/>
        {showDots && <div aria-hidden="true" style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle, ${dots} 0.7px, transparent 0.85px)`,backgroundSize:"20px 20px",opacity:.56,pointerEvents:"none"}}/>}
        <div aria-hidden="true" style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 35% 18%, rgba(255,255,255,.36), transparent 75%)",pointerEvents:"none"}}/>
        {showControls && <div style={{position:"absolute",top:compact?16:24,left:compact?20:28,right:compact?16:24,display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:1000,pointerEvents:"none"}}>
            <span style={{fontSize:10,letterSpacing:".08em",textTransform:"uppercase",opacity:.66}}>Pull to peel. Release to stick.</span>
            <div style={{display:"flex",gap:2,pointerEvents:"auto",padding:3,background:"rgba(255,253,245,.8)",border:"1px solid rgba(96,84,65,.09)",borderRadius:24,boxShadow:"0 2px 4px rgba(55,44,26,.035)"}}>
                {sound && <button type="button" style={control} aria-label={muted?"Enable sticker sounds":"Mute sticker sounds"} aria-pressed={!muted} title={muted?"Sound off":"Sound on"} onClick={()=>{setMuted(v=>!v);if(muted){if(!audio.current)audio.current=createMaterialAudio();void audio.current.unlock()}}}><SmallIcon kind={muted?"mute":"sound"}/></button>}
                <button type="button" style={control} title="Reset arrangement" aria-label="Reset sticker positions and materials" onClick={()=>{dragLock.current=null;setReset(r=>r+1);setOrder([]);setOverrides({});audio.current?.stop()}}><SmallIcon kind="reset"/></button>
            </div>
        </div>}
        {measured && stickers.slice(0,10).map((raw,index)=>{const item={...initialStickers[index%initialStickers.length],...raw};if(trustedStickerUpload(item.image?.src))item.design="custom";if(compact){item.x=item.mobileX??item.x;item.y=item.mobileY??item.y}return <StickerActor key={`${index}:${reset}`} item={item} index={index} board={board} size={size} material={overrides[index]||item.material} selected={selected===index} reset={reset} z={order.includes(index)?20+order.indexOf(index):index+1} onSelect={select} audio={audio} sound={sound&&!muted} volume={volume} peel={peel} reduced={reduced} canvasMode={canvasMode} dragLock={dragLock}/>})}
        {showControls && active && <div style={{position:"absolute",bottom:compact?16:24,left:"50%",transform:"translateX(-50%)",zIndex:1000,display:"flex",alignItems:"center",gap:compact?4:14,padding:"5px 6px 5px 16px",background:"rgba(255,253,245,.92)",border:"1px solid rgba(96,84,65,.11)",borderRadius:30,boxShadow:"0 3px 8px rgba(55,44,26,.04)",whiteSpace:"nowrap"}}>
            {!compact && <span style={{fontSize:10,opacity:.6,paddingRight:8,borderRight:"1px solid rgba(96,84,65,.16)"}}>Material</span>}
            <div role="group" aria-label="Selected sticker material" style={{display:"flex",gap:2}}>{(["paper","vinyl","foil"] as StickerMaterial[]).map(m=><button type="button" key={m} aria-pressed={activeMaterial===m} style={{...control,minWidth:compact?67:74,height:32,fontSize:11,background:activeMaterial===m?"#413F36":"transparent",color:activeMaterial===m?"#FFFDF2":"#777165",transition:reduced?"none":"background .15s, color .15s"}} onClick={()=>{setOverrides(o=>({...o,[activeIndex]:m}))}}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>)}</div>
        </div>}
    </div>
}

PeelableStickers.defaultProps = { stickers:initialStickers,background:"#F1EFE7",dots:"#BDB8AA",showDots:false,radius:24,sound:true,volume:.8,peel:.95,showControls:false }
addPropertyControls(PeelableStickers, {
    stickers:{type:ControlType.Array,title:"Stickers",maxCount:10,defaultValue:initialStickers,control:{type:ControlType.Object,controls:{
        design:{type:ControlType.Enum,title:"Artwork",options:["framer","figma","notion","react","claude","chatgpt","webflow","command","memo","cursor","asterisk","save","burst","ticket","orbit","seal","bubble","custom"],optionTitles:["Framer","Figma","Notion","React","Claude","ChatGPT","Webflow","Command key","Sketch paper","Cursor","Foil asterisk","Save disk","Sunburst","Ticket","Orbit","Seal","Speech","Custom image"],defaultValue:"framer"},
        image:{type:ControlType.ResponsiveImage,title:"Custom image",description:"Upload PNG, JPG, WebP or SVG through Framer. Only images hosted on framerusercontent.com/images/ are accepted; external URLs are ignored. Replaces the selected artwork and its text/colors. Material, peel, size and position still apply. Remove the image to restore the artwork. For cut-out stickers, use a transparent PNG, WebP or SVG."},
        label:{type:ControlType.String,title:"Title",defaultValue:"Framer",hidden:p=>!!p.image?.src||["custom","framer","figma","notion","react","claude","chatgpt","webflow","command","cursor","asterisk"].includes(p.design)},
        subtitle:{type:ControlType.String,title:"Subtitle",defaultValue:"",hidden:p=>!!p.image?.src||["custom","framer","figma","notion","react","claude","chatgpt","webflow","command","cursor","asterisk"].includes(p.design)},
        color:{type:ControlType.Color,title:"Paper",defaultValue:"#F26A35",hidden:p=>p.design==="custom"||!!p.image?.src},
        ink:{type:ControlType.Color,title:"Ink",defaultValue:"#492918",hidden:p=>p.design==="custom"||!!p.image?.src},
        material:{type:ControlType.Enum,title:"Material",options:["paper","vinyl","foil"],optionTitles:["Paper","Vinyl","Foil"],defaultValue:"vinyl"},
        width:{type:ControlType.Number,title:"Size",min:80,max:400,step:1,unit:"px",defaultValue:222},
        x:{type:ControlType.Number,title:"Position X",min:10,max:90,unit:"%",defaultValue:50},
        y:{type:ControlType.Number,title:"Position Y",min:15,max:85,unit:"%",defaultValue:50},
        mobileX:{type:ControlType.Number,title:"Phone X",min:10,max:90,unit:"%",defaultValue:50},
        mobileY:{type:ControlType.Number,title:"Phone Y",min:10,max:90,unit:"%",defaultValue:50},
        rotation:{type:ControlType.Number,title:"Rotation",min:-180,max:180,unit:"°",defaultValue:-12},
        wear:{type:ControlType.Number,title:"Wear",min:0,max:1,step:.05,defaultValue:.2},
    }}},
    background:{type:ControlType.Color,title:"Surface",defaultValue:"#F1EFE7"},
    showDots:{type:ControlType.Boolean,title:"Dot grid",defaultValue:false},
    dots:{type:ControlType.Color,title:"Dots",defaultValue:"#BDB8AA",hidden:p=>!p.showDots},
    radius:{type:ControlType.BorderRadius,title:"Radius",defaultValue:"24px"},
    peel:{type:ControlType.Number,title:"Peel",min:0,max:1.5,step:.05,defaultValue:.95,description:"Material flexibility and curl radius. Pull across a sticker to peel it completely."},
    sound:{type:ControlType.Boolean,title:"Sound",defaultValue:true},
    volume:{type:ControlType.Number,title:"Volume",min:0,max:1,step:.05,defaultValue:.8,hidden:p=>!p.sound},
    font:{type:ControlType.Font,title:"Controls font",controls:"extended",hidden:p=>!p.showControls},
    showControls:{type:ControlType.Boolean,title:"Preview UI",defaultValue:false,description:"Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"},
})



