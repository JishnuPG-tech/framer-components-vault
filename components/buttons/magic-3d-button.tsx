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


interface Props {
    text: string
    successText: string
    width: number
    height: number
    textColor: string

    primary100: string
    primary200: string
    primary300: string
    primary400: string
    primary500: string

    shadowColor: string

    radius: number
    fontSize: number
    fontFamily: string
}

export default function LiquidMagicButton(props: Props) {
    const {
        text,
        successText,
        width,
        height,
        textColor,

        primary100,
        primary200,
        primary300,
        primary400,
        primary500,

        shadowColor,

        radius,
        fontSize,
        fontFamily,
    } = props

    const [isClicked, setIsClicked] = React.useState(false)

    // Optimize string split calculation to run only when text values change
    const currentText = isClicked ? successText : text
    const splitText = React.useMemo(() => currentText.split(""), [currentText])

    return (
        <>
            <style>{`
                .liquid-btn {
                    --white: ${textColor};

                    --purple-100: ${primary100};
                    --purple-200: ${primary200};
                    --purple-300: ${primary300};
                    --purple-400: ${primary400};
                    --purple-500: ${primary500};

                    --shadow: ${shadowColor};
                    --radius: ${radius}px;

                    border-radius: var(--radius);
                    outline: none;
                    cursor: pointer;
                    font-size: ${fontSize}px;
                    font-family: ${fontFamily}, sans-serif;

                    background: transparent;
                    letter-spacing: -1px;
                    border: 0;

                    position: relative;
                    width: 100%;
                    height: 100%;

                    transform: rotate(353deg) skewX(4deg);
                    padding: 0;

                    appearance: none;
                    -webkit-appearance: none;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }

                .liquid-btn * {
                    box-sizing: border-box;
                }

                .liquid-btn .bg {
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    filter: blur(1px);
                }

                .liquid-btn .bg::before,
                .liquid-btn .bg::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: calc(var(--radius) * 1.1);
                    background: var(--purple-500);
                }

                .liquid-btn .bg::before {
                    filter: blur(5px);
                    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);

                    box-shadow:
                        -7px 6px 0 0 color-mix(in srgb, var(--shadow) 40%, transparent),
                        -14px 12px 0 0 color-mix(in srgb, var(--shadow) 30%, transparent),
                        -21px 18px 4px 0 color-mix(in srgb, var(--shadow) 25%, transparent),
                        -28px 24px 8px 0 color-mix(in srgb, var(--shadow) 15%, transparent),
                        -35px 30px 12px 0 color-mix(in srgb, var(--shadow) 12%, transparent),
                        -42px 36px 16px 0 color-mix(in srgb, var(--shadow) 8%, transparent),
                        -56px 42px 20px 0 color-mix(in srgb, var(--shadow) 5%, transparent);
                }

                .liquid-btn .wrap {
                    border-radius: inherit;
                    overflow: hidden;
                    height: 100%;
                    transform: translate(6px, -6px);
                    padding: 3px;

                    background: linear-gradient(
                        to bottom,
                        var(--purple-100) 0%,
                        var(--purple-400) 100%
                    );

                    position: relative;
                    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .liquid-btn .outline {
                    position: absolute;
                    overflow: hidden;
                    inset: 0;
                    opacity: 0;
                    border-radius: inherit;
                    transition: opacity 0.4s ease;
                }

                .liquid-btn .outline::before {
                    content: "";
                    position: absolute;
                    inset: 2px;
                    width: 120px;
                    height: 300px;
                    margin: auto;

                    background: linear-gradient(
                        to right,
                        transparent 0%,
                        white 50%,
                        transparent 100%
                    );

                    animation: spin 3s linear infinite;
                    animation-play-state: paused;
                }

                .liquid-btn .content {
                    pointer-events: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1;
                    position: relative;
                    height: 100%;
                    gap: 16px;
                    border-radius: calc(var(--radius) * 0.85);
                    font-weight: 600;
                    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);

                    background: linear-gradient(
                        to bottom,
                        var(--purple-300) 0%,
                        var(--purple-400) 100%
                    );

                    box-shadow:
                        inset -2px 12px 11px -5px var(--purple-200),
                        inset 1px -3px 11px 0px rgb(0 0 0 / 35%);
                }

                .liquid-btn .content::before {
                    content: "";
                    inset: 0;
                    position: absolute;
                    z-index: 10;
                    width: 80%;
                    top: 45%;
                    bottom: 35%;
                    opacity: 0.7;
                    margin: auto;

                    background: linear-gradient(
                        to bottom,
                        transparent,
                        var(--purple-400)
                    );
                    filter: brightness(1.3) blur(5px);
                }

                .liquid-btn .char {
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .liquid-btn .char span {
                    display: block;
                    color: transparent;
                    position: relative;
                    animation: charAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards calc(var(--i) * 0.03s);
                }

                .liquid-btn .char span::before,
                .liquid-btn .char span::after {
                    content: attr(data-label);
                    position: absolute;
                    color: var(--white);
                    text-shadow: -1px 1px 2px var(--purple-500);
                    left: 0;
                    transition: transform 0.4s ease, opacity 0.4s ease;
                }

                .liquid-btn .char span::before {
                    opacity: 0;
                    transform: translateY(100%);
                }

                .liquid-btn .char span::after {
                    opacity: 1;
                    transform: translateY(0);
                }

                .liquid-btn .icon {
                    z-index: 10;
                    transition: transform 0.4s cubic-bezier(0.7, -0.5, 0.3, 1.5), opacity 0.3s ease;
                }

                .liquid-btn .icon div,
                .liquid-btn .icon div::before,
                .liquid-btn .icon div::after {
                    height: 3px;
                    border-radius: 1px;
                    background-color: var(--white);
                }

                .liquid-btn .icon div {
                    position: relative;
                    width: 24px;
                    box-shadow: -2px 2px 5px var(--purple-400);
                    transform: scale(0.9);

                    background: linear-gradient(
                        to bottom,
                        var(--white),
                        var(--purple-100)
                    );

                    animation: swingArrow 1s ease-in-out infinite;
                    animation-play-state: paused;
                }

                .liquid-btn .icon div::before,
                .liquid-btn .icon div::after {
                    content: "";
                    position: absolute;
                    right: 0;
                    transform-origin: center right;
                    width: 14px;
                    border-radius: 15px;
                }

                .liquid-btn .icon div::before {
                    transform: rotate(44deg);
                    top: 1px;
                    box-shadow: 1px -2px 3px -1px var(--purple-400);
                    animation: rotateArrowLine 1s linear infinite;
                    animation-play-state: paused;
                }

                .liquid-btn .icon div::after {
                    bottom: 1px;
                    transform: rotate(316deg);
                    box-shadow: -2px 2px 3px 0 var(--purple-400);

                    background: linear-gradient(
                        200deg,
                        var(--white),
                        var(--purple-100)
                    );

                    animation: rotateArrowLine2 1s linear infinite;
                    animation-play-state: paused;
                }

                .liquid-btn .path {
                    position: absolute;
                    z-index: 12;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    stroke-dasharray: 150 480;
                    stroke-dashoffset: 150;
                    pointer-events: none;
                }

                .liquid-btn .splash {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    stroke-dasharray: 60 60;
                    stroke-dashoffset: 60;
                    transform: translate(-17%, -31%) scale(1.5);
                    stroke: var(--purple-300);
                }

                /* HOVER STATES */
                .liquid-btn:hover .wrap {
                    transform: translate(8px, -8px);
                }

                .liquid-btn:hover .outline {
                    opacity: 1;
                }

                .liquid-btn:hover .outline::before,
                .liquid-btn:hover .icon div,
                .liquid-btn:hover .icon div::before,
                .liquid-btn:hover .icon div::after {
                    animation-play-state: running;
                }

                /* CLICK STATE (Managed smoothly via React State instead of messy pseudo-focus) */
                .liquid-btn-clicked .path {
                    animation: path 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                .liquid-btn-clicked .icon {
                    animation: arrow 0.8s cubic-bezier(0.7, -0.5, 0.3, 1.5) forwards;
                }

                .liquid-btn-clicked .splash {
                    animation: splash 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
                }

                .liquid-btn:active .bg::before {
                    filter: blur(4px);
                    opacity: 0.8;
                    box-shadow:
                        -4px 4px 0 0 color-mix(in srgb, var(--shadow) 40%, transparent),
                        -8px 8px 0 0 color-mix(in srgb, var(--shadow) 25%, transparent);
                }

                /* KEYFRAMES */
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }

                @keyframes charAppear {
                    0% {
                        transform: translateY(40%);
                        opacity: 0;
                        filter: blur(8px);
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                        filter: blur(0);
                    }
                }

                @keyframes swingArrow {
                    50% { transform: translateX(4px) scale(0.9); }
                }

                @keyframes rotateArrowLine {
                    50% { transform: rotate(30deg); }
                    80% { transform: rotate(55deg); }
                }

                @keyframes rotateArrowLine2 {
                    50% { transform: rotate(330deg); }
                    80% { transform: rotate(300deg); }
                }

                @keyframes arrow {
                    0% { transform: translateX(0); opacity: 1; }
                    40% { transform: translateX(40px); opacity: 0; }
                    45% { transform: translateX(-100px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 0; }
                }

                @keyframes path {
                    from { stroke: white; stroke-dashoffset: 150; }
                    to { stroke-dashoffset: -480; stroke: #f9c6fe; }
                }

                @keyframes splash {
                    to {
                        stroke-dasharray: 2 60;
                        stroke-dashoffset: -60;
                    }
                }
            `}</style>

            <button
                className={`liquid-btn ${isClicked ? "liquid-btn-clicked" : ""}`}
                onClick={() => {
                    if (!isClicked) {
                        setIsClicked(true)
                        // Optional reset loop to make playing in Framer workspace interactive
                        setTimeout(() => setIsClicked(false), 3000)
                    }
                }}
                style={{
                    width: width || "100%",
                    height: height || "100%",
                }}
            >
                <div className="bg" />

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 342 208"
                    className="splash"
                    preserveAspectRatio="none"
                >
                    <path
                        strokeLinecap="round"
                        strokeWidth="4"
                        d="M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362"
                    />
                </svg>

                <div className="wrap">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 221 42"
                        className="path"
                        preserveAspectRatio="none"
                    >
                        <path
                            strokeLinecap="round"
                            strokeWidth="3"
                            d="M182.674 2H203C211.837 2 219 9.16344 219 18V24C219 32.8366 211.837 40 203 40H18C9.16345 40 2 32.8366 2 24V18C2 9.16344 9.16344 2 18 2H47.8855"
                        />
                    </svg>

                    <div className="outline" />

                    <div className="content">
                        <span className="char">
                            {splitText.map((char, index) => (
                                <span
                                    key={`${char}-${index}`}
                                    data-label={char}
                                    style={
                                        {
                                            ["--i" as any]: index + 1,
                                        } as React.CSSProperties
                                    }
                                >
                                    {char}
                                </span>
                            ))}
                        </span>

                        {!isClicked && (
                            <div className="icon">
                                <div />
                            </div>
                        )}
                    </div>
                </div>
            </button>
        </>
    )
}

LiquidMagicButton.defaultProps = {
    width: 220,
    height: 80,

    text: "JoinToday",
    successText: "ThankYou",

    textColor: "#FFE7FF",
    primary100: "#F4B1FD",
    primary200: "#D190FF",
    primary300: "#C389F2",
    primary400: "#8E26E2",
    primary500: "#5E2B83",
    shadowColor: "#734B9B",

    radius: 18,
    fontSize: 23,
    fontFamily: "Arial",
}

addPropertyControls(LiquidMagicButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "JoinToday",
    },
    successText: {
        type: ControlType.String,
        title: "Success Text",
        defaultValue: "ThankYou",
    },
    width: {
        type: ControlType.Number,
        title: "Width",
        min: 100,
        max: 500,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 40,
        max: 200,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
    },

    // Grouping colors cleanly in Framer UI Panel
    primary100: {
        type: ControlType.Color,
        title: "Color 100",
        group: "Color Palette",
    },
    primary200: {
        type: ControlType.Color,
        title: "Color 200",
        group: "Color Palette",
    },
    primary300: {
        type: ControlType.Color,
        title: "Color 300",
        group: "Color Palette",
    },
    primary400: {
        type: ControlType.Color,
        title: "Color 400",
        group: "Color Palette",
    },
    primary500: {
        type: ControlType.Color,
        title: "Color 500",
        group: "Color Palette",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        group: "Color Palette",
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 50,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 50,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
    },
})
