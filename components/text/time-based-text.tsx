import {
    useState,
    useEffect,
    useMemo,
    startTransition,
    type CSSProperties,
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


type TimeWindow = { start: string; end: string; text: string }

interface TimeBasedTextProps {
    windows: TimeWindow[]
    defaultText: string
    font: any
    textColor: string
    backgroundColor: string
    padding: number
    borderRadius: number
    textAlign: "left" | "center" | "right"
    style?: CSSProperties
}

export default function TimeBasedText(props: TimeBasedTextProps) {
    const {
        windows = [
            { start: "06:00", end: "11:00", text: "Good Morning!" },
            { start: "18:00", end: "22:00", text: "Good Evening!" },
            { start: "22:00", end: "06:00", text: "Good Night!" },
        ],
        defaultText = "Hello!",
        font,
        textColor = "#000000",
        backgroundColor = "#FFFFFF",
        padding = 16,
        borderRadius = 8,
        textAlign = "left",
    } = props

    const isStatic = useIsStaticRenderer()

    const parseHHMM = (str: string) => {
        const [h, m] = (str ?? "").split(":").map(Number)
        if (Number.isNaN(h) || Number.isNaN(m)) return NaN
        return (h * 60 + m) % (24 * 60)
    }

    const nowMinutes = () => {
        const d = new Date()
        return (d.getHours() * 60 + d.getMinutes()) % (24 * 60)
    }

    const isInWindow = (now: number, start: number, end: number) =>
        Number.isNaN(start) || Number.isNaN(end)
            ? false
            : start <= end
              ? now >= start && now < end
              : now >= start || now < end

    const picker = useMemo(() => {
        const parsed = (windows ?? []).map((w) => ({
            start: parseHHMM(w.start),
            end: parseHHMM(w.end),
            text: w.text ?? "",
        }))
        return (now: number) => {
            for (const w of parsed)
                if (isInWindow(now, w.start, w.end)) return w.text
            return defaultText
        }
    }, [windows, defaultText])

    // 1) Statisches Rendering: ohne State berechnen (reagiert sofort auf Prop-Änderungen)
    const staticText = useMemo(() => picker(nowMinutes()), [picker])

    // 2) Dynamisch (Preview/Live): minütlich aktualisieren
    const [currentText, setCurrentText] = useState(staticText)
    useEffect(() => {
        if (isStatic) return
        const update = () => {
            const txt = picker(nowMinutes())
            startTransition(() => setCurrentText(txt))
        }
        update()
        const msToNextMinute = () => {
            const d = new Date()
            return (60 - d.getSeconds()) * 1000 - d.getMilliseconds()
        }
        const to = window.setTimeout(() => {
            update()
            const iv = window.setInterval(update, 60000)
            cleanup.iv = iv
        }, msToNextMinute())
        const cleanup: { iv?: number } = {}
        return () => {
            window.clearTimeout(to)
            if (cleanup.iv) window.clearInterval(cleanup.iv)
        }
    }, [picker, isStatic])

    const isFixedWidth = props?.style && props.style.width === "100%"
    const displayText = isStatic ? staticText : currentText

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                backgroundColor,
                color: textColor,
                padding: `${padding}px`,
                borderRadius: `${borderRadius}px`,
                ...(isFixedWidth ? {} : { minWidth: "max-content" }),
                ...font,
                textAlign,
            }}
            aria-live="polite"
        >
            {displayText}
        </div>
    )
}

addPropertyControls(TimeBasedText, {
    windows: {
        type: ControlType.Array,
        title: "Time Windows",
        control: {
            type: ControlType.Object,
            controls: {
                start: {
                    type: ControlType.String,
                    title: "Start",
                    defaultValue: "06:00",
                    placeholder: "HH:MM",
                },
                end: {
                    type: ControlType.String,
                    title: "End",
                    defaultValue: "11:00",
                    placeholder: "HH:MM",
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Good Morning!",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            { start: "06:00", end: "11:00", text: "Good Morning!" },
            { start: "18:00", end: "22:00", text: "Good Evening!" },
            { start: "22:00", end: "06:00", text: "Good Night!" },
        ],
        description: "Add as many time windows as you want.",
    },
    defaultText: {
        type: ControlType.String,
        title: "Default Text",
        defaultValue: "Hello!",
        displayTextArea: true,
        description: "Shown when no time window is active.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 128,
        step: 1,
        unit: "px",
        description: "An out of storage component.",
    },
})
