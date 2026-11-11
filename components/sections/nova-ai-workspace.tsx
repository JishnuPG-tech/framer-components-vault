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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type Props = {
    fluidImage?: string
    profileImage?: string
    recent1?: string
    recent2?: string
    recent3?: string
    recent4?: string
    accent: string
    background: string
    text: string
    motion: boolean
}

const activities = [
    ["YouTube Growth Strategy", "2 hours ago"],
    ["Brand Collaboration Ideas", "5 hours ago"],
    ["Audience Analysis", "1 day ago"],
    ["Video Script — Intro", "2 days ago"],
]

export default function NovaAIWorkspace(props: Props) {
    const {
        fluidImage,
        profileImage,
        recent1,
        recent2,
        recent3,
        recent4,
        accent = "#2864FF",
        background = "#F3F0EA",
        text = "#161616",
        motion = true,
    } = props

    const [prompt, setPrompt] = React.useState("")
    const [sending, setSending] = React.useState(false)

    const recentImages = [recent1, recent2, recent3, recent4]

    function send() {
        if (!prompt.trim()) return

        setSending(true)

        window.setTimeout(() => {
            setSending(false)
        }, 1100)
    }

    return (
        <div
            className={`nova ${motion ? "motion" : ""}`}
            style={
                {
                    "--accent": accent,
                    "--bg": background,
                    "--text": text,
                    background,
                    color: text,
                } as React.CSSProperties
            }
        >
            <style>{CSS}</style>

            <div className="shell">
                <Header profileImage={profileImage} />

                <FluidBackground image={fluidImage} />

                <div className="layout">
                    <main className="main">
                        <Hero />

                        <Composer
                            prompt={prompt}
                            setPrompt={setPrompt}
                            sending={sending}
                            send={send}
                        />

                        <div className="capabilities">
                            <SummaryCard />
                            <GenerateCard />
                            <AnalyzeCard />
                        </div>
                    </main>

                    <aside className="aside">
                        <AnalysisCard />
                        <RecentCard images={recentImages} />
                    </aside>
                </div>
            </div>
        </div>
    )
}

/* =========================================================
   FLUID
========================================================= */

function FluidBackground({ image }: { image?: string }) {
    if (!image) return null

    return (
        <div className="fluidScene">
            <div className="fluidGlow" />
            <img className="fluidImage" src={image} alt="" />
        </div>
    )
}

/* =========================================================
   HEADER
========================================================= */

function Header({ profileImage }: { profileImage?: string }) {
    return (
        <header className="header">
            <div className="brand">
                <Sparkle size={23} />
                <span>NOVA</span>
            </div>

            <nav className="nav">
                <button className="active">Workspace</button>
                <button>Library</button>
                <button>Templates</button>
                <button>Activity</button>
            </nav>

            <div className="headerActions">
                <button className="searchButton">
                    <Search />
                </button>

                <Avatar image={profileImage} />
            </div>
        </header>
    )
}

/* =========================================================
   HERO
========================================================= */

function Hero() {
    return (
        <section className="hero">
            <div className="eyebrow">AI WORKSPACE</div>

            <h1>
                <span>Turn ideas</span>
                <em>into momentum.</em>
            </h1>

            <p></p>

            <div className="online">
                <i />
                <span>AI online</span>
            </div>
        </section>
    )
}

/* =========================================================
   COMPOSER
========================================================= */

function Composer({
    prompt,
    setPrompt,
    sending,
    send,
}: {
    prompt: string
    setPrompt: (value: string) => void
    sending: boolean
    send: () => void
}) {
    return (
        <section className="composer glass">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything, create, analyze or brainstorm..."
            />

            <div className="composerBottom">
                <div className="tools">
                    <button className="tool iconTool">
                        <Plus />
                    </button>

                    <button className="tool">
                        <Globe />
                        <span>Search</span>
                    </button>

                    <button className="tool">
                        <Paperclip />
                        <span>Attach</span>
                    </button>
                </div>

                <div className="composerRight">
                    <button className="model">
                        <Sparkle size={13} />
                        <span>GPT-4o</span>
                        <Chevron />
                    </button>

                    <button
                        className={`send ${sending ? "sending" : ""}`}
                        onClick={send}
                    >
                        {sending ? <Check /> : <ArrowUp />}
                    </button>
                </div>
            </div>
        </section>
    )
}

/* =========================================================
   CAPABILITY CARDS
========================================================= */

function SummaryCard() {
    return (
        <article className="capCard glass">
            <CardHeader icon={<Document />} title="SUMMARIZE" />

            <h2>
                Turn long content
                <br />
                into clear insights.
            </h2>

            <div className="miniFiles">
                <MiniFile icon={<Document />} label="PDF" />
                <MiniFile icon={<Play />} label="Video" />
                <MiniFile icon={<Document />} label="Article" />
            </div>
        </article>
    )
}

function GenerateCard() {
    return (
        <article className="capCard glass">
            <CardHeader icon={<Sparkle size={17} />} title="GENERATE" />

            <h2>
                Create content
                <br />
                that fits your goals.
            </h2>

            <div className="chips">
                <span>Blog post</span>
                <span>YouTube script</span>
                <span>Social media</span>
                <span>Email</span>
            </div>
        </article>
    )
}

function AnalyzeCard() {
    return (
        <article className="capCard glass">
            <CardHeader icon={<Chart />} title="ANALYZE" />

            <h2>
                Find patterns
                <br />
                and opportunities.
            </h2>

            <div className="chartBox">
                <strong>+12%</strong>

                <svg viewBox="0 0 180 55" preserveAspectRatio="none">
                    <path
                        d="M0 43 C18 45 26 37 43 36 C61 34 69 22 85 27 C103 33 110 40 126 25 C143 10 153 14 180 11"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="1.6"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                    />

                    <path d="M0 51H180" stroke="rgba(0,0,0,.05)" />
                </svg>
            </div>
        </article>
    )
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="cardHeader">
            <div className="cardLabel">
                {icon}
                <span>{title}</span>
            </div>

            <button className="cardArrow">
                <ArrowRight />
            </button>
        </div>
    )
}

function MiniFile({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="miniFile">
            <div className="miniFileIcon">{icon}</div>
            <span>{label}</span>
        </div>
    )
}

/* =========================================================
   ANALYSIS CARD
========================================================= */

function AnalysisCard() {
    const steps = [
        ["done", "Understanding context"],
        ["active", "Searching relevant sources"],
        ["idle", "Generating structured output"],
        ["idle", "Finalizing results"],
    ]

    return (
        <section className="analysisCard glass">
            <div className="analysisTitle">
                <Wave />
                <span>Analyzing your request...</span>
            </div>

            <div className="analysisSteps">
                {steps.map(([status, label]) => (
                    <div className="analysisStep" key={label}>
                        <i className={status} />
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

function Wave() {
    return (
        <div className="wave">
            {[8, 15, 23, 13, 27, 18, 10].map((height, index) => (
                <i
                    key={index}
                    style={{
                        height,
                        animationDelay: `${index * -0.13}s`,
                    }}
                />
            ))}
        </div>
    )
}

/* =========================================================
   RECENT ACTIVITY
========================================================= */

function RecentCard({ images }: { images: Array<string | undefined> }) {
    const fallback = [
        "linear-gradient(135deg,#8093A0,#E3C47F)",
        "linear-gradient(135deg,#B38D78,#E8D8CC)",
        "linear-gradient(135deg,#C8C1B7,#817B75)",
        "linear-gradient(135deg,#BCA38B,#E5D4C5)",
    ]

    return (
        <section className="recentCard glass">
            <div className="recentHeader">
                <strong>Recent activity</strong>
                <button>See all</button>
            </div>

            <div className="recentList">
                {activities.map(([title, time], index) => (
                    <div className="recentItem" key={title}>
                        <div
                            className="recentThumb"
                            style={{ background: fallback[index] }}
                        >
                            {images[index] && (
                                <img src={images[index]} alt="" />
                            )}
                        </div>

                        <div className="recentCopy">
                            <strong>{title}</strong>
                            <span>{time}</span>
                        </div>

                        <button className="more">⋮</button>
                    </div>
                ))}
            </div>
        </section>
    )
}

function Avatar({ image }: { image?: string }) {
    return <div className="avatar">{image && <img src={image} alt="" />}</div>
}

/* =========================================================
   CSS
========================================================= */

const CSS = `
.nova,
.nova * {
    box-sizing: border-box;
}

.nova {
    width: 100%;
    padding: 20px;
    container-type: inline-size;

    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}

.nova button,
.nova textarea {
    font: inherit;
}

.nova button {
    color: inherit;
}

.shell {
    position: relative;
    isolation: isolate;

    width: 100%;
    max-width: 1480px;
    min-height: 820px;

    margin: 0 auto;
    overflow: hidden;

    border: 1px solid rgba(35,30,25,.07);
    border-radius: 30px;

    background:
        radial-gradient(
            circle at 73% 39%,
            rgba(70,100,255,.045),
            transparent 31%
        ),
        linear-gradient(
            135deg,
            rgba(255,255,255,.80),
            rgba(250,247,242,.84)
        );

    box-shadow:
        0 28px 80px rgba(60,50,42,.08);
}

/* =====================================================
   DESKTOP FLUID
   DESKTOP = AYNI
===================================================== */

.fluidScene {
    position: absolute;
    z-index: 2;

    width: 690px;
    height: 535px;

    right: -5px;
    top: 55px;

    pointer-events: none;
}

.fluidGlow {
    position: absolute;

    width: 78%;
    height: 74%;

    left: 8%;
    top: 13%;

    border-radius: 50%;

    background:
        radial-gradient(
            circle,
            rgba(48,87,255,.16),
            rgba(100,120,255,.06) 46%,
            transparent 72%
        );

    filter: blur(48px);
}

.fluidImage {
    position: absolute;
    inset: 0;

    width: 100%;
    height: 100%;

    object-fit: contain;
    object-position: center;

    opacity: .78;

    filter:
        saturate(.94)
        brightness(1.06)
        drop-shadow(
            0 30px 55px
            rgba(55,80,200,.09)
        );

    transform-origin: 52% 52%;
}

.motion .fluidImage {
    animation:
        fluidFloat
        10s
        ease-in-out
        infinite;
}

.motion .fluidGlow {
    animation:
        fluidGlowMotion
        8s
        ease-in-out
        infinite alternate;
}

@keyframes fluidFloat {
    0%,
    100% {
        transform:
            translate3d(0,0,0)
            rotate(-1deg)
            scale(1);
    }

    35% {
        transform:
            translate3d(8px,-6px,0)
            rotate(.8deg)
            scale(1.015);
    }

    70% {
        transform:
            translate3d(-5px,6px,0)
            rotate(-.7deg)
            scale(.995);
    }
}

@keyframes fluidGlowMotion {
    from {
        opacity: .42;
        transform: scale(.94);
    }

    to {
        opacity: .72;
        transform: scale(1.06);
    }
}

/* =====================================================
   HEADER
===================================================== */

.header {
    position: relative;
    z-index: 30;

    height: 78px;

    display: grid;

    grid-template-columns:
        200px
        minmax(0,1fr)
        200px;

    align-items: center;

    padding: 0 40px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 14px;

    color: var(--accent);
}

.brand span {
    color: var(--text);

    font-size: 12px;
    font-weight: 750;

    letter-spacing: .35em;
}

.nav {
    display: flex;
    align-items: center;
    justify-content: center;

    gap: 45px;
}

.nav button {
    position: relative;

    padding: 10px 0;

    border: 0;

    background: transparent;

    color: #8F8A85;

    font-size: 10px;

    cursor: pointer;
}

.nav button.active {
    color: var(--text);
    font-weight: 650;
}

.nav button.active:after {
    content: "";

    position: absolute;

    left: 50%;
    bottom: 0;

    width: 4px;
    height: 4px;

    transform: translateX(-50%);

    border-radius: 50%;

    background: var(--accent);
}

.headerActions {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    gap: 14px;
}

.searchButton {
    width: 38px;
    height: 38px;

    display: grid;
    place-items: center;

    border:
        1px solid
        rgba(25,25,25,.055);

    border-radius: 50%;

    background:
        rgba(255,255,255,.62);

    cursor: pointer;
}

.avatar {
    width: 39px;
    height: 39px;

    overflow: hidden;

    border-radius: 50%;

    background:
        linear-gradient(
            135deg,
            #D6C4B5,
            #89776B
        );
}

.avatar img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;
}

/* =====================================================
   LAYOUT
===================================================== */

.layout {
    position: relative;
    z-index: 5;

    display: grid;

    grid-template-columns:
        minmax(0,1fr)
        275px;

    gap: 18px;

    padding:
        8px
        38px
        35px;
}

.main {
    position: relative;
    min-width: 0;
}

/* =====================================================
   HERO
===================================================== */

.hero {
    position: relative;
    z-index: 6;

    height: 280px;

    padding:
        30px
        0
        0
        12px;
}

.eyebrow {
    margin-bottom: 20px;

    color: #56524E;

    font-size: 8px;
    font-weight: 750;

    letter-spacing: .30em;
}

.hero h1 {
    position: relative;
    z-index: 10;

    width: 560px;

    margin: 0;

    font-size:
        clamp(
            54px,
            5vw,
            75px
        );

    line-height: .87;
    font-weight: 400;

    letter-spacing: -.055em;
}

.hero h1 span,
.hero h1 em {
    display: block;
}

.hero h1 em {
    margin-top: 8px;

    font-family:
        Georgia,
        "Times New Roman",
        serif;

    font-weight: 400;
    font-style: italic;

    letter-spacing: -.045em;
}

.hero p {
    position: absolute;
    z-index: 10;

    left: 48%;
    top: 137px;

    width: 165px;

    margin: 0;

    color: #79746F;

    font-size: 10px;
    line-height: 1.55;
}

.online {
    position: absolute;
    z-index: 20;

    right: -3px;
    top: 188px;

    height: 34px;

    display: flex;
    align-items: center;

    gap: 7px;

    padding: 0 14px;

    border:
        1px solid
        rgba(255,255,255,.82);

    border-radius: 999px;

    background:
        rgba(248,250,255,.62);

    backdrop-filter:
        blur(20px)
        saturate(135%);

    -webkit-backdrop-filter:
        blur(20px)
        saturate(135%);

    color: #5369A8;

    font-size: 7px;

    box-shadow:
        0 12px 30px
        rgba(44,67,160,.06);
}

.online i {
    width: 6px;
    height: 6px;

    border-radius: 50%;

    background:
        var(--accent);

    box-shadow:
        0 0 0 4px
        rgba(40,100,255,.07);
}

/* =====================================================
   GLASS
===================================================== */

.glass {
    border:
        1px solid
        rgba(255,255,255,.80);

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.65),
            rgba(255,255,255,.37)
        );

    backdrop-filter:
        blur(25px)
        saturate(128%);

    -webkit-backdrop-filter:
        blur(25px)
        saturate(128%);

    box-shadow:
        0 18px 45px
        rgba(60,50,42,.045),
        inset 0 0 0 1px
        rgba(35,30,25,.025);
}

/* =====================================================
   COMPOSER
===================================================== */

.composer {
    position: relative;
    z-index: 12;

    min-height: 120px;

    padding:
        18px
        18px
        13px;

    border-radius: 22px;
}

.composer textarea {
    display: block;

    width: 100%;
    height: 51px;

    padding: 2px 4px;

    resize: none;

    border: 0;
    outline: 0;

    background: transparent;

    color: var(--text);

    font-size: 13px;
}

.composer textarea::placeholder {
    color: #999590;
}

.composerBottom {
    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 10px;
}

.tools,
.composerRight {
    display: flex;
    align-items: center;

    gap: 7px;
}

.tool,
.model {
    height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    border: 0;
    border-radius: 999px;

    background:
        rgba(244,242,239,.76);

    font-size: 8px;

    cursor: pointer;
}

.tool {
    padding: 0 13px;
}

.iconTool {
    width: 34px;

    padding: 0;
}

.tool svg,
.model svg {
    width: 13px;
    height: 13px;
}

.model {
    padding: 0 13px;
}

.send {
    width: 42px;
    height: 42px;

    display: grid;
    place-items: center;

    border: 0;
    border-radius: 50%;

    background: #171717;
    color: #FFFFFF;

    cursor: pointer;

    transition:
        transform .2s ease,
        background .2s ease;
}

.send svg {
    display: block;
    stroke: #FFFFFF !important;
    color: #FFFFFF !important;
}

.send:hover {
    transform:
        translateY(-2px);
}

.send.sending {
    background:
        var(--accent);

    transform:
        scale(.93);
}

/* =====================================================
   CAPABILITY CARDS
===================================================== */

.capabilities {
    position: relative;
    z-index: 12;

    display: grid;

    grid-template-columns:
        repeat(3,minmax(0,1fr));

    gap: 12px;

    margin-top: 14px;
}

.capCard {
    position: relative;

    min-height: 210px;

    overflow: hidden;

    padding: 19px;

    border-radius: 20px;

    transition:
        transform .25s ease,
        background .25s ease;
}

.capCard:hover {
    transform:
        translateY(-2px);

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.78),
            rgba(255,255,255,.47)
        );
}

.cardHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cardLabel {
    display: flex;
    align-items: center;

    gap: 11px;

    font-size: 7px;
    font-weight: 750;

    letter-spacing: .27em;
}

.cardLabel svg {
    color:
        var(--accent);
}

.cardArrow {
    width: 34px;
    height: 34px;

    display: grid;
    place-items: center;

    border:
        1px solid
        rgba(25,25,25,.055);

    border-radius: 50%;

    background:
        rgba(255,255,255,.60);

    cursor: pointer;
}

.capCard h2 {
    margin:
        17px
        0
        0;

    font-family:
        Georgia,
        "Times New Roman",
        serif;

    font-size: 23px;
    line-height: 1.02;

    font-weight: 400;

    letter-spacing: -.025em;
}

.miniFiles {
    position: absolute;

    left: 19px;
    bottom: 17px;

    display: flex;

    gap: 6px;
}

.miniFile {
    width: 60px;
    height: 57px;

    padding: 7px;

    border:
        1px solid
        rgba(25,25,25,.055);

    border-radius: 10px;

    background:
        rgba(255,255,255,.48);

    font-size: 7px;
}

.miniFileIcon {
    width: 20px;
    height: 20px;

    display: grid;
    place-items: center;

    margin-bottom: 6px;

    border-radius: 5px;

    color:
        var(--accent);

    background:
        rgba(40,100,255,.07);
}

.miniFileIcon svg {
    width: 10px;
    height: 10px;
}

.chips {
    position: absolute;

    left: 19px;
    right: 19px;
    bottom: 18px;

    display: flex;
    flex-wrap: wrap;

    gap: 6px;
}

.chips span {
    padding:
        7px
        11px;

    border:
        1px solid
        rgba(25,25,25,.06);

    border-radius: 999px;

    background:
        rgba(255,255,255,.40);

    color: #5F5A56;

    font-size: 7px;
}

.chartBox {
    position: absolute;

    left: 19px;
    right: 19px;
    bottom: 17px;

    height: 66px;

    overflow: hidden;

    border:
        1px solid
        rgba(25,25,25,.05);

    border-radius: 11px;

    background:
        rgba(255,255,255,.44);
}

.chartBox strong {
    position: absolute;

    left: 13px;
    top: 19px;

    color:
        var(--accent);

    font-size: 18px;
}

.chartBox svg {
    position: absolute;

    left: 78px;
    top: 8px;

    width:
        calc(100% - 87px);

    height: 50px;
}

/* =====================================================
   RIGHT SIDE
===================================================== */

.aside {
    position: relative;
    z-index: 16;

    display: flex;
    flex-direction: column;

    gap: 38px;

    padding-top: 8px;
}

.analysisCard {
    min-height: 228px;

    padding: 21px;

    border-radius: 20px;
}

.analysisTitle {
    display: flex;
    align-items: center;

    gap: 13px;

    margin-bottom: 24px;

    font-size: 9px;
}

.wave {
    height: 27px;

    display: flex;
    align-items: center;

    gap: 2px;
}

.wave i {
    width: 2px;

    display: block;

    border-radius: 999px;

    background:
        var(--accent);
}

.motion .wave i {
    animation:
        waveAnimation
        .95s
        ease-in-out
        infinite alternate;
}

@keyframes waveAnimation {
    from {
        transform:
            scaleY(.45);

        opacity: .42;
    }

    to {
        transform:
            scaleY(1);

        opacity: 1;
    }
}

.analysisSteps {
    display: flex;
    flex-direction: column;

    gap: 16px;
}

.analysisStep {
    display: grid;

    grid-template-columns:
        12px
        1fr;

    align-items: center;

    gap: 10px;

    color: #494541;

    font-size: 8px;
}

.analysisStep i {
    width: 9px;
    height: 9px;

    display: grid;
    place-items: center;

    border:
        1px solid
        rgba(25,25,25,.25);

    border-radius: 50%;
}

.analysisStep i.done {
    border-color:
        var(--accent);

    background:
        var(--accent);
}

.analysisStep i.done:after {
    content: "✓";

    color: white;

    font-size: 6px;
}

.analysisStep i.active {
    border-color:
        var(--accent);

    background:
        var(--accent);

    box-shadow:
        inset
        0 0 0
        2px white;
}

/* =====================================================
   RECENT
===================================================== */

.recentCard {
    padding: 17px;

    border-radius: 19px;
}

.recentHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;

    margin-bottom: 9px;
}

.recentHeader strong {
    font-size: 11px;
}

.recentHeader button {
    border: 0;

    background: transparent;

    color:
        var(--accent);

    font-size: 7px;

    cursor: pointer;
}

.recentItem {
    min-height: 51px;

    display: grid;

    grid-template-columns:
        45px
        minmax(0,1fr)
        10px;

    align-items: center;

    gap: 9px;
}

.recentThumb {
    width: 45px;
    height: 35px;

    overflow: hidden;

    border-radius: 7px;
}

.recentThumb img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;
}

.recentCopy {
    min-width: 0;
}

.recentCopy strong {
    display: block;

    overflow: hidden;

    font-size: 8px;
    font-weight: 600;

    text-overflow: ellipsis;
    white-space: nowrap;
}

.recentCopy span {
    display: block;

    margin-top: 3px;

    color: #8E8984;

    font-size: 7px;
}

.more {
    padding: 0;

    border: 0;

    background: transparent;

    cursor: pointer;
}

/* =====================================================
   TABLET — 810px → 1199px

   IMPORTANT:
   Fluid is moved significantly LEFT.
   Desktop remains untouched.
===================================================== */

@container (max-width: 1199px) and (min-width: 810px) {

    .nova {
        padding: 13px;
    }

    .shell {
        min-height: 700px;

        border-radius: 25px;
    }

    .fluidScene {
        width: 555px;
        height: 425px;

        /*
        POSITIVE right value = moves artwork LEFT.
        This is intentionally much further left.
        */
        right: 115px;

        top: 48px;
    }

    .fluidImage {
        opacity: .72;
    }

    .header {
        height: 66px;

        grid-template-columns:
            130px
            minmax(0,1fr)
            90px;

        padding: 0 24px;
    }

    .nav {
        gap: 25px;
    }

    .layout {
        grid-template-columns:
            minmax(0,1fr)
            210px;

        gap: 13px;

        padding:
            4px
            24px
            24px;
    }

    .hero {
        height: 225px;

        padding:
            22px
            0
            0
            7px;
    }

    .hero h1 {
        width: 390px;

        font-size: 47px;
    }

    .hero p {
        left: 47%;
        top: 110px;

        width: 125px;

        font-size: 8px;
    }

    .online {
        right: -2px;
        top: 151px;

        height: 30px;
    }

    .composer {
        min-height: 107px;

        padding:
            15px
            14px
            11px;
    }

    .composer textarea {
        height: 43px;

        font-size: 11px;
    }

    .capabilities {
        gap: 8px;
    }

    .capCard {
        min-height: 175px;

        padding: 14px;
    }

    .capCard h2 {
        margin-top: 12px;

        font-size: 18px;
    }

    .cardArrow {
        width: 30px;
        height: 30px;
    }

    .miniFiles {
        left: 14px;
        bottom: 13px;
    }

    .miniFile {
        width: 46px;
        height: 47px;

        padding: 5px;
    }

    .miniFileIcon {
        width: 16px;
        height: 16px;

        margin-bottom: 3px;
    }

    .chips {
        left: 14px;
        right: 14px;
        bottom: 13px;
    }

    .chips span {
        padding:
            6px
            8px;
    }

    .chartBox {
        left: 14px;
        right: 14px;
        bottom: 13px;

        height: 53px;
    }

    .chartBox strong {
        top: 15px;

        font-size: 14px;
    }

    .aside {
        gap: 25px;
    }

    .analysisCard {
        min-height: 195px;

        padding: 15px;
    }

    .analysisTitle {
        gap: 8px;

        margin-bottom: 18px;

        font-size: 8px;
    }

    .analysisSteps {
        gap: 13px;
    }

    .analysisStep {
        font-size: 7px;
    }

    .recentCard {
        padding: 13px;
    }

    .recentItem {
        min-height: 44px;

        grid-template-columns:
            36px
            minmax(0,1fr)
            8px;

        gap: 7px;
    }

    .recentThumb {
        width: 36px;
        height: 29px;
    }
}

/* =====================================================
   PHONE — 0px → 809px

   Fluid:
   - fully inside frame
   - no right clipping
   - smaller
   - stays on right
   - avoids headline
===================================================== */

@container (max-width: 809px) {

    .nova {
        padding: 7px;
    }

    .shell {
        min-height: 0;

        border-radius: 21px;
    }

    .fluidScene {
        width: 270px;
        height: 220px;

        right: 4px;
        top: 132px;
    }

    .fluidImage {
        opacity: .48;

        object-fit: contain;
    }

    .fluidGlow {
        width: 72%;
        height: 68%;

        left: 14%;
        top: 16%;

        opacity: .38;
    }

    .header {
        height: 59px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        padding: 0 15px;
    }

    .nav,
    .searchButton {
        display: none;
    }

    .brand span {
        font-size: 9px;
    }

    .avatar {
        width: 33px;
        height: 33px;
    }

    .layout {
        display: block;

        padding:
            0
            13px
            16px;
    }

    .hero {
        height: 205px;

        padding:
            25px
            0
            0
            3px;
    }

    .eyebrow {
        margin-bottom: 12px;

        font-size: 6px;
    }

    .hero h1 {
        width: 300px;

        font-size: 38px;
        line-height: .9;
    }

    .hero h1 em {
        margin-top: 4px;
    }

    .hero p {
        position: relative;

        left: auto;
        top: auto;

        width: 150px;

        margin-top: 13px;

        font-size: 8px;
    }

    .online {
        display: none;
    }

    .composer {
        min-height: 99px;

        padding:
            13px
            12px
            10px;

        border-radius: 17px;

        background:
            linear-gradient(
                145deg,
                rgba(255,255,255,.74),
                rgba(255,255,255,.48)
            );
    }

    .composer textarea {
        height: 40px;

        font-size: 10px;
    }

    .tools {
        gap: 5px;
    }

    .tool {
        width: 31px;
        height: 31px;

        padding: 0;
    }

    .tool span {
        display: none;
    }

    .model {
        height: 31px;

        padding: 0 9px;

        font-size: 7px;
    }

    .send {
        width: 36px;
        height: 36px;
    }

    .capabilities {
        display: flex;
        flex-direction: column;

        gap: 7px;

        margin-top: 9px;
    }

    .capCard {
        min-height: 67px;

        display: grid;

        grid-template-columns:
            minmax(0,1fr)
            32px;

        grid-template-rows:
            auto
            auto;

        align-items: center;

        padding:
            12px
            13px;

        border-radius: 14px;

        background:
            linear-gradient(
                145deg,
                rgba(255,255,255,.70),
                rgba(255,255,255,.44)
            );
    }

    .cardHeader {
        display: contents;
    }

    .cardLabel {
        grid-column: 1;
        grid-row: 1;

        font-size: 6px;
    }

    .cardArrow {
        grid-column: 2;
        grid-row: 1 / span 2;

        width: 30px;
        height: 30px;
    }

    .capCard h2 {
        grid-column: 1;
        grid-row: 2;

        margin:
            5px
            30px
            0
            28px;

        font-family:
            Inter,
            sans-serif;

        color: #716D68;

        font-size: 8px;
        line-height: 1.3;
    }

    .capCard h2 br {
        display: none;
    }

    .miniFiles,
    .chips,
    .chartBox {
        display: none;
    }

    .aside {
        display: none;
    }
}

/* =====================================================
   SMALL PHONE
===================================================== */

@container (max-width: 430px) {

    .hero h1 {
        width: 270px;

        font-size: 34px;
    }

    /*
       Small phone:
       fully visible and kept to the right.
    */

    .fluidScene {
        width: 235px;
        height: 195px;

        right: 2px;
        top: 138px;
    }

    .hero p {
        width: 130px;
    }

    .model span {
        display: none;
    }
}

@media (prefers-reduced-motion: reduce) {

    .nova *,
    .nova *:before,
    .nova *:after {
        animation: none !important;
        transition: none !important;
    }
}
`

/* =========================================================
   ICONS
========================================================= */

function iconProps(size = 16) {
    return {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.65,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }
}

function Sparkle({ size = 16 }: { size?: number }) {
    return (
        <svg {...iconProps(size)}>
            <path d="M12 2.5c.7 5.3 3.7 8.3 9 9-5.3.7-8.3 3.7-9 9-.7-5.3-3.7-8.3-9-9 5.3-.7 8.3-3.7 9-9Z" />
        </svg>
    )
}

function Search() {
    return (
        <svg {...iconProps()}>
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="m15 15 4.5 4.5" />
        </svg>
    )
}

function Plus() {
    return (
        <svg {...iconProps()}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    )
}

function Globe() {
    return (
        <svg {...iconProps()}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.2 3.3 8.5S14.2 18.1 12 20.5C9.8 18.1 8.7 15.3 8.7 12S9.8 5.9 12 3.5Z" />
        </svg>
    )
}

function Paperclip() {
    return (
        <svg {...iconProps()}>
            <path d="m9 12.5 5.7-5.7a3 3 0 0 1 4.2 4.2l-7.5 7.5a5 5 0 0 1-7.1-7.1l7.2-7.2" />
        </svg>
    )
}

function Chevron() {
    return (
        <svg {...iconProps(12)}>
            <path d="m8 10 4 4 4-4" />
        </svg>
    )
}

function ArrowUp() {
    return (
        <svg {...iconProps(17)}>
            <path d="m6 10 6-6 6 6M12 4v16" />
        </svg>
    )
}

function ArrowRight() {
    return (
        <svg {...iconProps(14)}>
            <path d="M5 12h14M14 7l5 5-5 5" />
        </svg>
    )
}

function Check() {
    return (
        <svg {...iconProps(17)}>
            <path d="m5 12 4 4 10-10" />
        </svg>
    )
}

function Document() {
    return (
        <svg {...iconProps(15)}>
            <path d="M6 3h8l4 4v14H6Z" />
            <path d="M14 3v5h4M9 12h6M9 16h5" />
        </svg>
    )
}

function Play() {
    return (
        <svg {...iconProps(13)}>
            <path d="m9 7 8 5-8 5Z" />
        </svg>
    )
}

function Chart() {
    return (
        <svg {...iconProps(17)}>
            <path d="M5 20V12M10 20V6M15 20v-9M20 20V4" />
        </svg>
    )
}

/* =========================================================
   FRAMER CONTROLS
========================================================= */

addPropertyControls(NovaAIWorkspace, {
    fluidImage: {
        type: ControlType.Image,
        title: "Fluid Image",
    },

    profileImage: {
        type: ControlType.Image,
        title: "Profile",
    },

    recent1: {
        type: ControlType.Image,
        title: "Recent 1",
    },

    recent2: {
        type: ControlType.Image,
        title: "Recent 2",
    },

    recent3: {
        type: ControlType.Image,
        title: "Recent 3",
    },

    recent4: {
        type: ControlType.Image,
        title: "Recent 4",
    },

    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#2864FF",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F3F0EA",
    },

    text: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#161616",
    },

    motion: {
        type: ControlType.Boolean,
        title: "Fluid Motion",
        defaultValue: true,
    },
})
