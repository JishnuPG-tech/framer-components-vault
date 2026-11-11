// Editable text component that allows live editing on double-click with hover indication
import {
    useState,
    useRef,
    useEffect,
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


interface EditableTextProps {
    text: string
    font: any
    color: string
    backgroundColor: string
    padding: number
    borderRadius: number
    hoverBorderColor: string
    cursorColor: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function EditableText(props: EditableTextProps) {
    const {
        text,
        font,
        color,
        backgroundColor,
        padding,
        borderRadius,
        hoverBorderColor,
        cursorColor,
    } = props

    const [isEditing, setIsEditing] = useState(false)
    const [currentText, setCurrentText] = useState(text)
    const [isHovered, setIsHovered] = useState(false)
    const [preservedDimensions, setPreservedDimensions] = useState<{
        width: number
        height: number
    } | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const cursorPositionRef = useRef<{ start: number; end: number } | null>(
        null
    )

    // Update current text when prop changes
    useEffect(() => {
        setCurrentText(text)
    }, [text])

    // Focus and select text when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.select()
        }
    }, [isEditing])

    // Restore cursor position after text change
    useEffect(() => {
        if (isEditing && textareaRef.current && cursorPositionRef.current) {
            const { start, end } = cursorPositionRef.current
            textareaRef.current.setSelectionRange(start, end)
            cursorPositionRef.current = null
        }
    }, [currentText, isEditing])

    const handleDoubleClick = () => {
        if (RenderTarget.current() === RenderTarget.preview) {
            // Capture current dimensions before entering edit mode
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setPreservedDimensions({
                    width: rect.width,
                    height: rect.height,
                })
            }
            startTransition(() => setIsEditing(true))
        }
    }

    const handleBlur = () => {
        startTransition(() => {
            setIsEditing(false)
            setPreservedDimensions(null)
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            startTransition(() => {
                setIsEditing(false)
                setPreservedDimensions(null)
            })
        }
        if (e.key === "Escape") {
            startTransition(() => {
                setCurrentText(text)
                setIsEditing(false)
                setPreservedDimensions(null)
            })
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Capture cursor position before state change
        if (textareaRef.current) {
            cursorPositionRef.current = {
                start: textareaRef.current.selectionStart,
                end: textareaRef.current.selectionEnd,
            }
        }
        startTransition(() => setCurrentText(e.target.value))
    }

    const handleMouseEnter = () => {
        if (RenderTarget.current() === RenderTarget.preview) {
            startTransition(() => setIsHovered(true))
        }
    }

    const handleMouseLeave = () => {
        startTransition(() => setIsHovered(false))
    }

    const isFixedWidth = props?.style && props.style.width === "100%"
    const isFixedHeight = props?.style && props.style.height === "100%"

    const containerStyle: CSSProperties = {
        ...props.style,
        position: "relative",
        width:
            isEditing && preservedDimensions
                ? preservedDimensions.width
                : isFixedWidth
                  ? "100%"
                  : "auto",
        height:
            isEditing && preservedDimensions
                ? preservedDimensions.height
                : isFixedHeight
                  ? "100%"
                  : "auto",
        minWidth: isFixedWidth ? "auto" : "max-content",
        minHeight: isFixedHeight ? "auto" : "max-content",
        backgroundColor,
        borderRadius,
        padding,
        border: isHovered
            ? `2px dashed ${hoverBorderColor}`
            : "2px solid transparent",
        cursor:
            RenderTarget.current() === RenderTarget.preview
                ? "text"
                : "default",
        transition: "border-color 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        boxSizing: "border-box",
    }

    const textStyle: CSSProperties = {
        ...font,
        color,
        margin: 0,
        padding: 0,
        background: "transparent",
        border: "none",
        outline: "none",
        resize: "none",
        width: "100%",
        height: "100%",
        minHeight: "1em",
        overflow: "hidden",
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
        boxSizing: "border-box",
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="textbox"
            aria-label="Editable text"
            tabIndex={0}
        >
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={currentText}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        ...textStyle,
                        resize: "none",
                        overflow: "hidden",
                        caretColor: cursorColor,
                    }}
                    rows={1}
                />
            ) : (
                <div
                    style={{
                        ...textStyle,
                        cursor: "inherit",
                        userSelect: "text",
                    }}
                >
                    {currentText || "Double-click to edit"}
                </div>
            )}
        </div>
    )
}

addPropertyControls(EditableText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Double-click to edit this text",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.4em",
            textAlign: "left",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "#0099FF",
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#000000",
        description:
            "More components by [Sarib Khan](https://www.framer.com/marketplace/components/tab-away-message/)",
    },
})
