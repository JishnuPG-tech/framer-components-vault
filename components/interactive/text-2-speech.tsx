import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
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
 * Text2Speech
 * Free text-to-speech for Framer sites, powered by the voices already built into
 * every modern browser (Web Speech API). No account, no API key, no limits.
 *
 * Designed and built by Arturo (Efe) Morales.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 560
 */

const SPEEDS = [1, 1.25, 1.5, 2, 0.75]
const WORDS_PER_MINUTE = 165
const CHUNK_MAX = 180 // Chrome stops long utterances after ~15s, so we speak in short pieces
const BLOCK_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,blockquote"
const SKIP_SELECTOR =
    "[data-tts-player],script,style,noscript,nav,footer,button,figcaption,[aria-hidden='true']"
const END_PUNCTUATION = /[.!?…:;。！？：；।]$/
const CJK_CHARS = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g // Japanese kana + Chinese characters

type Status = "idle" | "playing" | "paused"

/* ---------- Languages ---------- */

// Built-in languages and the accent used when a page gives no region (e.g. "es" instead of "es-ES").
// Pages in other languages still work: the player looks for a matching voice on the device,
// and labels fall back to the ones typed in Framer's right panel.
const REGION_DEFAULTS: Record<string, string> = {
    en: "en-US",
    es: "es-MX",
    fr: "fr-FR",
    pt: "pt-BR",
    de: "de-DE",
    it: "it-IT",
    nl: "nl-NL",
    pl: "pl-PL",
    sv: "sv-SE",
    ja: "ja-JP",
    zh: "zh-CN",
    ko: "ko-KR",
}

// How each language may appear in voice names or language settings.
const LANGUAGE_NAMES: Record<string, string[]> = {
    en: ["english"],
    es: ["español", "espanol", "spanish"],
    fr: ["français", "francais", "french"],
    pt: ["português", "portugues", "portuguese"],
    de: ["deutsch", "german"],
    it: ["italiano", "italian"],
    nl: ["nederlands", "dutch"],
    pl: ["polski", "polish"],
    sv: ["svenska", "swedish"],
    ja: ["日本語", "japanese"],
    zh: ["中文", "普通话", "國語", "chinese", "mandarin"],
    ko: ["한국어", "korean"],
}

// Three-letter codes some devices use (e.g. "por-BRA" on some Android phones).
const THREE_LETTER: Record<string, string[]> = {
    en: ["eng"],
    es: ["spa"],
    fr: ["fra", "fre"],
    pt: ["por"],
    de: ["deu", "ger"],
    it: ["ita"],
    nl: ["nld", "dut"],
    pl: ["pol"],
    sv: ["swe"],
    ja: ["jpn"],
    zh: ["zho", "chi", "cmn"],
    ko: ["kor"],
}

const LANGUAGE_ALIASES: Record<string, string> = { br: "pt" }
for (const code of Object.keys(LANGUAGE_NAMES)) {
    for (const name of LANGUAGE_NAMES[code]) LANGUAGE_ALIASES[name] = code
    for (const three of THREE_LETTER[code] || []) LANGUAGE_ALIASES[three] = code
}

const REGION_THREE_TO_TWO: Record<string, string> = {
    USA: "US",
    GBR: "GB",
    MEX: "MX",
    ESP: "ES",
    ARG: "AR",
    COL: "CO",
    FRA: "FR",
    CAN: "CA",
    BRA: "BR",
    PRT: "PT",
    DEU: "DE",
    AUT: "AT",
    CHE: "CH",
    ITA: "IT",
    NLD: "NL",
    BEL: "BE",
    POL: "PL",
    SWE: "SE",
    JPN: "JP",
    CHN: "CN",
    TWN: "TW",
    HKG: "HK",
    KOR: "KR",
}

// The English default for "Read last". It is translated automatically in built-in languages;
// any other text is read exactly as typed.
const DEFAULT_OUTRO = "End of article"

// Built-in labels. English uses the labels typed in Framer's right panel.
const UI_TEXT: Record<string, Record<string, string>> = {
    es: {
        label: "Escuchar este artículo",
        playing: "Reproduciendo",
        paused: "En pausa",
        listen: "min de audio",
        left: "min restantes",
        empty: "No se encontró texto del artículo en esta página",
        unsupported: "El audio no está disponible en este navegador",
        play: "Reproducir",
        pause: "Pausar",
        position: "Posición de reproducción",
        speed: "Velocidad",
        noVoice: "Este dispositivo no tiene una voz en español",
        end: "Fin del artículo",
    },
    fr: {
        label: "Écouter cet article",
        playing: "Lecture en cours",
        paused: "En pause",
        listen: "min d'écoute",
        left: "min restantes",
        empty: "Aucun texte d'article trouvé sur cette page",
        unsupported: "L'audio n'est pas disponible dans ce navigateur",
        play: "Lire",
        pause: "Pause",
        position: "Position de lecture",
        speed: "Vitesse",
        noVoice: "Cet appareil n'a pas de voix en français",
        end: "Fin de l'article",
    },
    pt: {
        label: "Ouvir este artigo",
        playing: "Reproduzindo",
        paused: "Pausado",
        listen: "min de áudio",
        left: "min restantes",
        empty: "Nenhum texto de artigo encontrado nesta página",
        unsupported: "O áudio não está disponível neste navegador",
        play: "Reproduzir",
        pause: "Pausar",
        position: "Posição de reprodução",
        speed: "Velocidade",
        noVoice: "Este dispositivo não tem uma voz em português",
        end: "Fim do artigo",
    },
    de: {
        label: "Diesen Artikel anhören",
        playing: "Wird abgespielt",
        paused: "Pausiert",
        listen: "Min. zum Anhören",
        left: "Min. übrig",
        empty: "Auf dieser Seite wurde kein Artikeltext gefunden",
        unsupported: "Audio ist in diesem Browser nicht verfügbar",
        play: "Abspielen",
        pause: "Pausieren",
        position: "Wiedergabeposition",
        speed: "Geschwindigkeit",
        noVoice: "Dieses Gerät hat keine deutsche Stimme",
        end: "Ende des Artikels",
    },
    it: {
        label: "Ascolta questo articolo",
        playing: "In riproduzione",
        paused: "In pausa",
        listen: "min di ascolto",
        left: "min rimanenti",
        empty: "Nessun testo dell'articolo trovato in questa pagina",
        unsupported: "L'audio non è disponibile in questo browser",
        play: "Riproduci",
        pause: "Pausa",
        position: "Posizione di riproduzione",
        speed: "Velocità",
        noVoice: "Questo dispositivo non ha una voce in italiano",
        end: "Fine dell'articolo",
    },
    nl: {
        label: "Luister naar dit artikel",
        playing: "Wordt afgespeeld",
        paused: "Gepauzeerd",
        listen: "min luisteren",
        left: "min resterend",
        empty: "Geen artikeltekst gevonden op deze pagina",
        unsupported: "Audio is niet beschikbaar in deze browser",
        play: "Afspelen",
        pause: "Pauzeren",
        position: "Afspeelpositie",
        speed: "Snelheid",
        noVoice: "Dit apparaat heeft geen Nederlandse stem",
        end: "Einde van het artikel",
    },
    pl: {
        label: "Posłuchaj tego artykułu",
        playing: "Odtwarzanie",
        paused: "Wstrzymano",
        listen: "min słuchania",
        left: "min pozostało",
        empty: "Nie znaleziono tekstu artykułu na tej stronie",
        unsupported: "Dźwięk nie jest dostępny w tej przeglądarce",
        play: "Odtwórz",
        pause: "Wstrzymaj",
        position: "Pozycja odtwarzania",
        speed: "Prędkość",
        noVoice: "To urządzenie nie ma polskiego głosu",
        end: "Koniec artykułu",
    },
    sv: {
        label: "Lyssna på den här artikeln",
        playing: "Spelas upp",
        paused: "Pausad",
        listen: "min lyssning",
        left: "min kvar",
        empty: "Ingen artikeltext hittades på den här sidan",
        unsupported: "Ljud är inte tillgängligt i den här webbläsaren",
        play: "Spela upp",
        pause: "Pausa",
        position: "Uppspelningsposition",
        speed: "Hastighet",
        noVoice: "Den här enheten har ingen svensk röst",
        end: "Slut på artikeln",
    },
    ja: {
        label: "この記事を聴く",
        playing: "再生中",
        paused: "一時停止中",
        listen: "分の音声",
        left: "分残り",
        empty: "このページに記事のテキストが見つかりません",
        unsupported: "このブラウザでは音声を利用できません",
        play: "再生",
        pause: "一時停止",
        position: "再生位置",
        speed: "再生速度",
        noVoice: "このデバイスには日本語の音声がありません",
        end: "記事は以上です",
    },
    zh: {
        label: "收听本文",
        playing: "正在播放",
        paused: "已暂停",
        listen: "分钟音频",
        left: "分钟剩余",
        empty: "此页面未找到文章内容",
        unsupported: "此浏览器不支持音频",
        play: "播放",
        pause: "暂停",
        position: "播放位置",
        speed: "播放速度",
        noVoice: "此设备没有中文语音",
        end: "文章结束",
    },
    ko: {
        label: "이 기사 듣기",
        playing: "재생 중",
        paused: "일시정지됨",
        listen: "분 듣기",
        left: "분 남음",
        empty: "이 페이지에서 기사 텍스트를 찾을 수 없습니다",
        unsupported: "이 브라우저에서는 오디오를 사용할 수 없습니다",
        play: "재생",
        pause: "일시정지",
        position: "재생 위치",
        speed: "재생 속도",
        noVoice: "이 기기에는 한국어 음성이 없습니다",
        end: "기사 끝",
    },
}

// Turns "pt", "pt_BR", "Portuguese", "br", "por-BRA" or "zh-Hans-CN" into a code like "pt-BR".
// Returns "" when the value isn't a language code (e.g. "auto", or "automático" from Framer localization).
function normalizeLanguage(raw: string): string {
    const clean = (raw || "").trim().replace(/_/g, "-")
    if (!clean) return ""
    const [head, ...rest] = clean.split("-")
    const headLower = head.toLowerCase()
    const base = LANGUAGE_ALIASES[headLower] || headLower
    if (!/^[a-z]{2}$/.test(base)) return ""
    let region = rest.find((r) => /^([A-Za-z]{2,3}|\d{3})$/.test(r)) || ""
    region = region.toUpperCase()
    if (region.length === 3) region = REGION_THREE_TO_TWO[region] || ""
    if (!region && headLower === "br") region = "BR"
    return region ? `${base}-${region}` : REGION_DEFAULTS[base] || base
}

// Reads the language from the page address, e.g. /pt/artigos/... → pt-BR.
// Only built-in languages are accepted, so paths like /blog or /us are ignored.
function languageFromPath(): string {
    if (typeof window === "undefined") return ""
    const first =
        (window.location.pathname || "").split("/").filter(Boolean)[0] || ""
    const lang = normalizeLanguage(first)
    return lang && REGION_DEFAULTS[lang.split("-")[0]] ? lang : ""
}

function resolveLanguage(setting: string): string {
    // A typed language code (e.g. "es-ES" or "hi-IN") wins. Anything that isn't a code,
    // including "auto" or a translated "automático" from Framer localization, means automatic.
    const manual = normalizeLanguage(setting || "")
    if (manual) return manual

    const fromPath = languageFromPath()
    const fromPage =
        typeof document !== "undefined"
            ? normalizeLanguage(document.documentElement.lang || "")
            : ""

    if (fromPath) {
        // Keep the page's region (e.g. pt-PT) when both agree on the language.
        if (fromPage && fromPage.split("-")[0] === fromPath.split("-")[0])
            return fromPage
        return fromPath
    }
    if (fromPage) return fromPage
    const fromBrowser =
        typeof navigator !== "undefined"
            ? normalizeLanguage(navigator.language || "")
            : ""
    return fromBrowser || "en-US"
}

// Adds a pause mark to headings and labels that have none, using "。" after Japanese/Chinese text.
function withPause(text: string): string {
    if (END_PUNCTUATION.test(text)) return text
    return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]$/.test(text)
        ? text + "。"
        : text + "."
}

// Word count for the time estimate. Japanese and Chinese have no spaces, so characters are counted.
function countWords(text: string): number {
    if (!text) return 0
    const cjk = (text.match(CJK_CHARS) || []).length
    const others = text
        .replace(CJK_CHARS, " ")
        .split(/\s+/)
        .filter(Boolean).length
    return others + Math.round(cjk / 2)
}

/* ---------- Text helpers ---------- */

function isVisible(el: HTMLElement) {
    // Framer keeps hidden breakpoints (desktop/tablet/phone) in the page,
    // so we only read text that is actually on screen.
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
}

// Turns "Meta, Share bar" into a selector for those Framer layer names (and everything inside them).
function buildLayerSelector(names: string): string {
    return (names || "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => `[data-framer-name="${n.replace(/["\\]/g, "\\$&")}" i]`)
        .join(",")
}

function collectArticleText(
    selector: string,
    intro: string,
    skipLayers: string = "",
    outro: string = ""
): string {
    if (typeof document === "undefined") return ""

    let root: Element | null = null
    const custom = (selector || "").trim()
    if (custom) {
        try {
            // Framer can repeat the same section for each breakpoint; use the visible one.
            const matches = Array.from(
                document.querySelectorAll(custom)
            ) as HTMLElement[]
            root = matches.find((el) => isVisible(el)) || matches[0] || null
        } catch (e) {
            root = null
        }
    }
    if (!root) root = document.querySelector("article")
    if (!root) root = document.querySelector("main")
    if (!root) root = document.body

    const parts: string[] = []
    const introClean = (intro || "").trim()
    if (introClean) parts.push(withPause(introClean))

    let layerSelector = buildLayerSelector(skipLayers)
    try {
        if (layerSelector) document.querySelector(layerSelector)
    } catch (e) {
        layerSelector = "" // ignore names the browser can't understand
    }
    const blocks = Array.from(
        root.querySelectorAll(BLOCK_SELECTOR)
    ) as HTMLElement[]
    for (const el of blocks) {
        if (el.closest(SKIP_SELECTOR)) continue
        if (layerSelector && el.closest(layerSelector)) continue
        if (!isVisible(el)) continue
        const parentBlock = el.parentElement
            ? el.parentElement.closest(BLOCK_SELECTOR)
            : null
        if (parentBlock && root.contains(parentBlock)) continue // avoid reading nested text twice

        const text = (el.innerText || el.textContent || "")
            .replace(/\s+/g, " ")
            .trim()
        if (!/[\p{L}\p{N}]/u.test(text)) continue // skip empty or symbol-only text
        // Headings and list items often have no period; add one so the voice pauses.
        parts.push(withPause(text))
    }

    // If the title is read as the intro AND appears inside the article, skip the duplicate.
    if (introClean && parts.length > 1) {
        const a = parts[0].replace(END_PUNCTUATION, "").toLowerCase()
        const b = parts[1].replace(END_PUNCTUATION, "").toLowerCase()
        if (a === b) parts.splice(1, 1)
    }

    const outroClean = (outro || "").trim()
    if (outroClean && parts.length) parts.push(withPause(outroClean))

    return parts.join(" ")
}

function splitIntoChunks(text: string): string[] {
    const clean = text.replace(/\s+/g, " ").trim()
    if (!clean) return []
    // Sentence endings in Latin scripts plus Japanese/Chinese full-width punctuation.
    const sentences = clean.match(
        /[^.!?…。！？।]+[.!?…。！？।]+["'”’)\]」』]*\s*|[^.!?…。！？।]+$/g
    ) || [clean]

    const pieces: string[] = []
    for (let s of sentences) {
        s = s.trim()
        while (s.length > CHUNK_MAX) {
            // Prefer cutting at a comma (including Japanese/Chinese commas), then at a space.
            let cut = Math.max(
                s.lastIndexOf(", ", CHUNK_MAX),
                s.lastIndexOf("，", CHUNK_MAX),
                s.lastIndexOf("、", CHUNK_MAX)
            )
            if (cut < CHUNK_MAX * 0.5) cut = s.lastIndexOf(" ", CHUNK_MAX)
            if (cut <= 0) cut = CHUNK_MAX
            pieces.push(s.slice(0, cut + 1).trim())
            s = s.slice(cut + 1).trim()
        }
        if (s) pieces.push(s)
    }

    // Merge short sentences so there are fewer gaps between them.
    const chunks: string[] = []
    for (const p of pieces) {
        const last = chunks[chunks.length - 1]
        if (last && last.length + p.length + 1 <= CHUNK_MAX)
            chunks[chunks.length - 1] = last + " " + p
        else chunks.push(p)
    }
    return chunks
}

/* ---------- Voice helpers ---------- */

const PREFERRED_VOICE_HINTS = [
    "natural", // Microsoft Edge "Online (Natural)" voices — the best free ones
    "neural",
    "premium",
    "enhanced",
    "google",
    "google us english",
    "google uk english",
    "samantha",
    "ava",
    "allison",
    "aria",
    "jenny",
    "daniel",
    "karen",
]

function pickVoice(
    voices: SpeechSynthesisVoice[],
    lang: string,
    preferredName: string
): SpeechSynthesisVoice | null {
    if (!voices || !voices.length) return null
    const want = (lang || "en-US").toLowerCase().replace("_", "-")
    const base = want.split("-")[0]
    const norm = (v: SpeechSynthesisVoice) =>
        (v.lang || "").toLowerCase().replace("_", "-")

    // Some devices report languages as "por" or only in the voice name ("Português"),
    // so we also match three-letter codes and language names.
    const names = LANGUAGE_NAMES[base] || []
    const codes = [base, ...(THREE_LETTER[base] || [])]
    const sameLang = voices.filter((v) => {
        const l = norm(v)
        const n = (v.name || "").toLowerCase()
        return (
            codes.some((c) => l === c || l.startsWith(c + "-")) ||
            names.some((x) => n.includes(x))
        )
    })
    const exact = sameLang.filter((v) => norm(v) === want)
    const pool = exact.length ? exact : sameLang
    if (!pool.length) return null

    const pref = (preferredName || "").trim().toLowerCase()
    if (pref) {
        const match = pool.find((v) => v.name.toLowerCase().includes(pref))
        if (match) return match
    }
    for (const hint of PREFERRED_VOICE_HINTS) {
        const match = pool.find((v) => v.name.toLowerCase().includes(hint))
        if (match) return match
    }
    return pool.find((v) => v.localService) || pool[0]
}

/* ---------- Icons ---------- */

function PlayIcon() {
    return (
        <svg width="42%" height="42%" viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.4-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6z"
                fill="currentColor"
            />
        </svg>
    )
}

function PauseIcon() {
    return (
        <svg width="40%" height="40%" viewBox="0 0 24 24" aria-hidden="true">
            <rect
                x="6"
                y="5"
                width="4.2"
                height="14"
                rx="1.2"
                fill="currentColor"
            />
            <rect
                x="13.8"
                y="5"
                width="4.2"
                height="14"
                rx="1.2"
                fill="currentColor"
            />
        </svg>
    )
}

function Equalizer({ color }: { color: string }) {
    const bar: React.CSSProperties = {
        display: "block",
        width: 3,
        height: "100%",
        borderRadius: 2,
        background: color,
    }
    return (
        <span
            className="lta-eq"
            aria-hidden="true"
            style={{
                display: "inline-flex",
                alignItems: "flex-end",
                gap: 2,
                height: "0.85em",
            }}
        >
            <span style={bar} />
            <span style={bar} />
            <span style={bar} />
        </span>
    )
}

/* ---------- Component ---------- */

export default function Text2Speech(props: any) {
    const {
        introText,
        outroText,
        articleSelector,
        skipLayers,
        language,
        autoTranslate,
        preferredVoice,
        label,
        playingLabel,
        pausedLabel,
        listenSuffix,
        leftSuffix,
        emptyMessage,
        unsupportedMessage,
        font,
        textTransform,
        background,
        borderColor,
        textColor,
        accent,
        iconColor,
        trackColor,
        radius,
        padding,
        buttonSize,
        showTime,
        showSpeed,
        hideIfUnsupported,
        playTrackingId,
        finishTrackingId,
        style,
    } = props

    const [supported, setSupported] = useState(true)
    const [status, setStatus] = useState<Status>("idle")
    const [progress, setProgress] = useState(0)
    const [totalMinutes, setTotalMinutes] = useState(0)
    const [speedIndex, setSpeedIndex] = useState(0)
    const [empty, setEmpty] = useState(false)
    const [lang, setLang] = useState("en-US")
    const [noVoice, setNoVoice] = useState(false)

    // "Read last": the default phrase is translated on Spanish, French, and Portuguese pages.
    const langBase = lang.split("-")[0].toLowerCase()
    const outro =
        autoTranslate &&
        UI_TEXT[langBase] &&
        (outroText || "").trim().toLowerCase() === DEFAULT_OUTRO.toLowerCase()
            ? UI_TEXT[langBase].end
            : outroText || ""

    // Detect the page language (Framer sets it for each locale) and follow changes.
    useEffect(() => {
        if (typeof document === "undefined") return
        const update = () => setLang(resolveLanguage(language))
        update()
        const observer = new MutationObserver(update)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["lang"],
        })
        // Framer can switch pages without reloading, so check the address now and then.
        const interval = setInterval(update, 1000)
        window.addEventListener("popstate", update)
        return () => {
            observer.disconnect()
            clearInterval(interval)
            window.removeEventListener("popstate", update)
        }
    }, [language])

    // When the language changes, stop and start fresh.
    useEffect(() => {
        chunksRef.current = []
        indexRef.current = 0
        setProgress(0)
        setStatus("idle")
        setEmpty(false)
    }, [lang])

    const chunksRef = useRef<string[]>([])
    const indexRef = useRef(0)
    const runRef = useRef(0)
    const rateRef = useRef(1)
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const wordsRef = useRef(0)

    // Analytics: sends events to Framer Analytics (Funnels → custom step).
    const track = useTracking()
    const trackingRef = useRef({ track, play: "", finish: "" })
    trackingRef.current = {
        track,
        play:
            playTrackingId === undefined
                ? "article-audio-play"
                : playTrackingId,
        finish:
            finishTrackingId === undefined
                ? "article-audio-finish"
                : finishTrackingId,
    }
    const playTrackedRef = useRef(false)
    const sendEvent = (kind: "play" | "finish") => {
        const { track: send, play, finish } = trackingRef.current
        const id = kind === "play" ? play : finish
        if (!id || typeof send !== "function") return
        try {
            send(id)
        } catch (e) {
            // never let analytics break the player
        }
    }

    // Setup: check support, load voices, estimate reading time, clean up on leave.
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            !("speechSynthesis" in window) ||
            typeof (window as any).SpeechSynthesisUtterance === "undefined"
        ) {
            setSupported(false)
            return
        }
        const synth: any = window.speechSynthesis

        const loadVoices = () => {
            const voices = synth.getVoices()
            voiceRef.current = pickVoice(voices, lang, preferredVoice)
            // Only conclude "no voice" once the device has actually listed its voices.
            setNoVoice(voices.length > 0 && !voiceRef.current)
        }
        loadVoices()
        if (synth.addEventListener)
            synth.addEventListener("voiceschanged", loadVoices)
        else synth.onvoiceschanged = loadVoices

        const measure = () => {
            const text = collectArticleText(
                articleSelector,
                introText,
                skipLayers,
                outro
            )
            const words = countWords(text)
            wordsRef.current = words
            setTotalMinutes(
                words ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0
            )
        }
        measure()
        const timer = setTimeout(measure, 1200) // CMS content can arrive a moment later

        const stopAll = () => {
            runRef.current++
            synth.cancel()
        }
        window.addEventListener("pagehide", stopAll)

        return () => {
            clearTimeout(timer)
            if (synth.removeEventListener)
                synth.removeEventListener("voiceschanged", loadVoices)
            window.removeEventListener("pagehide", stopAll)
            stopAll()
        }
    }, [lang, preferredVoice, articleSelector, introText, skipLayers, outro])

    const prepareChunks = useCallback((): boolean => {
        if (chunksRef.current.length) return true
        const text = collectArticleText(
            articleSelector,
            introText,
            skipLayers,
            outro
        )
        const chunks = splitIntoChunks(text)
        if (!chunks.length) {
            setEmpty(true)
            return false
        }
        setEmpty(false)
        chunksRef.current = chunks
        wordsRef.current = countWords(text)
        if (!voiceRef.current) {
            const voices = window.speechSynthesis.getVoices()
            voiceRef.current = pickVoice(voices, lang, preferredVoice)
            if (voices.length > 0 && !voiceRef.current) {
                setNoVoice(true)
                return false
            }
        }
        return true
    }, [articleSelector, introText, skipLayers, outro, lang, preferredVoice])

    const speakFrom = useCallback(
        (start: number) => {
            const synth = window.speechSynthesis
            const run = ++runRef.current
            const wasBusy = synth.speaking || synth.pending
            synth.cancel()
            if (synth.paused) synth.resume()
            const chunks = chunksRef.current

            const speakOne = (k: number) => {
                if (run !== runRef.current) return
                if (k >= chunks.length) {
                    sendEvent("finish")
                    playTrackedRef.current = false // a replay counts as a new play
                    indexRef.current = 0
                    setProgress(0)
                    setStatus("idle")
                    return
                }
                indexRef.current = k
                setProgress(k / chunks.length)

                const u = new SpeechSynthesisUtterance(chunks[k])
                u.lang = lang
                u.rate = rateRef.current
                if (voiceRef.current) u.voice = voiceRef.current
                u.onend = () => speakOne(k + 1)
                u.onerror = (e: any) => {
                    if (run !== runRef.current) return
                    const err = e && e.error
                    if (err === "interrupted" || err === "canceled") return
                    if (err === "not-allowed") {
                        setStatus("idle")
                        return
                    }
                    speakOne(k + 1)
                }
                utteranceRef.current = u // keeps a reference so the browser doesn't drop events
                synth.speak(u)
            }

            setStatus("playing")
            // iPhone needs the first speak() to happen right on the tap; Chrome needs a
            // short pause after cancel() when something was already speaking.
            if (wasBusy) setTimeout(() => speakOne(start), 80)
            else speakOne(start)
        },
        [lang]
    )

    const pause = () => {
        runRef.current++
        window.speechSynthesis.cancel()
        setStatus("paused")
    }

    const onToggle = () => {
        if (!supported || noVoice) return
        if (status === "playing") return pause()
        if (!prepareChunks()) return
        if (!playTrackedRef.current) {
            playTrackedRef.current = true // count once per visit, not every pause/resume
            sendEvent("play")
        }
        speakFrom(status === "paused" ? indexRef.current : 0)
    }

    const onSpeed = () => {
        const next = (speedIndex + 1) % SPEEDS.length
        setSpeedIndex(next)
        rateRef.current = SPEEDS[next]
        if (status === "playing") speakFrom(indexRef.current)
    }

    const seekTo = (fraction: number) => {
        if (!supported || !prepareChunks()) return
        const total = chunksRef.current.length
        const k = Math.min(total - 1, Math.max(0, Math.floor(fraction * total)))
        indexRef.current = k
        setProgress(k / total)
        if (status === "playing") speakFrom(k)
        else setStatus("paused")
    }

    const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        seekTo((e.clientX - rect.left) / rect.width)
    }

    const onTrackKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowRight") seekTo(progress + 0.05)
        else if (e.key === "ArrowLeft") seekTo(Math.max(0, progress - 0.05))
        else if (e.key === "Home") seekTo(0)
        else return
        e.preventDefault()
    }

    if (!supported && hideIfUnsupported) return null

    const base = lang.split("-")[0].toLowerCase()
    const t = autoTranslate && UI_TEXT[base] ? UI_TEXT[base] : null
    const ui = {
        label: t ? t.label : label,
        playing: t ? t.playing : playingLabel,
        paused: t ? t.paused : pausedLabel,
        listen: t ? t.listen : listenSuffix,
        left: t ? t.left : leftSuffix,
        empty: t ? t.empty : emptyMessage,
        unsupported: t ? t.unsupported : unsupportedMessage,
        play: t ? t.play : "Play",
        pause: t ? t.pause : "Pause",
        position: t ? t.position : "Playback position",
        speed: t ? t.speed : "Playback speed",
        noVoice: t ? t.noVoice : "This device has no voice for this language",
    }

    const speed = SPEEDS[speedIndex]
    const minutesLeft = Math.max(
        1,
        Math.ceil(
            (wordsRef.current * (1 - progress)) /
                WORDS_PER_MINUTE /
                rateRef.current
        )
    )
    const timeText =
        status === "idle"
            ? `${totalMinutes} ${ui.listen}`
            : `${minutesLeft} ${ui.left}`

    let labelText = ui.label
    if (!supported) labelText = ui.unsupported
    else if (noVoice) labelText = ui.noVoice
    else if (empty) labelText = ui.empty
    else if (status === "playing") labelText = ui.playing
    else if (status === "paused") labelText = ui.paused

    const css = `
.lta button { font: inherit; -webkit-tap-highlight-color: transparent; }
.lta-btn { transition: transform .15s ease, filter .15s ease; }
.lta-btn:hover { filter: brightness(1.08); }
.lta-btn:active { transform: scale(.94); }
.lta-btn:focus-visible, .lta-speed:focus-visible, .lta-track:focus-visible {
  outline: 2px solid ${accent}; outline-offset: 3px;
}
.lta-speed:hover { background: ${trackColor}; }
@keyframes ltaEq { 0%, 100% { transform: scaleY(.35); } 50% { transform: scaleY(1); } }
.lta-eq span { transform-origin: bottom; animation: ltaEq .9s ease-in-out infinite; }
.lta-eq span:nth-child(2) { animation-delay: -.3s; }
.lta-eq span:nth-child(3) { animation-delay: -.6s; }
@media (prefers-reduced-motion: reduce) {
  .lta-eq span { animation: none; transform: scaleY(.7); }
  .lta-btn, .lta-fill { transition: none !important; }
}`

    return (
        <div
            data-tts-player=""
            className="lta"
            role="region"
            aria-label={ui.label}
            style={{
                ...style,
                ...font,
                textTransform: textTransform || "none",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding,
                background,
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: radius,
                opacity: supported ? 1 : 0.6,
            }}
        >
            <style>{css}</style>

            <button
                type="button"
                className="lta-btn"
                onClick={onToggle}
                disabled={!supported || noVoice}
                aria-label={status === "playing" ? ui.pause : ui.play}
                style={{
                    width: buttonSize,
                    height: buttonSize,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                    border: "none",
                    borderRadius: "50%",
                    background: accent,
                    color: iconColor,
                    cursor: supported ? "pointer" : "default",
                }}
            >
                {status === "playing" ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 12,
                    }}
                >
                    <span
                        aria-live="polite"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            minWidth: 0,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {status === "playing" && <Equalizer color={accent} />}
                        <span
                            style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {labelText}
                        </span>
                    </span>
                    {showTime && supported && totalMinutes > 0 && (
                        <span
                            style={{
                                fontSize: "0.85em",
                                opacity: 0.7,
                                whiteSpace: "nowrap",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {timeText}
                        </span>
                    )}
                </div>

                <div
                    className="lta-track"
                    role="slider"
                    tabIndex={supported ? 0 : -1}
                    aria-label={ui.position}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    onClick={onTrackClick}
                    onKeyDown={onTrackKey}
                    style={{
                        padding: "6px 0",
                        cursor: supported ? "pointer" : "default",
                        borderRadius: 4,
                    }}
                >
                    <div
                        style={{
                            height: 4,
                            borderRadius: 2,
                            background: trackColor,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            className="lta-fill"
                            style={{
                                height: "100%",
                                width: `${progress * 100}%`,
                                background: accent,
                                borderRadius: 2,
                                transition: "width .5s ease",
                            }}
                        />
                    </div>
                </div>
            </div>

            {showSpeed && supported && (
                <button
                    type="button"
                    className="lta-speed"
                    onClick={onSpeed}
                    aria-label={`${ui.speed} ${speed}×`}
                    style={{
                        flexShrink: 0,
                        minWidth: 52,
                        padding: "5px 10px",
                        fontSize: "0.85em",
                        fontVariantNumeric: "tabular-nums",
                        color: textColor,
                        background: "transparent",
                        border: `1px solid ${borderColor}`,
                        borderRadius: 999,
                        cursor: "pointer",
                    }}
                >
                    {speed}×
                </button>
            )}
        </div>
    )
}

Text2Speech.displayName = "Text2Speech"

/* ---------- Framer property controls ---------- */

addPropertyControls(Text2Speech, {
    // What to read
    introText: {
        type: ControlType.String,
        title: "Read first",
        defaultValue: "",
        placeholder: "Connect to CMS Title",
    },
    outroText: {
        type: ControlType.String,
        title: "Read last",
        defaultValue: DEFAULT_OUTRO,
        placeholder: "Optional, e.g. End of article",
    },
    articleSelector: {
        type: ControlType.String,
        title: "Article area",
        defaultValue: "",
        placeholder: "e.g. #article",
    },
    skipLayers: {
        type: ControlType.String,
        title: "Skip layers",
        defaultValue: "",
        placeholder: "Layer names, comma-separated",
    },

    // Voice and language
    language: {
        type: ControlType.String,
        title: "Language",
        defaultValue: "auto",
        placeholder: "auto, or e.g. es-ES",
    },
    autoTranslate: {
        type: ControlType.Boolean,
        title: "Translate labels",
        defaultValue: true,
    },
    preferredVoice: {
        type: ControlType.String,
        title: "Voice name",
        defaultValue: "",
        placeholder: "Optional, e.g. Samantha",
    },

    // Labels (English; other languages are translated automatically)
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Listen to this article",
    },
    playingLabel: {
        type: ControlType.String,
        title: "Playing label",
        defaultValue: "Playing",
    },
    pausedLabel: {
        type: ControlType.String,
        title: "Paused label",
        defaultValue: "Paused",
    },
    listenSuffix: {
        type: ControlType.String,
        title: "Time (before)",
        defaultValue: "min listen",
    },
    leftSuffix: {
        type: ControlType.String,
        title: "Time (during)",
        defaultValue: "min left",
    },
    emptyMessage: {
        type: ControlType.String,
        title: "No text message",
        defaultValue: "No article text found on this page",
    },
    unsupportedMessage: {
        type: ControlType.String,
        title: "Unsupported msg",
        defaultValue: "Audio isn't available in this browser",
    },

    // Display
    showTime: {
        type: ControlType.Boolean,
        title: "Show time",
        defaultValue: true,
    },
    showSpeed: {
        type: ControlType.Boolean,
        title: "Show speed",
        defaultValue: true,
    },
    hideIfUnsupported: {
        type: ControlType.Boolean,
        title: "Hide if no audio",
        defaultValue: true,
    },

    // Analytics (Framer Analytics → Funnels → custom step)
    playTrackingId: {
        type: ControlType.TrackingId,
        title: "Track play",
        defaultValue: "article-audio-play",
    },
    finishTrackingId: {
        type: ControlType.TrackingId,
        title: "Track finish",
        defaultValue: "article-audio-finish",
    },

    // Style
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, lineHeight: "1.3em" },
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "capitalize", "uppercase", "lowercase"],
        optionTitles: ["None", "Capitalize", "Uppercase", "Lowercase"],
        defaultValue: "none",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#D6DEE8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#13263D",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#1557D6",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#FFFFFF",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "#E4EAF2",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 60,
        unit: "px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px 16px 12px 12px",
    },
    buttonSize: {
        type: ControlType.Number,
        title: "Button size",
        defaultValue: 44,
        min: 32,
        max: 72,
        unit: "px",
    },
})
