// Convert HTML/CSS card animation to Framer component with hover interactions
import { useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TransactionCardProps {
    text: string
    backgroundColor: string
    leftSideColor: string
    textColor: string
    arrowColor: string
    cardColor: string
    cardLineColor: string
    buttonColor: string
    postColor: string
    screenColor: string
    dollarColor: string
    font: CSSProperties
    style?: CSSProperties
}

/**
 * New Transaction Card
 * 
 * @framerIntrinsicWidth 460
 * @framerIntrinsicHeight 120
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TransactionCard(props: TransactionCardProps) {
    const {
        text,
        backgroundColor,
        leftSideColor,
        textColor,
        arrowColor,
        cardColor,
        cardLineColor,
        buttonColor,
        postColor,
        screenColor,
        dollarColor,
        font,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()

    const containerStyle: CSSProperties = {
        backgroundColor,
        display: "flex",
        width: isHovered && !isStatic ? "220px" : "460px",
        height: "120px",
        position: "relative",
        borderRadius: "6px",
        transition: isStatic ? "none" : "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered && !isStatic ? "scale(1.03)" : "scale(1)",
        overflow: "hidden",
    }

    const leftSideStyle: CSSProperties = {
        backgroundColor: leftSideColor,
        width: isHovered && !isStatic ? "100%" : "130px",
        height: "120px",
        borderRadius: "4px",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        transition: isStatic ? "none" : "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        flexShrink: 0,
        overflow: "hidden",
    }

    const rightSideStyle: CSSProperties = {
        width: "calc(100% - 130px)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        cursor: "pointer",
        justifyContent: "space-between",
        whiteSpace: "nowrap",
        transition: isStatic ? "none" : "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: isHovered && !isStatic ? "#f9f7f9" : "transparent",
        pointerEvents: isHovered && !isStatic ? "none" : "auto",
    }

    const cardStyle: CSSProperties = {
        width: "70px",
        height: "46px",
        backgroundColor: cardColor,
        borderRadius: "6px",
        position: "absolute",
        display: "flex",
        zIndex: 10,
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "9px 9px 9px -2px rgba(77, 200, 143, 0.72)",
        animation: isHovered && !isStatic ? "slideTop 1s cubic-bezier(0.4, 0, 0.2, 1) both" : "none",
    }

    const cardLineStyle: CSSProperties = {
        width: "65px",
        height: "13px",
        backgroundColor: cardLineColor,
        borderRadius: "2px",
        marginTop: "7px",
    }

    const buttonsStyle: CSSProperties = {
        width: "8px",
        height: "8px",
        backgroundColor: buttonColor,
        boxShadow: `0 -10px 0 0 #26850e, 0 10px 0 0 #56be3e`,
        borderRadius: "50%",
        marginTop: "5px",
        transform: "rotate(90deg)",
        margin: "10px 0 0 -30px",
    }

    const postStyle: CSSProperties = {
        width: "63px",
        height: "75px",
        backgroundColor: postColor,
        position: "absolute",
        zIndex: 11,
        bottom: "10px",
        top: "120px",
        borderRadius: "6px",
        overflow: "hidden",
        animation: isHovered && !isStatic ? "slidePost 1s cubic-bezier(0.4, 0, 0.2, 1) both" : "none",
    }

    const postLineStyle: CSSProperties = {
        width: "47px",
        height: "9px",
        backgroundColor: "#545354",
        position: "absolute",
        borderRadius: "0px 0px 3px 3px",
        right: "8px",
        top: "8px",
    }

    const postLineBeforeStyle: CSSProperties = {
        content: '""',
        position: "absolute",
        width: "47px",
        height: "9px",
        backgroundColor: "#757375",
        top: "-8px",
    }

    const screenStyle: CSSProperties = {
        width: "47px",
        height: "23px",
        backgroundColor: screenColor,
        position: "absolute",
        top: "22px",
        right: "8px",
        borderRadius: "3px",
    }

    const numbersStyle: CSSProperties = {
        width: "12px",
        height: "12px",
        backgroundColor: "#838183",
        boxShadow: "0 -18px 0 0 #838183, 0 18px 0 0 #838183",
        borderRadius: "2px",
        position: "absolute",
        transform: "rotate(90deg)",
        left: "25px",
        top: "52px",
    }

    const numbersLine2Style: CSSProperties = {
        width: "12px",
        height: "12px",
        backgroundColor: "#aaa9ab",
        boxShadow: "0 -18px 0 0 #aaa9ab, 0 18px 0 0 #aaa9ab",
        borderRadius: "2px",
        position: "absolute",
        transform: "rotate(90deg)",
        left: "25px",
        top: "68px",
    }

    const dollarStyle: CSSProperties = {
        position: "absolute",
        fontSize: "16px",
        width: "100%",
        left: 0,
        top: 0,
        color: dollarColor,
        textAlign: "center",
        animation: isHovered && !isStatic ? "fadeInFwd 0.4s 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards" : "none",
    }

    return (
        <>
            <style>
                {`
                    @keyframes slideTop {
                        0% {
                            transform: translateY(0) rotate(0deg);
                        }
                        40% {
                            transform: translateY(-70px) rotate(45deg);
                        }
                        70% {
                            transform: translateY(-70px) rotate(90deg);
                        }
                        100% {
                            transform: translateY(-8px) rotate(90deg);
                        }
                    }
                    @keyframes slidePost {
                        0% {
                            transform: translateY(0);
                        }
                        30% {
                            transform: translateY(0);
                        }
                        100% {
                            transform: translateY(-70px);
                        }
                    }
                    @keyframes fadeInFwd {
                        0% {
                            opacity: 0;
                            transform: translateY(-5px);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>
            <div
                style={containerStyle}
                onMouseEnter={isStatic ? undefined : () => setIsHovered(true)}
                onMouseLeave={isStatic ? undefined : () => setIsHovered(false)}
            >
                <div style={leftSideStyle}>
                    <div style={cardStyle}>
                        <div style={cardLineStyle} />
                        <div style={buttonsStyle} />
                    </div>
                    <div style={postStyle}>
                        <div style={postLineStyle}>
                            <div style={postLineBeforeStyle} />
                        </div>
                        <div style={screenStyle}>
                            <div style={dollarStyle}>$</div>
                        </div>
                        <div style={numbersStyle} />
                        <div style={numbersLine2Style} />
                    </div>
                </div>
                <div style={rightSideStyle}>
                    <div
                        style={{
                            fontSize: "23px",
                            marginLeft: "20px",
                            color: textColor,
                            ...font,
                        }}
                    >
                        {text}
                    </div>
                    <svg
                        viewBox="0 0 451.846 451.847"
                        height="20"
                        width="20"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginRight: "20px" }}
                    >
                        <path
                            fill={arrowColor}
                            d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"
                        />
                    </svg>
                </div>
            </div>
        </>
    )
}

addPropertyControls(TransactionCard, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "New Transaction",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    leftSideColor: {
        type: ControlType.Color,
        title: "Left Side",
        defaultValue: "#5de2a3",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#cfcfcf",
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card Color",
        defaultValue: "#c7ffbc",
    },
    cardLineColor: {
        type: ControlType.Color,
        title: "Card Line",
        defaultValue: "#80ea69",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#379e1f",
    },
    postColor: {
        type: ControlType.Color,
        title: "Post Color",
        defaultValue: "#dddde0",
    },
    screenColor: {
        type: ControlType.Color,
        title: "Screen Color",
        defaultValue: "#FFFFFF",
    },
    dollarColor: {
        type: ControlType.Color,
        title: "Dollar Color",
        defaultValue: "#4b953b",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "23px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})