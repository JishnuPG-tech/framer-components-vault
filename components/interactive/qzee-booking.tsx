// Get Started: https://www.framer.com/developers

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


type HeightMode = "auto" | "fixed"

export type QZeeBookingProps = {
    bookingUrl?: string
    heightMode?: HeightMode
    height?: number
    minHeight?: number
    allowScroll?: boolean
    borderRadius?: number
    background?: string
}

function QZeeBooking(props: QZeeBookingProps) {
    const {
        bookingUrl,
        heightMode = "fixed",
        height = 700,
        minHeight = 500,
        allowScroll = true,
        borderRadius = 8,
        background = "transparent",
    } = props

    const iframeRef = React.useRef<HTMLIFrameElement | null>(null)
    const [autoHeight, setAutoHeight] = React.useState<number>(minHeight)

    // Auto-height via postMessage from QZee widget (optional on widget side)
    React.useEffect(() => {
        if (heightMode !== "auto") return

        const onMessage = (event: MessageEvent) => {
            try {
                const data = (event as any).data
                if (
                    data &&
                    typeof data === "object" &&
                    (data.type === "QZEE_WIDGET_HEIGHT" ||
                        data.type === "IFRAME_CONTENT_HEIGHT") &&
                    typeof data.height === "number"
                ) {
                    setAutoHeight(Math.max(data.height, minHeight))
                }
            } catch {
                // ignore
            }
        }

        window.addEventListener("message", onMessage)
        return () => window.removeEventListener("message", onMessage)
    }, [heightMode, minHeight])

    const computedSrc = React.useMemo(() => {
        if (!bookingUrl) return undefined
        try {
            const url = new URL(bookingUrl)
            // Attribution for installs from Framer
            if (!url.searchParams.has("utm_source")) {
                url.searchParams.set("utm_source", "framer")
            }
            return url.toString()
        } catch {
            return bookingUrl // fallback if pasted string isn't a strict URL
        }
    }, [bookingUrl])

    if (!computedSrc) {
        return (
            <div
                style={{
                    width: "100%",
                    height: heightMode === "fixed" ? height : minHeight,
                    minHeight,
                    borderRadius,
                    background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    border: "1px dashed #D1D5DB",
                    fontSize: 14,
                    textAlign: "center",
                    padding: 16,
                    boxSizing: "border-box",
                }}
            >
                Paste your QZee booking URL in the right panel to render the
                widget.
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: heightMode === "fixed" ? height : autoHeight,
                minHeight,
                position: "relative",
                borderRadius,
                overflow: "hidden",
                background,
            }}
        >
            <iframe
                ref={iframeRef}
                src={computedSrc}
                title="QZee Booking"
                loading="lazy"
                referrerPolicy="no-referrer"
                style={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    overflow: allowScroll ? "auto" : "hidden",
                    background: "transparent",
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                allow="clipboard-read; clipboard-write"
            />
        </div>
    )
}

QZeeBooking.displayName = "QZeeBooking"

addPropertyControls(QZeeBooking, {
    bookingUrl: {
        type: ControlType.String,
        title: "Booking URL",
        placeholder: "https://bookings.qzee.app/v/...",
    },
    heightMode: {
        type: ControlType.SegmentedEnum,
        title: "Height",
        options: ["fixed", "auto"],
        optionTitles: ["Fixed", "Auto"],
        defaultValue: "fixed",
    },
    height: {
        type: ControlType.Number,
        title: "Fixed Height",
        defaultValue: 700,
        min: 200,
        max: 2000,
        displayStepper: true,
        hidden: (p: QZeeBookingProps) => p.heightMode !== "fixed",
    },
    minHeight: {
        type: ControlType.Number,
        title: "Min Height",
        defaultValue: 500,
        min: 200,
        max: 2000,
        displayStepper: true,
    },
    allowScroll: {
        type: ControlType.Boolean,
        title: "Scroll",
        defaultValue: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 48,
        displayStepper: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
})

export default QZeeBooking
