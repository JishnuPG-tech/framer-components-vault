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


type ResponsiveImageValue = {
    src?: string
    srcSet?: string
    alt?: string
}

type HeroSlide = {
    eyebrow?: string
    title?: string
    description?: string
    buttonLabel?: string
    link?: string
    image?: ResponsiveImageValue | string
    video?: string
    imageAlt?: string
    marquee?: string
    background?: string
}

type TrailmarkHeroCarouselProps = {
    style?: React.CSSProperties
    slides?: HeroSlide[]
    brandLabel?: string
    autoplay?: boolean
    autoplayDelay?: number
    pauseOnHover?: boolean
    marqueeSpeed?: number
    showThumbnails?: boolean
    showArrows?: boolean
    radius?: number
    accent?: string
}

const defaultSlides: HeroSlide[] = [
    {
        eyebrow: "TRAIL SERIES · 01",
        title: "Everything you need for the long way around.",
        description:
            "All-day comfort and considered details for the miles that make the day.",
        buttonLabel: "Explore the collection",
        link: "/collections/trail",
        image: {
            src: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1500&q=88",
            alt: "Cyclist riding on an open road",
        },
        video: "https://cdn.pixabay.com/video/2022/09/23/132311-753435379_large.mp4",
        imageAlt: "Cyclist riding on an open road",
        marquee: "FIND YOUR OUTSIDE",
        background: "#82664E",
    },
    {
        eyebrow: "ALPINE RANGE · 02",
        title: "Cold air. Clear mind.",
        description:
            "Warm, packable layers for early starts and days that climb above the clouds.",
        buttonLabel: "Discover alpine",
        link: "/collections/alpine",
        image: {
            src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1500&q=88",
            alt: "Snow-covered mountain under a deep blue sky",
        },
        imageAlt: "Snow-covered mountain under a deep blue sky",
        marquee: "TAKE THE HIGH ROAD",
        background: "#536A72",
    },
    {
        eyebrow: "FIELD NOTES · 03",
        title: "Move freely. Stay out longer.",
        description:
            "Breathable essentials made for the trail, the turnoff, and everything between.",
        buttonLabel: "Shop trail gear",
        link: "/collections/field",
        image: {
            src: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1500&q=88",
            alt: "Hikers following a mountain trail",
        },
        imageAlt: "Hikers following a mountain trail",
        marquee: "LEAVE THE MAP OPEN",
        background: "#617254",
    },
    {
        eyebrow: "EVERYDAY MOTION · 04",
        title: "Good things happen in motion.",
        description:
            "Versatile performance pieces designed to move from the first mile to the last light.",
        buttonLabel: "Meet the collection",
        link: "/collections/everyday",
        image: {
            src: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1500&q=88",
            alt: "Runner moving along a city path",
        },
        imageAlt: "Runner moving along a city path",
        marquee: "MOTION IS A MINDSET",
        background: "#8B5949",
    },
]

const css = `
.tmh-root{position:relative;isolation:isolate;width:100%;height:100%;min-width:0;min-height:580px;overflow:hidden;background:var(--tmh-bg);color:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;border-radius:var(--tmh-radius);outline:none;touch-action:pan-y;transition:background-color .75s ease}
.tmh-root:before{content:"";position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 72% 20%,rgba(255,255,255,.2),transparent 34%),linear-gradient(105deg,rgba(16,17,14,.04) 10%,rgba(16,17,14,.12) 54%,rgba(16,17,14,.35) 100%),linear-gradient(0deg,rgba(15,13,10,.62),transparent 49%);pointer-events:none}
.tmh-grain{position:absolute;inset:0;z-index:6;opacity:.075;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");mix-blend-mode:soft-light}
.tmh-top{position:absolute;top:4.4%;left:4.5%;right:4.5%;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;pointer-events:none}
.tmh-brand{font-size:10px;font-weight:760;letter-spacing:.19em;text-transform:uppercase;text-shadow:0 2px 16px rgba(0,0,0,.22)}
.tmh-count{display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.86);font-size:10px;font-weight:700;letter-spacing:.14em;font-variant-numeric:tabular-nums}
.tmh-count-value{display:inline-block;animation:tmh-count-in .45s cubic-bezier(.22,.68,.2,1) both}
@keyframes tmh-count-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.tmh-count-line{width:58px;height:1px;background:rgba(255,255,255,.38);overflow:hidden}
.tmh-count-fill{display:block;height:100%;background:#fff;transition:width .45s ease}
.tmh-marquee{position:absolute;z-index:1;left:0;right:0;top:34%;height:27%;overflow:hidden;display:flex;align-items:center;pointer-events:none;opacity:.97}
.tmh-marquee-track{display:flex;letter-spacing:1px;width:max-content;animation:tmh-marquee var(--tmh-speed) linear infinite;will-change:transform;transition:opacity .35s ease,filter .5s ease}
.tmh-root[data-static="true"] .tmh-marquee-track{animation-play-state:paused;letter-spacing:1px;}
.tmh-marquee-copy{display:flex;align-items:center;flex:none;letter-spacing:1px;padding-right:5vw;white-space:nowrap;color:#fff;font-size:clamp(74px,13.5vw,196px);font-weight:900;line-height:.82;text-transform:uppercase;text-shadow:0 4px 35px rgba(18,16,12,.08)}
.tmh-marquee-copy em{padding:0 .14em;font-style:normal;font-size:.3em;letter-spacing:0;vertical-align:middle}
@keyframes tmh-marquee{to{transform:translateX(-50%)}}
.tmh-image{position:absolute;z-index:3;left:34%;top:19%;width:32%;height:48%;display:block;margin:0;padding:0;overflow:hidden;border:1px solid rgba(255,255,255,.38);border-radius:24px;background:#242725;box-shadow:0 26px 72px rgba(12,11,9,.34);cursor:zoom-in;transition:left .68s cubic-bezier(.2,.75,.2,1),top .68s cubic-bezier(.2,.75,.2,1),width .68s cubic-bezier(.2,.75,.2,1),height .68s cubic-bezier(.2,.75,.2,1),border-radius .68s cubic-bezier(.2,.75,.2,1),box-shadow .4s ease;appearance:none}
.tmh-image img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;transition:transform 1.1s cubic-bezier(.2,.7,.2,1),filter .55s ease}
.tmh-slide-video{position:absolute;inset:0;display:block;width:100%;height:100%;z-index:2;opacity:0;object-fit:cover;object-position:center center;pointer-events:none;transition:opacity .5s ease,transform 1.1s cubic-bezier(.2,.7,.2,1),filter .55s ease}
.tmh-slide-video-visible{opacity:1}
.tmh-image.tmh-has-video .tmh-slide-image-in{transition:opacity .5s ease,transform 1.1s cubic-bezier(.2,.7,.2,1),filter .55s ease}
.tmh-image.tmh-has-video.tmh-expanded .tmh-slide-image-in{opacity:0}
.tmh-slide-image-out{z-index:0;animation:tmh-image-out .78s cubic-bezier(.22,.68,.2,1) both}
.tmh-slide-image-in{z-index:1;animation:tmh-image-in .82s cubic-bezier(.22,.68,.2,1) both}
@keyframes tmh-image-in{0%{opacity:0;transform:scale(1.075);filter:blur(3px) brightness(.82)}52%{opacity:1;transform:scale(1.02);filter:blur(0) brightness(.98)}100%{opacity:1;transform:scale(1);filter:none}}
@keyframes tmh-image-out{0%{opacity:1;transform:scale(1);filter:none}100%{opacity:0;transform:scale(.975);filter:blur(2px) brightness(.9)}}
.tmh-image:not(.tmh-expanded):hover img{transform:scale(1.045)}
.tmh-image:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,10,10,.28),transparent 35%);pointer-events:none;opacity:.6;transition:opacity .45s ease}
.tmh-image:focus-visible{outline:3px solid var(--tmh-accent);outline-offset:4px}
.tmh-image.tmh-expanded{left:0;top:0;width:100%;height:100%;z-index:10;border-radius:0;box-shadow:none;cursor:zoom-out}
.tmh-image.tmh-expanded img{transform:scale(1.025);filter:brightness(.77)}
.tmh-image.tmh-expanded:after{opacity:1;background:linear-gradient(0deg,rgba(8,10,10,.45),transparent 42%),linear-gradient(180deg,rgba(8,10,10,.26),transparent 26%)}
.tmh-image-hint{position:absolute;right:16px;bottom:15px;z-index:1;display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(255,255,255,.52);border-radius:999px;background:rgba(22,23,20,.3);color:#fff;font-size:9px;font-weight:740;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(10px);transition:opacity .25s ease}
.tmh-image-hint b{font-size:15px;font-weight:500;line-height:1}
.tmh-close-hint{position:absolute;top:18px;right:18px;z-index:2;display:inline-flex;align-items:center;gap:8px;opacity:0;padding:9px 12px;border:1px solid rgba(255,255,255,.58);border-radius:999px;background:rgba(20,20,18,.3);color:#fff;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;backdrop-filter:blur(12px);transition:opacity .3s ease}
.tmh-image.tmh-expanded .tmh-close-hint{opacity:1}
.tmh-copy{position:absolute;left:4.5%;bottom:7.6%;z-index:5;width:min(38%,500px);max-width:500px;transition:opacity .3s ease,transform .45s ease}
.tmh-copy-motion{animation:tmh-copy-in .68s cubic-bezier(.22,.68,.2,1) both;will-change:opacity,transform,filter}
@keyframes tmh-copy-in{0%{opacity:0;transform:translate3d(0,22px,0);filter:blur(5px)}62%{opacity:1;transform:translate3d(0,-2px,0);filter:blur(0)}100%{opacity:1;transform:none;filter:none}}
.tmh-eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 13px;color:rgba(255,255,255,.78);font-size:9px;font-weight:780;letter-spacing:.19em;text-transform:uppercase}
.tmh-eyebrow:before{content:"";width:22px;height:1px;background:var(--tmh-accent);transform-origin:left center;animation:tmh-rule-in .65s .08s cubic-bezier(.22,.68,.2,1) both}
@keyframes tmh-rule-in{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
.tmh-title{margin:0;max-width:520px;color:#fff;font-size:clamp(31px,3.3vw,53px);font-weight:720;line-height:.98;letter-spacing:-.065em;text-wrap:balance;text-shadow:0 2px 26px rgba(0,0,0,.13)}
.tmh-description{max-width:380px;margin:15px 0 20px;color:rgba(255,255,255,.82);font-size:clamp(12px,1.05vw,14px);font-weight:470;line-height:1.56}
.tmh-cta{display:inline-flex;min-height:47px;align-items:center;justify-content:center;gap:19px;padding:0 22px;border:1px solid rgba(255,255,255,.7);border-radius:12px;background:#fff;color:#171815;text-decoration:none;font-size:11px;font-weight:760;letter-spacing:.015em;box-shadow:0 0 0 3px rgba(255,255,255,.24);transition:transform .2s ease,background .2s ease,color .2s ease,box-shadow .2s ease}
.tmh-cta:hover{transform:translateY(-2px);background:var(--tmh-accent);color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.22)}
.tmh-cta svg{width:14px;height:14px;transition:transform .2s ease}
.tmh-cta:hover svg{transform:translateX(3px)}
.tmh-nav{position:absolute;right:4.5%;bottom:6.7%;z-index:5;display:flex;align-items:stretch;gap:13px;width:min(49%,720px);transition:opacity .25s ease,transform .4s ease}
.tmh-arrows{display:flex;align-self:stretch;flex:0 0 58px;flex-direction:column;gap:8px}
.tmh-arrow{display:grid;width:58px;height:auto;min-height:0;flex:1 1 0;place-items:center;padding:0;border:1px solid rgba(38,34,27,.9);border-radius:12px;background:#fff;color:#181916;box-shadow:0 0 0 3px rgba(255,255,255,.28);cursor:pointer;transition:transform .18s ease,background .18s ease,color .18s ease}
.tmh-arrow:hover{transform:translateY(-2px);background:var(--tmh-accent);color:#fff}
.tmh-arrow:focus-visible,.tmh-thumb:focus-visible{outline:3px solid var(--tmh-accent);outline-offset:3px}
.tmh-arrow svg{width:16px;height:16px}
.tmh-thumbs{display:flex;min-width:0;flex:1;gap:8px;overflow-x:auto;padding:7px;border:1px solid rgba(255,255,255,.42);border-radius:15px;background:rgba(242,238,229,.14);box-shadow:0 0 0 3px rgba(255,255,255,.08);backdrop-filter:blur(12px);scrollbar-width:none}
.tmh-thumbs::-webkit-scrollbar{display:none}
.tmh-thumb{position:relative;flex:1 1 0;min-width:70px;height:72px;overflow:hidden;padding:0;border:1px solid rgba(255,255,255,.4);border-radius:10px;background:#343a37;cursor:pointer;opacity:.76;transition:opacity .25s ease,transform .25s ease,border-color .25s ease}
.tmh-thumb:hover{opacity:1;transform:translateY(-2px)}
.tmh-thumb-active{border:2px solid #fff;opacity:1;box-shadow:0 4px 18px rgba(0,0,0,.25);animation:tmh-thumb-active .55s cubic-bezier(.22,.68,.2,1) both}
.tmh-thumb-active:after{content:"";position:absolute;left:7px;right:7px;bottom:6px;height:2px;border-radius:999px;background:#fff;transform-origin:left center;animation:tmh-thumb-progress var(--tmh-autoplay,5s) linear both}
@keyframes tmh-thumb-active{from{transform:translateY(5px) scale(.96);filter:saturate(.72)}to{transform:none;filter:none}}
@keyframes tmh-thumb-progress{from{transform:scaleX(0);opacity:.45}to{transform:scaleX(1);opacity:1}}
.tmh-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.tmh-thumb-index{position:absolute;left:6px;top:6px;display:grid;width:20px;height:20px;place-items:center;border:1px solid rgba(255,255,255,.55);border-radius:50%;background:rgba(14,15,13,.42);color:#fff;font-size:8px;font-weight:800;font-variant-numeric:tabular-nums;backdrop-filter:blur(8px)}
.tmh-bottom-note{position:absolute;right:4.5%;bottom:3.4%;z-index:4;color:rgba(255,255,255,.7);font-size:8px;font-weight:680;letter-spacing:.14em;text-transform:uppercase;pointer-events:none}
.tmh-root[data-expanded="true"] .tmh-top,.tmh-root[data-expanded="true"] .tmh-marquee,.tmh-root[data-expanded="true"] .tmh-copy,.tmh-root[data-expanded="true"] .tmh-nav,.tmh-root[data-expanded="true"] .tmh-bottom-note{opacity:0;pointer-events:none;transform:translateY(10px)}
.tmh-root[data-expanded="true"] .tmh-slide-image-in{animation:none}
.tmh-root[data-expanded="true"] .tmh-image-hint{opacity:0}
@media(max-width:900px){.tmh-image{left:32%;width:36%;height:45%}.tmh-copy{width:39%;bottom:8%}.tmh-nav{width:51%;right:4%;bottom:6.6%}.tmh-thumb{height:64px;min-width:62px}.tmh-arrows{flex-basis:50px}.tmh-arrow{width:50px;height:auto}}
@media(max-width:650px){.tmh-root{min-height:680px}.tmh-top{top:4%;left:6%;right:6%}.tmh-brand{max-width:55%;font-size:8px;letter-spacing:.14em}.tmh-count-line{width:34px}.tmh-marquee{top:31%;height:22%}.tmh-marquee-copy{font-size:clamp(60px,16vw,105px)}.tmh-image{left:20%;top:15%;width:60%;height:39%;border-radius:18px}.tmh-copy{left:6%;right:6%;bottom:24%;width:auto;max-width:none}.tmh-eyebrow{margin-bottom:9px;font-size:8px}.tmh-title{max-width:460px;font-size:clamp(33px,8vw,46px)}.tmh-description{max-width:400px;margin:11px 0 14px;font-size:12px}.tmh-cta{min-height:42px;padding:0 18px;font-size:10px}.tmh-nav{right:6%;left:6%;bottom:5%;width:auto;gap:9px}.tmh-arrows{flex-basis:44px;gap:6px}.tmh-arrow{width:44px;height:auto;border-radius:10px}.tmh-thumbs{gap:6px;padding:5px;border-radius:12px}.tmh-thumb{min-width:53px;height:57px;border-radius:8px}.tmh-thumb-index{left:4px;top:4px;width:17px;height:17px;font-size:7px}.tmh-bottom-note{display:none}.tmh-image-hint{right:10px;bottom:10px;padding:7px 9px;font-size:8px}}
@media(max-width:390px){.tmh-root{min-height:650px}.tmh-image{left:15%;width:70%;height:37%}.tmh-copy{bottom:25%}.tmh-title{font-size:31px}.tmh-description{max-width:310px;font-size:11px}.tmh-nav{left:4%;right:4%;gap:6px}.tmh-arrow{width:38px}.tmh-arrows{flex-basis:38px}.tmh-thumb{min-width:47px;height:53px}}
@media(prefers-reduced-motion:reduce){.tmh-marquee-track{animation-play-state:paused}.tmh-root,.tmh-image,.tmh-image img,.tmh-slide-video,.tmh-copy,.tmh-copy-motion,.tmh-nav,.tmh-cta,.tmh-arrow,.tmh-thumb,.tmh-slide-image-in,.tmh-slide-image-out{animation:none!important;transition-duration:.01ms!important;scroll-behavior:auto}}
`

function imageValue(value: HeroSlide["image"], fallback: HeroSlide["image"]) {
    const image = value || fallback
    if (typeof image === "string") return { src: image, srcSet: undefined }
    return {
        src:
            image?.src ||
            (typeof fallback === "string" ? fallback : fallback?.src) ||
            "",
        srcSet: image?.srcSet,
    }
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {direction === "left" ? (
                <path
                    d="M19 12H5m0 0 6 6m-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ) : (
                <path
                    d="M5 12h14m0 0-6-6m6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </svg>
    )
}

function LinkIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
                d="M3.5 10h12m0 0-5-5m5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 820
 */
export default function TrailmarkHeroCarousel(
    props: TrailmarkHeroCarouselProps
) {
    const {
        style: framerStyle,
        slides: propSlides = defaultSlides,
        brandLabel = "ROAM / TECHNICAL OUTDOOR",
        autoplay = true,
        autoplayDelay = 5,
        pauseOnHover = true,
        marqueeSpeed = 27,
        showThumbnails = true,
        showArrows = true,
        radius = 0,
        accent = "#D3AB78",
    } = props

    const isStatic = useIsStaticRenderer()
    const [index, setIndex] = React.useState(0)
    const [previousIndex, setPreviousIndex] = React.useState<number | null>(
        null
    )
    const [transitionKey, setTransitionKey] = React.useState(0)
    const [expanded, setExpanded] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)
    const transitionTimer = React.useRef<number | null>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const swipeStart = React.useRef<{
        x: number
        y: number
        pointerId: number
    } | null>(null)
    const suppressClick = React.useRef(false)
    const safeSlides = propSlides?.length ? propSlides : defaultSlides
    const count = safeSlides.length
    const activeIndex = ((index % count) + count) % count
    const slide = safeSlides[activeIndex] || defaultSlides[0]
    const fallbackSlide = defaultSlides[activeIndex % defaultSlides.length]
    const activeImage = imageValue(slide.image, fallbackSlide.image)
    const previousSlide =
        previousIndex === null
            ? null
            : safeSlides[previousIndex] ||
              defaultSlides[previousIndex % defaultSlides.length]
    const previousFallbackSlide =
        previousIndex === null
            ? null
            : defaultSlides[previousIndex % defaultSlides.length]
    const previousImage = previousSlide
        ? imageValue(previousSlide.image, previousFallbackSlide?.image)
        : null
    const imageAlt =
        slide.imageAlt ||
        (typeof slide.image === "object" ? slide.image?.alt : "") ||
        "Featured campaign"
    const activeVideo = slide.video || fallbackSlide.video || ""
    const speed = Math.max(10, Math.min(60, Number(marqueeSpeed) || 27))
    const delay = Math.max(2, Math.min(20, Number(autoplayDelay) || 5)) * 1000

    const goTo = (nextIndex: number) => {
        const next = (nextIndex + count) % count
        if (next === activeIndex) return
        setExpanded(false)
        setPreviousIndex(activeIndex)
        setTransitionKey((value) => value + 1)
        if (transitionTimer.current)
            window.clearTimeout(transitionTimer.current)
        transitionTimer.current = window.setTimeout(
            () => setPreviousIndex(null),
            860
        )
        setIndex(next)
    }

    React.useEffect(() => {
        const video = videoRef.current
        if (!video) return
        if (expanded && activeVideo) {
            try {
                video.currentTime = 0
            } catch {
                // The media may not have metadata yet; playback can still start.
            }
            const playPromise = video.play()
            playPromise?.catch(() => {
                // Autoplay can be blocked by the browser; the video remains muted and user-playable.
            })
        } else {
            video.pause()
            try {
                video.currentTime = 0
            } catch {
                // Ignore unloaded media.
            }
        }
    }, [expanded, activeVideo, activeIndex])

    const consumeSwipeClick = () => {
        if (!suppressClick.current) return false
        suppressClick.current = false
        return true
    }

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (
            !event.isPrimary ||
            expanded ||
            (event.pointerType === "mouse" && event.button !== 0)
        )
            return
        const target = event.target as HTMLElement | null
        if (target?.closest(".tmh-arrow, .tmh-thumb, .tmh-cta")) return
        swipeStart.current = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
        }
    }

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const start = swipeStart.current
        swipeStart.current = null
        if (!start || expanded) return

        const deltaX = event.clientX - start.x
        const deltaY = event.clientY - start.y
        if (Math.abs(deltaX) < 52 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15)
            return

        event.preventDefault()
        suppressClick.current = true
        window.setTimeout(() => {
            suppressClick.current = false
        }, 420)
        goTo(deltaX < 0 ? activeIndex + 1 : activeIndex - 1)
    }

    const handlePointerCancel = () => {
        swipeStart.current = null
    }

    React.useEffect(() => {
        if (
            isStatic ||
            !autoplay ||
            expanded ||
            (pauseOnHover && hovered) ||
            count < 2
        )
            return
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
            return
        const timer = window.setInterval(() => {
            goTo(activeIndex + 1)
        }, delay)
        return () => window.clearInterval(timer)
    }, [
        isStatic,
        autoplay,
        expanded,
        pauseOnHover,
        hovered,
        count,
        delay,
        activeIndex,
    ])

    React.useEffect(() => {
        return () => {
            if (transitionTimer.current)
                window.clearTimeout(transitionTimer.current)
        }
    }, [])

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault()
            goTo(activeIndex - 1)
        } else if (event.key === "ArrowRight") {
            event.preventDefault()
            goTo(activeIndex + 1)
        } else if (event.key === "Escape" && expanded) {
            event.preventDefault()
            setExpanded(false)
        }
    }

    const requestedWidth = framerStyle?.width
    const requestedHeight = framerStyle?.height
    const rootStyle = {
        ...framerStyle,
        width:
            requestedWidth !== undefined && requestedWidth !== "auto"
                ? requestedWidth
                : "100%",
        height:
            requestedHeight !== undefined && requestedHeight !== "auto"
                ? requestedHeight
                : "820px",
        borderRadius: `${Math.max(0, radius)}px`,
        backgroundColor: slide.background || "#82664E",
        "--tmh-bg": slide.background || "#82664E",
        "--tmh-accent": accent,
        "--tmh-speed": `${speed}s`,
        "--tmh-autoplay": `${Math.max(2, Math.min(20, Number(autoplayDelay) || 5))}s`,
        "--tmh-radius": `${Math.max(0, radius)}px`,
    } as React.CSSProperties

    const marqueeText = slide.marquee || slide.title || "FIND YOUR OUTSIDE"
    const repeatedMarquee = `${marqueeText}  ✳  ${marqueeText}  ✳`

    return (
        <>
            <style>{css}</style>
            <div
                className="tmh-root"
                data-expanded={expanded ? "true" : "false"}
                data-static={isStatic ? "true" : "false"}
                style={rootStyle}
                role="region"
                aria-roledescription="carousel"
                aria-label="Campaign hero slideshow"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onPointerEnter={(event) => {
                    if (pauseOnHover && event.pointerType === "mouse")
                        setHovered(true)
                }}
                onPointerLeave={() => setHovered(false)}
            >
                <div className="tmh-top" aria-hidden="true">
                    <span className="tmh-brand">{brandLabel}</span>
                    <span className="tmh-count">
                        <span
                            className="tmh-count-value"
                            key={`count-${transitionKey}`}
                        >
                            {String(activeIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="tmh-count-line">
                            <i
                                className="tmh-count-fill"
                                style={{
                                    width: `${((activeIndex + 1) / count) * 100}%`,
                                }}
                            />
                        </span>
                        <span>{String(count).padStart(2, "0")}</span>
                    </span>
                </div>

                <div className="tmh-marquee" aria-hidden="true">
                    <div
                        className="tmh-marquee-track"
                        key={`${marqueeText}-${transitionKey}`}
                    >
                        <span className="tmh-marquee-copy">
                            {repeatedMarquee}
                        </span>
                        <span className="tmh-marquee-copy">
                            {repeatedMarquee}
                        </span>
                    </div>
                </div>

                <button
                    className={`tmh-image${expanded ? " tmh-expanded" : ""}${activeVideo ? " tmh-has-video" : ""}`}
                    type="button"
                    onClick={() => {
                        if (consumeSwipeClick()) return
                        setExpanded((value) => !value)
                    }}
                    aria-label={
                        activeVideo
                            ? expanded
                                ? `Close video: ${imageAlt}`
                                : `Play video: ${imageAlt}`
                            : expanded
                              ? "Return to the slideshow"
                              : `Expand image: ${imageAlt}`
                    }
                    aria-pressed={expanded}
                >
                    {previousImage && previousIndex !== null && (
                        <img
                            className="tmh-slide-image-out"
                            key={`previous-${transitionKey}-${previousImage.src}`}
                            src={previousImage.src}
                            srcSet={previousImage.srcSet}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                        />
                    )}
                    <img
                        className="tmh-slide-image-in"
                        key={`current-${transitionKey}-${activeImage.src}`}
                        src={activeImage.src}
                        srcSet={activeImage.srcSet}
                        sizes="(max-width: 650px) 70vw, 38vw"
                        alt={imageAlt}
                        draggable={false}
                    />
                    {activeVideo && (
                        <video
                            ref={videoRef}
                            className={`tmh-slide-video${expanded ? " tmh-slide-video-visible" : ""}`}
                            key={`video-${activeIndex}-${activeVideo}`}
                            src={activeVideo}
                            poster={activeImage.src}
                            muted
                            playsInline
                            loop
                            preload="metadata"
                            autoPlay={expanded}
                            aria-label={`${expanded ? "Playing" : "Preview of"} ${imageAlt}`}
                        />
                    )}
                    <span className="tmh-image-hint">
                        <b aria-hidden="true">{expanded ? "×" : "↗"}</b>
                        {activeVideo
                            ? expanded
                                ? "Close video"
                                : "Play video"
                            : expanded
                              ? "Return to story"
                              : "Expand image"}
                    </span>
                    <span className="tmh-close-hint" aria-hidden="true">
                        × &nbsp; Back to story
                    </span>
                </button>

                <div className="tmh-copy" aria-live="polite">
                    <div
                        className="tmh-copy-motion"
                        key={`copy-${transitionKey}-${activeIndex}`}
                    >
                        <p className="tmh-eyebrow">
                            {slide.eyebrow ||
                                `CAMPAIGN · ${String(activeIndex + 1).padStart(2, "0")}`}
                        </p>
                        <h1 className="tmh-title">
                            {slide.title || "Find your outside."}
                        </h1>
                        <p className="tmh-description">
                            {slide.description ||
                                "Considered pieces for the days that take you a little further."}
                        </p>
                        <a
                            className="tmh-cta"
                            href={slide.link || "#"}
                            onClick={(event) => {
                                if (consumeSwipeClick()) event.preventDefault()
                            }}
                        >
                            <span>
                                {slide.buttonLabel || "Discover the collection"}
                            </span>
                            <LinkIcon />
                        </a>
                    </div>
                </div>

                <div className="tmh-nav" aria-label="Slideshow controls">
                    {showArrows && (
                        <div className="tmh-arrows">
                            <button
                                className="tmh-arrow"
                                type="button"
                                onClick={() => {
                                    goTo(activeIndex - 1)
                                }}
                                aria-label="Previous slide"
                            >
                                <ArrowIcon direction="left" />
                            </button>
                            <button
                                className="tmh-arrow"
                                type="button"
                                onClick={() => {
                                    goTo(activeIndex + 1)
                                }}
                                aria-label="Next slide"
                            >
                                <ArrowIcon direction="right" />
                            </button>
                        </div>
                    )}
                    {showThumbnails && (
                        <div
                            className="tmh-thumbs"
                            role="group"
                            aria-label="Choose a slide"
                        >
                            {safeSlides.map((item, itemIndex) => {
                                const itemFallback =
                                    defaultSlides[
                                        itemIndex % defaultSlides.length
                                    ]
                                const thumbImage = imageValue(
                                    item.image,
                                    itemFallback.image
                                )
                                const thumbAlt =
                                    item.imageAlt ||
                                    (typeof item.image === "object"
                                        ? item.image?.alt
                                        : "") ||
                                    item.title ||
                                    `Slide ${itemIndex + 1}`
                                return (
                                    <button
                                        className={`tmh-thumb${activeIndex === itemIndex ? " tmh-thumb-active" : ""}`}
                                        type="button"
                                        aria-pressed={activeIndex === itemIndex}
                                        aria-label={`Show slide ${itemIndex + 1}: ${item.title || "Campaign"}`}
                                        key={`${itemIndex}-${thumbImage.src}`}
                                        onClick={() => {
                                            goTo(itemIndex)
                                        }}
                                    >
                                        <img
                                            src={thumbImage.src}
                                            alt={thumbAlt}
                                            draggable={false}
                                        />
                                        <span className="tmh-thumb-index">
                                            {String(itemIndex + 1).padStart(
                                                2,
                                                "0"
                                            )}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="tmh-bottom-note" aria-hidden="true">
                    Scroll the story ·{" "}
                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(count).padStart(2, "0")}
                </div>
                <div className="tmh-grain" aria-hidden="true" />
            </div>
        </>
    )
}

TrailmarkHeroCarousel.defaultProps = {
    width: 1440,
    height: 820,
    slides: defaultSlides,
    brandLabel: "ROAM / TECHNICAL OUTDOOR",
    autoplay: true,
    autoplayDelay: 5,
    pauseOnHover: true,
    marqueeSpeed: 27,
    showThumbnails: true,
    showArrows: true,
    radius: 0,
    accent: "#D3AB78",
}

addPropertyControls(TrailmarkHeroCarousel, {
    brandLabel: {
        type: ControlType.String,
        title: "Brand label",
        defaultValue: "ROAM / TECHNICAL OUTDOOR",
    },
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                eyebrow: { type: ControlType.String, title: "Eyebrow" },
                title: { type: ControlType.String, title: "Headline" },
                description: { type: ControlType.String, title: "Description" },
                buttonLabel: {
                    type: ControlType.String,
                    title: "Button label",
                },
                link: { type: ControlType.Link, title: "Button link" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                imageAlt: { type: ControlType.String, title: "Image alt text" },
                marquee: { type: ControlType.String, title: "Marquee text" },
                background: { type: ControlType.Color, title: "Background" },
            },
        },
        defaultValue: defaultSlides,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Delay",
        min: 2,
        max: 20,
        step: 1,
        unit: "s",
        defaultValue: 5,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on hover",
        defaultValue: true,
    },
    marqueeSpeed: {
        type: ControlType.Number,
        title: "Marquee speed",
        min: 10,
        max: 60,
        step: 1,
        unit: "s",
        defaultValue: 27,
    },
    showThumbnails: {
        type: ControlType.Boolean,
        title: "Thumbnails",
        defaultValue: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrow controls",
        defaultValue: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Corner radius",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#D3AB78",
    },
})
