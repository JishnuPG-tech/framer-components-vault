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
 *
 * @framerDisableUnlink
 */

export default function Typewritercustom(props) {
    const [text, setText] = React.useState("")
    const [index, setIndex] = React.useState(0)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [delta, setDelta] = React.useState(props.typingSpeed)

    const {
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacing,
        lineHeight,
    } = props.font

    const content = props.mode === "single" ? [props.singleText] : props.strings

    React.useEffect(() => {
        let ticker = setInterval(() => {
            tick()
        }, delta)

        return () => {
            clearInterval(ticker)
        }
    }, [text, delta, index, isDeleting, content, props.loop])

    const tick = () => {
        if (!content || content.length === 0) return

        const cycleIndex = index % content.length
        let fullText = content[cycleIndex]

        let updatedText = isDeleting
            ? fullText.substring(0, text.length - 1)
            : fullText.substring(0, text.length + 1)

        setText(updatedText)

        if (isDeleting) {
            setDelta(props.deletingSpeed)
        } else {
            setDelta(props.typingSpeed)
        }

        if (!isDeleting && updatedText === fullText) {
            const isLastString = cycleIndex === content.length - 1

            if (!props.loop && isLastString) {
                setDelta(props.pauseTime * 1000)
            } else {
                setDelta(props.pauseTime * 1000)
                setIsDeleting(true)
            }
        } else if (isDeleting && updatedText === "") {
            setIsDeleting(false)
            setIndex(index + 1)
            setDelta(props.typingSpeed)
        }
    }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: props.alignment,
                width: "100%",
                height: "100%",
                fontFamily: fontFamily,
                fontSize: fontSize,
                // Шинэ Font Color тохиргоог ашиглаж байна
                color: props.fontColor,
                fontWeight: fontWeight,
                fontStyle: fontStyle,
                letterSpacing: letterSpacing,
                lineHeight: lineHeight,
            }}
        >
            <span>
                {text}
                <span
                    style={{
                        borderRight: `3px solid ${props.cursorColor}`,
                        marginLeft: 2,
                        opacity: 1,
                        animation: "blink 1s step-end infinite",
                    }}
                >
                    &nbsp;
                </span>
            </span>
            <style>{`
                @keyframes blink {
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    )
}

Typewritercustom.defaultProps = {
    mode: "multi",
    singleText: "Hello Framer",
    strings: ["Design", "Code", "Publish"],
    typingSpeed: 100,
    deletingSpeed: 50,
    pauseTime: 1.5,
    cursorColor: "#0099FF",
    // Шинэ defaultProp нэмэв
    fontColor: "#000000",
    alignment: "center",
    loop: true,
    font: {
        fontFamily: "Inter",
        fontWeight: "700",
        fontSize: 40,
        fontStyle: "normal",
        letterSpacing: 0,
        lineHeight: 1.2,
        // Color-ийг fontColor-оор орлуулахын тулд эндхийн өнгийг үлдээж болно
        color: "#000",
    },
}

addPropertyControls(Typewritercustom, {
    mode: {
        type: ControlType.SegmentedEnum,
        title: "Mode",
        options: ["single", "multi"],
        optionTitles: ["Single", "Multi"],
        defaultValue: "multi",
    },
    singleText: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hello Framer",
        hidden: (props) => props.mode === "multi",
    },
    strings: {
        type: ControlType.Array,
        control: { type: ControlType.String },
        title: "Texts",
        defaultValue: ["Design", "Code", "Publish"],
        hidden: (props) => props.mode === "single",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        title: "Font Styles",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: "700",
            fontSize: 40,
            fontStyle: "normal",
            letterSpacing: 0,
            lineHeight: 1.2,
            color: "#000",
        },
    },
    // Шинээр нэмэгдсэн Font Color хяналт
    fontColor: {
        type: ControlType.Color,
        title: "Font Color",
        defaultValue: "#000000",
    },
    typingSpeed: {
        type: ControlType.Number,
        title: "Type Speed (ms)",
        min: 10,
        max: 1000,
        step: 10,
        defaultValue: 100,
        displayStepper: true,
    },
    deletingSpeed: {
        type: ControlType.Number,
        title: "Delete Speed (ms)",
        min: 10,
        max: 1000,
        step: 10,
        defaultValue: 50,
        displayStepper: true,
    },
    pauseTime: {
        type: ControlType.Number,
        title: "Hold (sec)",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 1.5,
        displayStepper: true,
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#0099FF",
    },
    alignment: {
        type: ControlType.SegmentedEnum,
        title: "Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
