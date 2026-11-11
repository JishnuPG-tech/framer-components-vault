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
    accent: string
    background: string
    text: string
    motion: boolean
}

export default function InteractiveBentoFeatures(props: Props) {
    const {
        accent = "#5F72FF",
        background = "#F3EFE9",
        text = "#171717",
        motion = true,
    } = props

    return (
        <div
            className={`bentoRoot ${motion ? "motion" : ""}`}
            style={
                {
                    "--accent": accent,
                    "--background": background,
                    "--text": text,
                    background,
                    color: text,
                } as React.CSSProperties
            }
        >
            <style>{CSS}</style>

            <section className="bentoShell">
                <header className="intro">
                    <div className="eyebrow">FEATURES</div>

                    <h1>
                        Everything
                        <br />
                        you need
                        <br />
                        to turn
                        <br />
                        ideas
                        <em>into impact.</em>
                    </h1>

                    <p>
                        Explore powerful tools designed to help you create,
                        organize and grow — all in one place.
                    </p>

                    <button className="primaryButton">
                        Get started
                        <ArrowRight />
                    </button>
                </header>

                <div className="bentoGrid">
                    <div className="leftColumn">
                        <CreateCard />
                        <CollaborateCard />
                    </div>

                    <div className="rightColumn">
                        <OrganizeCard />
                        <AnalyzeCard />
                        <GrowCard />
                    </div>
                </div>
            </section>
        </div>
    )
}

/* =========================================================
   CREATE
========================================================= */

function CreateCard() {
    return (
        <article className="featureCard createCard">
            <div className="createGlow" />

            <div className="fluid">
                <div className="fluidRing ringOne" />
                <div className="fluidRing ringTwo" />
                <div className="fluidCore" />

                <div className="floatingIcon iconOne">
                    <ChartIcon />
                </div>

                <div className="floatingIcon iconTwo">
                    <Sparkle />
                </div>

                <div className="floatingIcon iconThree">
                    <Document />
                </div>
            </div>

            <div className="cardContent createContent">
                <div className="label">CREATE</div>

                <h2>
                    Create
                    <br />
                    with AI
                </h2>

                <p>
                    Turn your ideas into high-quality
                    <br />
                    content in seconds.
                </p>
            </div>

            <CardArrow />
        </article>
    )
}

/* =========================================================
   COLLABORATE
========================================================= */

function CollaborateCard() {
    return (
        <article className="featureCard collaborateCard">
            <div className="cardContent">
                <div className="label">COLLABORATE</div>

                <h2>
                    Work better
                    <br />
                    together.
                </h2>

                <p>
                    Share ideas, collect feedback
                    <br />
                    and move forward.
                </p>
            </div>

            <div className="people">
                <span className="person peach person1" />
                <span className="person peach person2" />
                <span className="person blue person3" />
                <span className="person blue person4" />
            </div>

            <CardArrow />
        </article>
    )
}

/* =========================================================
   ORGANIZE
========================================================= */

function OrganizeCard() {
    return (
        <article className="featureCard organizeCard">
            <div className="cardContent">
                <div className="label">ORGANIZE</div>

                <h2>
                    Keep
                    <br />
                    everything in
                    <br />
                    one place.
                </h2>

                <p>From ideas to results.</p>
            </div>

            <div className="folders">
                <span className="folder folderBack" />
                <span className="folder folderMiddle" />
                <span className="folder folderFront" />
            </div>

            <CardArrow />
        </article>
    )
}

/* =========================================================
   ANALYZE
========================================================= */

function AnalyzeCard() {
    return (
        <article className="featureCard analyzeCard">
            <div className="cardContent">
                <div className="label">ANALYZE</div>

                <h2>
                    Find patterns
                    <br />
                    and
                    <br />
                    opportunities.
                </h2>

                <p>Turn data into clear direction.</p>
            </div>

            <div className="bars">
                <span style={{ height: "38%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "82%" }} />
                <span style={{ height: "65%" }} />
            </div>

            <CardArrow />
        </article>
    )
}

/* =========================================================
   GROW
========================================================= */

function GrowCard() {
    return (
        <article className="featureCard growCard">
            <div className="growGlow" />

            <div className="cardContent">
                <div className="label">GROW</div>

                <h2>
                    Turn progress
                    <br />
                    into
                    <br />
                    momentum.
                </h2>

                <p>Build on what works.</p>
            </div>

            <div className="growthArrow">
                <svg
                    viewBox="0 0 170 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M14 83C50 79 74 67 95 47C108 35 120 27 143 21"
                        stroke="currentColor"
                        strokeWidth="9"
                        strokeLinecap="round"
                    />

                    <path
                        d="M119 14L150 18L143 49"
                        stroke="currentColor"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <CardArrow />
        </article>
    )
}

/* =========================================================
   COMMON
========================================================= */

function CardArrow() {
    return (
        <button className="cardArrow">
            <ArrowRight />
        </button>
    )
}

/* =========================================================
   CSS
========================================================= */

const CSS = `
.bentoRoot,
.bentoRoot * {
    box-sizing: border-box;
}

.bentoRoot {
    width: 100%;
    padding: 24px;

    container-type: inline-size;

    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}

.bentoRoot button {
    font: inherit;
}

.bentoShell {
    width: 100%;
    max-width: 1440px;

    margin: 0 auto;

    display: grid;

    grid-template-columns:
        minmax(260px, .72fr)
        minmax(0, 1.7fr);

    gap: 28px;

    padding: 36px;

    border: 1px solid rgba(30,25,20,.055);
    border-radius: 32px;

    background:
        radial-gradient(
            circle at 65% 20%,
            rgba(103,122,255,.10),
            transparent 30%
        ),
        radial-gradient(
            circle at 92% 76%,
            rgba(255,190,126,.11),
            transparent 30%
        ),
        rgba(255,255,255,.35);

    box-shadow:
        0 28px 80px rgba(60,50,40,.06);
}

/* =====================================================
   INTRO
===================================================== */

.intro {
    align-self: center;

    padding:
        28px
        12px
        28px
        8px;
}

.eyebrow,
.label {
    color: #69645F;

    font-size: 8px;
    font-weight: 750;

    letter-spacing: .27em;
}

.intro h1 {
    margin:
        17px
        0
        20px;

    font-size: clamp(37px, 4vw, 62px);
    line-height: .93;

    font-weight: 450;

    letter-spacing: -.055em;
}

.intro h1 em {
    display: block;

    margin-top: 6px;

    font-family:
        Georgia,
        "Times New Roman",
        serif;

    font-weight: 400;
    font-style: italic;

    letter-spacing: -.045em;
}

.intro p {
    max-width: 310px;

    margin: 0;

    color: #716C67;

    font-size: 12px;
    line-height: 1.65;
}

.primaryButton {
    height: 45px;

    display: flex;
    align-items: center;

    gap: 25px;

    margin-top: 27px;
    padding: 0 20px;

    border: 0;
    border-radius: 999px;

    background: #171717;
    color: white;

    font-size: 10px;

    cursor: pointer;

    transition:
        transform .28s cubic-bezier(.2,.8,.2,1),
        box-shadow .28s ease;
}

.primaryButton:hover {
    transform:
        translateY(-2px)
        rotate(-1deg);

    box-shadow:
        0 14px 30px rgba(20,20,20,.15);
}

/* =====================================================
   BENTO GRID
===================================================== */

.bentoGrid {
    min-width: 0;

    display: grid;

    grid-template-columns:
        minmax(0, 1.06fr)
        minmax(0, .94fr);

    gap: 12px;

    height: 552px;
}

.leftColumn,
.rightColumn {
    min-width: 0;
    height: 552px;

    display: flex;
    flex-direction: column;

    gap: 12px;
}

/*
LEFT:
355 + 12 + 185 = 552

RIGHT:
155 + 12 + 185 + 12 + 188 = 552

Bu yüzden Collaborate ve Grow alt çizgisi
tam olarak aynı hizada biter.
*/

.createCard {
    height: 355px;
    flex: none;
}

.collaborateCard {
    height: 185px;
    flex: none;
}

.organizeCard {
    height: 155px;
    flex: none;
}

.analyzeCard {
    height: 185px;
    flex: none;
}

.growCard {
    height: 188px;
    flex: none;
}

/* =====================================================
   CARD BASE
===================================================== */

.featureCard {
    position: relative;

    overflow: hidden;

    padding: 24px;

    border: 1px solid rgba(255,255,255,.80);
    border-radius: 25px;

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.78),
            rgba(255,255,255,.46)
        );

    backdrop-filter:
        blur(22px)
        saturate(120%);

    -webkit-backdrop-filter:
        blur(22px)
        saturate(120%);

    box-shadow:
        0 18px 45px rgba(70,60,50,.055),
        inset 0 0 0 1px rgba(30,25,20,.025);

    transform-origin: center;

    transition:
        transform .42s cubic-bezier(.16,1,.3,1),
        box-shadow .42s ease,
        border-color .42s ease;
}

/* Her kart farklı yöne çok hafif dönüyor */

.motion .createCard:hover {
    z-index: 20;

    transform:
        translateY(-7px)
        rotate(-1.25deg)
        scale(1.012);

    border-color: rgba(104,124,255,.28);

    box-shadow:
        0 32px 70px rgba(65,75,145,.14),
        inset 0 0 0 1px rgba(255,255,255,.75);
}

.motion .collaborateCard:hover {
    z-index: 20;

    transform:
        translateY(-6px)
        rotate(1.15deg)
        scale(1.012);

    border-color: rgba(255,174,110,.26);

    box-shadow:
        0 28px 60px rgba(125,90,65,.11),
        inset 0 0 0 1px rgba(255,255,255,.75);
}

.motion .organizeCard:hover {
    z-index: 20;

    transform:
        translateY(-6px)
        rotate(1.1deg)
        scale(1.012);

    border-color: rgba(235,170,110,.26);

    box-shadow:
        0 28px 60px rgba(130,95,65,.11),
        inset 0 0 0 1px rgba(255,255,255,.75);
}

.motion .analyzeCard:hover {
    z-index: 20;

    transform:
        translateY(-7px)
        rotate(-1deg)
        scale(1.012);

    border-color: rgba(104,124,255,.28);

    box-shadow:
        0 30px 65px rgba(70,80,150,.13),
        inset 0 0 0 1px rgba(255,255,255,.75);
}

.motion .growCard:hover {
    z-index: 20;

    transform:
        translateY(-6px)
        rotate(1.2deg)
        scale(1.012);

    border-color: rgba(235,160,95,.28);

    box-shadow:
        0 28px 60px rgba(135,90,55,.12),
        inset 0 0 0 1px rgba(255,255,255,.75);
}

.cardContent {
    position: relative;
    z-index: 6;

    max-width: 58%;
}

.cardContent h2 {
    margin:
        14px
        0
        8px;

    font-size: 24px;
    line-height: 1.02;

    font-weight: 500;

    letter-spacing: -.045em;
}

.cardContent p {
    margin: 0;

    color: #77716C;

    font-size: 9px;
    line-height: 1.5;
}

.cardArrow {
    position: absolute;
    z-index: 10;

    right: 18px;
    bottom: 18px;

    width: 40px;
    height: 40px;

    display: grid;
    place-items: center;

    border: 1px solid rgba(20,20,20,.055);
    border-radius: 50%;

    background:
        rgba(255,255,255,.78);

    color: #222;

    cursor: pointer;

    transition:
        transform .3s cubic-bezier(.16,1,.3,1),
        background .3s ease,
        color .3s ease,
        box-shadow .3s ease;
}

.featureCard:hover .cardArrow {
    transform:
        translate(3px,-3px)
        rotate(-5deg);

    background: var(--accent);
    color: white;

    box-shadow:
        0 10px 24px rgba(70,90,220,.18);
}

/* =====================================================
   CREATE VISUAL
===================================================== */

.createCard {
    background:
        radial-gradient(
            circle at 67% 39%,
            rgba(98,119,255,.19),
            transparent 38%
        ),
        linear-gradient(
            145deg,
            rgba(255,255,255,.82),
            rgba(239,242,255,.57)
        );
}

.createContent {
    position: absolute;

    left: 25px;
    bottom: 27px;

    max-width: 47%;
}

.createContent h2 {
    font-size: 34px;
}

.createGlow {
    position: absolute;

    width: 330px;
    height: 330px;

    right: -65px;
    top: -40px;

    border-radius: 50%;

    background:
        radial-gradient(
            circle,
            rgba(73,105,255,.25),
            rgba(122,146,255,.08) 48%,
            transparent 70%
        );

    filter: blur(32px);

    transition:
        transform .7s ease;
}

.createCard:hover .createGlow {
    transform:
        scale(1.14)
        translate(-10px,8px);
}

.fluid {
    position: absolute;

    width: 290px;
    height: 290px;

    right: -28px;
    top: 5px;

    transition:
        transform .8s cubic-bezier(.2,.8,.2,1);
}

.createCard:hover .fluid {
    transform:
        rotate(7deg)
        scale(1.06);
}

.fluidRing {
    position: absolute;

    border-radius:
        55% 45% 60% 40% /
        45% 55% 45% 55%;

    border:
        2px solid
        rgba(93,118,255,.36);

    background:
        linear-gradient(
            145deg,
            rgba(255,255,255,.78),
            rgba(95,122,255,.12)
        );

    box-shadow:
        inset 0 0 32px rgba(75,105,255,.12),
        0 22px 50px rgba(78,101,230,.10);

    backdrop-filter: blur(5px);
}

.ringOne {
    width: 245px;
    height: 168px;

    left: 10px;
    top: 30px;

    transform: rotate(18deg);
}

.ringTwo {
    width: 155px;
    height: 220px;

    right: 18px;
    top: 24px;

    transform: rotate(-27deg);
}

.fluidCore {
    position: absolute;

    width: 135px;
    height: 135px;

    right: 55px;
    top: 78px;

    border-radius:
        42% 58% 58% 42% /
        52% 45% 55% 48%;

    background:
        radial-gradient(
            circle at 35% 28%,
            rgba(255,255,255,.95),
            rgba(115,146,255,.82) 42%,
            rgba(73,95,235,.90) 72%,
            rgba(55,71,190,.90)
        );

    box-shadow:
        inset 15px 12px 25px rgba(255,255,255,.55),
        0 20px 45px rgba(69,91,220,.20);

    transform: rotate(28deg);
}

.floatingIcon {
    position: absolute;
    z-index: 8;

    width: 42px;
    height: 42px;

    display: grid;
    place-items: center;

    border: 1px solid rgba(255,255,255,.8);
    border-radius: 12px;

    background:
        rgba(255,255,255,.73);

    color: var(--accent);

    box-shadow:
        0 13px 30px rgba(70,80,160,.10);

    backdrop-filter: blur(10px);

    transition:
        transform .6s cubic-bezier(.2,.8,.2,1);
}

.iconOne {
    left: 45px;
    top: 36px;
}

.iconTwo {
    right: 17px;
    top: 74px;
}

.iconThree {
    right: 75px;
    bottom: 24px;
}

.createCard:hover .iconOne {
    transform:
        translate(-5px,-8px)
        rotate(-5deg);
}

.createCard:hover .iconTwo {
    transform:
        translate(7px,-5px)
        rotate(5deg);
}

.createCard:hover .iconThree {
    transform:
        translate(2px,8px)
        rotate(-3deg);
}

/* =====================================================
   COLLABORATE
===================================================== */

.collaborateCard {
    background:
        radial-gradient(
            circle at 72% 50%,
            rgba(255,184,125,.12),
            transparent 35%
        ),
        linear-gradient(
            145deg,
            rgba(255,255,255,.78),
            rgba(255,250,246,.50)
        );
}

.people {
    position: absolute;

    right: 75px;
    top: 50%;

    width: 130px;
    height: 100px;

    transform: translateY(-50%);
}

.person {
    position: absolute;

    width: 40px;
    height: 40px;

    border-radius: 50% 50% 44% 44%;

    box-shadow:
        inset 6px 6px 10px rgba(255,255,255,.6),
        0 10px 20px rgba(70,60,60,.09);

    transition:
        transform .4s cubic-bezier(.16,1,.3,1);
}

.person:after {
    content: "";

    position: absolute;

    left: -7px;
    top: 29px;

    width: 54px;
    height: 38px;

    border-radius:
        50% 50% 40% 40%;

    background: inherit;

    z-index: -1;
}

.peach {
    background:
        linear-gradient(
            145deg,
            #FFE3CF,
            #F2A978
        );
}

.blue {
    background:
        linear-gradient(
            145deg,
            #E5E8FF,
            #7789FF
        );
}

.person1 {
    left: 4px;
    top: 13px;

    transform: scale(.72);
}

.person2 {
    left: 38px;
    top: 0;

    transform: scale(.88);
}

.person3 {
    right: 0;
    top: 14px;

    transform: scale(.78);
}

.person4 {
    right: 35px;
    top: 37px;

    transform: scale(.95);
}

.collaborateCard:hover .person1 {
    transform:
        scale(.72)
        translate(-6px,-4px)
        rotate(-5deg);
}

.collaborateCard:hover .person2 {
    transform:
        scale(.88)
        translate(-2px,-8px)
        rotate(3deg);
}

.collaborateCard:hover .person3 {
    transform:
        scale(.78)
        translate(7px,-4px)
        rotate(5deg);
}

.collaborateCard:hover .person4 {
    transform:
        scale(.95)
        translate(4px,5px)
        rotate(-3deg);
}

/* =====================================================
   ORGANIZE
===================================================== */

.folders {
    position: absolute;

    right: 75px;
    top: 50%;

    width: 125px;
    height: 90px;

    transform: translateY(-48%);
}

.folder {
    position: absolute;

    width: 100px;
    height: 67px;

    border:
        1px solid
        rgba(255,255,255,.65);

    border-radius: 9px;

    background:
        linear-gradient(
            145deg,
            rgba(255,236,214,.95),
            rgba(228,168,116,.72)
        );

    box-shadow:
        inset 5px 5px 13px rgba(255,255,255,.45),
        0 15px 30px rgba(150,100,65,.10);

    transition:
        transform .4s cubic-bezier(.16,1,.3,1);
}

.folder:before {
    content: "";

    position: absolute;

    left: 0;
    top: -12px;

    width: 42px;
    height: 18px;

    border-radius:
        8px 8px 0 0;

    background:
        rgba(247,215,183,.95);
}

.folderBack {
    right: 3px;
    top: 3px;

    opacity: .45;

    transform:
        translate(-20px,-13px)
        scale(.84);
}

.folderMiddle {
    right: 2px;
    top: 12px;

    opacity: .70;

    transform:
        translate(-10px,-6px)
        scale(.92);
}

.folderFront {
    right: 0;
    bottom: 0;
}

.organizeCard:hover .folderFront {
    transform:
        translate(5px,-3px)
        rotate(2deg);
}

.organizeCard:hover .folderMiddle {
    transform:
        translate(-12px,-9px)
        scale(.92)
        rotate(-2deg);
}

.organizeCard:hover .folderBack {
    transform:
        translate(-25px,-17px)
        scale(.84)
        rotate(-4deg);
}

/* =====================================================
   ANALYZE
===================================================== */

.analyzeCard {
    background:
        radial-gradient(
            circle at 75% 55%,
            rgba(103,122,255,.12),
            transparent 35%
        ),
        linear-gradient(
            145deg,
            rgba(255,255,255,.78),
            rgba(248,248,255,.48)
        );
}

.bars {
    position: absolute;

    right: 77px;
    bottom: 34px;

    width: 135px;
    height: 110px;

    display: flex;
    align-items: flex-end;

    gap: 9px;
}

.bars span {
    flex: 1;

    border-radius:
        8px 8px 3px 3px;

    background:
        linear-gradient(
            180deg,
            #C8CEFF,
            #7588FF
        );

    box-shadow:
        inset 4px 4px 8px rgba(255,255,255,.42),
        0 13px 20px rgba(86,104,230,.12);

    transform-origin: bottom;

    transition:
        transform .4s cubic-bezier(.16,1,.3,1);
}

.analyzeCard:hover .bars span:nth-child(1) {
    transform:
        scaleY(1.08)
        rotate(-2deg);
}

.analyzeCard:hover .bars span:nth-child(2) {
    transform:
        scaleY(.93)
        rotate(1deg);
}

.analyzeCard:hover .bars span:nth-child(3) {
    transform:
        scaleY(1.10)
        rotate(-1deg);
}

.analyzeCard:hover .bars span:nth-child(4) {
    transform:
        scaleY(1.04)
        rotate(2deg);
}

/* =====================================================
   GROW
===================================================== */

.growCard {
    background:
        radial-gradient(
            circle at 77% 60%,
            rgba(255,174,102,.14),
            transparent 37%
        ),
        linear-gradient(
            145deg,
            rgba(255,255,255,.80),
            rgba(255,249,244,.50)
        );
}

.growGlow {
    position: absolute;

    right: 0;
    bottom: -50px;

    width: 250px;
    height: 170px;

    background:
        radial-gradient(
            circle,
            rgba(255,171,94,.17),
            transparent 68%
        );

    filter: blur(20px);
}

.growthArrow {
    position: absolute;

    right: 63px;
    bottom: 22px;

    width: 155px;

    color: #E6A264;

    filter:
        drop-shadow(
            0 11px 13px
            rgba(186,116,54,.12)
        );

    transition:
        transform .45s cubic-bezier(.16,1,.3,1);
}

.growCard:hover .growthArrow {
    transform:
        translate(8px,-8px)
        rotate(-3deg)
        scale(1.04);
}

/* =====================================================
   TABLET
===================================================== */

@container (max-width: 1050px) {

    .bentoShell {
        grid-template-columns: 1fr;

        padding: 26px;
    }

    .intro {
        padding: 10px 5px 12px;
    }

    .intro h1 {
        max-width: 580px;

        font-size: 50px;
    }

    .intro p {
        max-width: 480px;
    }

    .bentoGrid {
        height: 552px;
    }
}

/* =====================================================
   MOBILE
===================================================== */

@container (max-width: 650px) {

    .bentoRoot {
        padding: 8px;
    }

    .bentoShell {
        gap: 18px;

        padding: 18px;

        border-radius: 22px;
    }

    .intro h1 {
        font-size: 39px;
    }

    .intro p {
        font-size: 10px;
    }

    .bentoGrid {
        height: auto;

        display: flex;
        flex-direction: column;
    }

    .leftColumn,
    .rightColumn {
        height: auto;

        display: contents;
    }

    .featureCard {
        width: 100%;

        flex: none;

        padding: 18px;

        border-radius: 18px;
    }

    .createCard {
        height: 315px;

        order: 1;
    }

    .organizeCard {
        height: 150px;

        order: 2;
    }

    .analyzeCard {
        height: 185px;

        order: 3;
    }

    .collaborateCard {
        height: 165px;

        order: 4;
    }

    .growCard {
        height: 165px;

        order: 5;
    }

    .createContent {
        left: 18px;
        bottom: 22px;
    }

    .createContent h2 {
        font-size: 29px;
    }

    .fluid {
        width: 235px;
        height: 235px;

        right: -43px;
    }

    .cardContent {
        max-width: 54%;
    }

    .cardContent h2 {
        font-size: 19px;
    }

    .people {
        right: 54px;

        transform:
            translateY(-50%)
            scale(.8);
    }

    .folders {
        right: 52px;

        transform:
            translateY(-48%)
            scale(.8);
    }

    .bars {
        right: 52px;

        width: 105px;

        transform: scale(.85);
        transform-origin: bottom right;
    }

    .growthArrow {
        right: 48px;

        width: 120px;
    }

    /* Mobile'da kartların dönmesini biraz azaltıyoruz */

    .motion .createCard:hover,
    .motion .collaborateCard:hover,
    .motion .organizeCard:hover,
    .motion .analyzeCard:hover,
    .motion .growCard:hover {
        transform:
            translateY(-4px)
            rotate(-.35deg)
            scale(1.006);
    }
}

/* =====================================================
   SMALL MOBILE
===================================================== */

@container (max-width: 430px) {

    .bentoShell {
        padding: 14px;
    }

    .intro h1 {
        font-size: 34px;
    }

    .createCard {
        height: 285px;
    }

    .fluid {
        width: 205px;
        height: 205px;

        right: -55px;
    }

    .createContent {
        max-width: 58%;
    }

    .createContent h2 {
        font-size: 26px;
    }

    .featureCard:not(.createCard) .cardContent {
        max-width: 57%;
    }

    .featureCard:not(.createCard) .cardContent h2 {
        font-size: 17px;
    }

    .people,
    .folders {
        right: 36px;
    }

    .bars {
        right: 35px;
        width: 95px;
    }

    .growthArrow {
        right: 32px;
        width: 105px;
    }
}

/* =====================================================
   REDUCED MOTION
===================================================== */

@media (prefers-reduced-motion: reduce) {

    .bentoRoot *,
    .bentoRoot *:before,
    .bentoRoot *:after {
        transition: none !important;
        animation: none !important;
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

function ArrowRight() {
    return (
        <svg {...iconProps(15)}>
            <path d="M5 12h14M14 7l5 5-5 5" />
        </svg>
    )
}

function Sparkle() {
    return (
        <svg {...iconProps(18)}>
            <path d="M12 2.5c.7 5.3 3.7 8.3 9 9-5.3.7-8.3 3.7-9 9-.7-5.3-3.7-8.3-9-9 5.3-.7 8.3-3.7 9-9Z" />
        </svg>
    )
}

function ChartIcon() {
    return (
        <svg {...iconProps(18)}>
            <path d="M5 19V11M10 19V6M15 19v-9M20 19V4" />
        </svg>
    )
}

function Document() {
    return (
        <svg {...iconProps(17)}>
            <path d="M6 3h8l4 4v14H6Z" />
            <path d="M14 3v5h4M9 12h6M9 16h5" />
        </svg>
    )
}

/* =========================================================
   FRAMER CONTROLS
========================================================= */

addPropertyControls(InteractiveBentoFeatures, {
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#5F72FF",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F3EFE9",
    },

    text: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#171717",
    },

    motion: {
        type: ControlType.Boolean,
        title: "Motion",
        defaultValue: true,
    },
})
