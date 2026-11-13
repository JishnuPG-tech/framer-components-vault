// Color visualizer with automatic color naming from API
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Global toast manager singleton
class ToastManager {
    private static instance: ToastManager
    private toasts: Array<{ id: string; message: string; timestamp: number; isExiting?: boolean }> = []
    private listeners: Array<(toasts: Array<{ id: string; message: string; timestamp: number; isExiting?: boolean }>) => void> = []
    private toastCounter = 0
    private containerMounted = false
    private lastToastTime = 0
    private debounceDelay = 300 // Prevent rapid clicking
    private maxToasts = 3 // Limit maximum toasts

    static getInstance(): ToastManager {
        if (!ToastManager.instance) {
            ToastManager.instance = new ToastManager()
        }
        return ToastManager.instance
    }

    addToast(message: string, duration: number = 2000) {
        const now = Date.now()
        
        // Debounce rapid clicks
        if (now - this.lastToastTime < this.debounceDelay) {
            return
        }
        this.lastToastTime = now
        
        // Remove oldest toast if we're at the limit
        if (this.toasts.length >= this.maxToasts) {
            const oldestToast = this.toasts[0]
            this.removeToast(oldestToast.id)
        }
        
        const id = `toast-${++this.toastCounter}-${Date.now()}`
        const toast = { id, message, timestamp: Date.now(), isExiting: false }
        
        this.toasts.push(toast)
        this.notifyListeners()
        
        setTimeout(() => {
            this.removeToast(id)
        }, duration)
    }

    removeToast(id: string) {
        // Mark toast as exiting first
        const toastIndex = this.toasts.findIndex(toast => toast.id === id)
        if (toastIndex !== -1) {
            this.toasts[toastIndex].isExiting = true
            this.notifyListeners()
            
            // Remove after animation completes
            setTimeout(() => {
                this.toasts = this.toasts.filter(toast => toast.id !== id)
                this.notifyListeners()
            }, 200)
        }
    }

    subscribe(listener: (toasts: Array<{ id: string; message: string; timestamp: number; isExiting?: boolean }>) => void) {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    setContainerMounted(mounted: boolean) {
        this.containerMounted = mounted
    }

    isContainerMounted() {
        return this.containerMounted
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener([...this.toasts]))
    }
}

// Global toast container component
function GlobalToastContainer({ 
    toastBackgroundColor, 
    toastTextColor, 
    toastFont 
}: { 
    toastBackgroundColor: string
    toastTextColor: string
    toastFont: CSSProperties 
}) {
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; timestamp: number; isExiting?: boolean }>>([])

    useEffect(() => {
        const toastManager = ToastManager.getInstance()
        toastManager.setContainerMounted(true)
        const unsubscribe = toastManager.subscribe(setToasts)
        
        return () => {
            toastManager.setContainerMounted(false)
            unsubscribe()
        }
    }, [])

    if (toasts.length === 0) return null

    return (
        <div
            style={{
                position: "fixed",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10000,
                display: "flex",
                flexDirection: "column-reverse",
                gap: "8px",
                pointerEvents: "none",
                padding: "0 16px",
            }}
        >
            {toasts.map((toast, index) => {
                const reverseIndex = toasts.length - 1 - index
                const offset = reverseIndex * 4
                const scale = Math.max(0.95, 1 - reverseIndex * 0.05)
                const opacity = Math.max(0.8, 1 - reverseIndex * 0.1)
                
                // Apply exit animation if toast is exiting
                const exitTransform = toast.isExiting ? 'translateY(100%) scale(0.8)' : `translateY(-${offset}px) scale(${scale})`
                const exitOpacity = toast.isExiting ? 0 : opacity
                
                return (
                    <div
                        key={toast.id}
                        style={{
                            backgroundColor: toastBackgroundColor,
                            color: toastTextColor,
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(8px)",
                            ...toastFont,
                            transform: exitTransform,
                            opacity: exitOpacity,
                            transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                            transformOrigin: "center bottom",
                            animation: index === toasts.length - 1 && !toast.isExiting ? "slideInUp 0.2s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
                            maxWidth: "100%",
                            wordBreak: "break-word",
                        }}
                    >
                        {toast.message}
                    </div>
                )
            })}
            <style>
                {`
                    @keyframes slideInUp {
                        from {
                            transform: translateY(100%) scale(0.95);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0) scale(1);
                            opacity: 1;
                        }
                    }
                `}
            </style>
        </div>
    )
}

interface ColorNamerProps {
    color: string
    displayMode: "name" | "code" | "shape"
    backgroundColor: string
    textColor: string
    font: CSSProperties
    borderRadius: number
    codeFormat: "hex" | "rgb"
    enableCopy: boolean
    hoverOpacity: number
    shapeCopyFormat: "hex" | "name" | "rgb"
    toastSettings: {
        showToast: boolean
        toastDuration: number
        toastBackgroundColor: string
        toastTextColor: string
        toastFont: CSSProperties
    }
    style?: CSSProperties
}

/**
 * Color Visualizer
 * 
 * Displays a color swatch with its automatically generated name from palettespro.com API
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AutoColorDisplay(props: ColorNamerProps) {
    const {
        color,
        displayMode,
        backgroundColor,
        textColor,
        font,
        borderRadius,
        codeFormat = "hex",
        enableCopy = false,
        hoverOpacity = 0.8,
        shapeCopyFormat = "hex",
        toastSettings = {
            showToast: true,
            toastDuration: 2000,
            toastBackgroundColor: "#000000",
            toastTextColor: "#FFFFFF",
            toastFont: {
                fontSize: "14px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            }
        },
    } = props

    const [colorName, setColorName] = useState<string>("Loading...")
    const [isLoading, setIsLoading] = useState(true)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") {
            startTransition(() => {
                setColorName("Color Name")
                setIsLoading(false)
            })
            return
        }

        const fetchColorName = async () => {
            startTransition(() => setIsLoading(true))
            
            try {
                // Convert color to hex format if it's in RGB
                let hexCode = color
                if (color.startsWith("rgb")) {
                    hexCode = rgbToHex(color)
                }
                
                // Remove # from hex code for API
                hexCode = hexCode.replace("#", "")
                
                console.log("Fetching color name for:", hexCode)
                
                const response = await fetch(
                    `https://www.thecolorapi.com/id?hex=${hexCode}`
                )
                
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`)
                }
                
                const data = await response.json()
                console.log("API Response:", data)
                
                // Extract name from thecolorapi.com response
                const name = data.name?.value || "Unknown Color"
                console.log("Extracted name:", name)
                
                startTransition(() => {
                    setColorName(name)
                    setIsLoading(false)
                })
            } catch (error) {
                console.error("Error fetching color name:", error)
                startTransition(() => {
                    setColorName("Error loading name")
                    setIsLoading(false)
                })
            }
        }

        fetchColorName()
    }, [color])

    const hexToRgb = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        if (!result) return "rgb(0, 0, 0)"
        
        const r = parseInt(result[1], 16)
        const g = parseInt(result[2], 16)
        const b = parseInt(result[3], 16)
        
        return `rgb(${r}, ${g}, ${b})`
    }

    const rgbToHex = (rgb: string): string => {
        const result = rgb.match(/\d+/g)
        if (!result || result.length < 3) return "#000000"
        
        const r = parseInt(result[0])
        const g = parseInt(result[1])
        const b = parseInt(result[2])
        
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16)
            return hex.length === 1 ? "0" + hex : hex
        }).join("").toUpperCase()
    }

    const getDisplayColor = () => {
        if (codeFormat === "hex") {
            // If color is already in HEX format, return it
            if (color.startsWith("#")) {
                return color.toUpperCase()
            }
            // If color is in RGB format, convert to HEX
            if (color.startsWith("rgb")) {
                return rgbToHex(color)
            }
            return color.toUpperCase()
        } else {
            // Convert to RGB
            if (color.startsWith("#")) {
                return hexToRgb(color)
            }
            // Already RGB
            return color
        }
    }

    const getHexValue = () => {
        if (color.startsWith("#")) {
            return color.toUpperCase()
        }
        if (color.startsWith("rgb")) {
            return rgbToHex(color)
        }
        return color.toUpperCase()
    }

    const getRgbValue = () => {
        if (color.startsWith("#")) {
            return hexToRgb(color)
        }
        return color
    }

    const getCopyValue = () => {
        if (displayMode === "name") {
            return colorName
        } else if (displayMode === "code") {
            return getDisplayColor()
        } else if (displayMode === "shape") {
            if (shapeCopyFormat === "hex") {
                return getHexValue()
            } else if (shapeCopyFormat === "rgb") {
                return getRgbValue()
            } else {
                return colorName
            }
        }
        return ""
    }

    const handleClick = async () => {
        if (!enableCopy || typeof window === "undefined") return
        
        try {
            const valueToCopy = getCopyValue()
            let copySuccess = false
            
            // Try modern clipboard API first (works in secure contexts)
            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(valueToCopy)
                    copySuccess = true
                } catch (clipboardError) {
                    console.warn("Clipboard API failed:", clipboardError)
                    copySuccess = false
                }
            }
            
            // Fallback method for non-secure contexts or when clipboard API fails
            if (!copySuccess) {
                try {
                    // Create a temporary textarea element
                    const textArea = document.createElement("textarea")
                    textArea.value = valueToCopy
                    
                    // Make it invisible but accessible
                    textArea.style.position = "fixed"
                    textArea.style.left = "-999999px"
                    textArea.style.top = "-999999px"
                    textArea.style.opacity = "0"
                    textArea.style.pointerEvents = "none"
                    textArea.setAttribute('readonly', '')
                    textArea.setAttribute('contenteditable', 'true')
                    
                    document.body.appendChild(textArea)
                    
                    // For iOS Safari
                    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
                        textArea.contentEditable = 'true'
                        textArea.readOnly = false
                        const range = document.createRange()
                        range.selectNodeContents(textArea)
                        const selection = window.getSelection()
                        selection?.removeAllRanges()
                        selection?.addRange(range)
                        textArea.setSelectionRange(0, 999999)
                    } else {
                        textArea.select()
                        textArea.setSelectionRange(0, 999999)
                    }
                    
                    // Try to copy using execCommand
                    const successful = document.execCommand('copy')
                    document.body.removeChild(textArea)
                    
                    if (successful) {
                        copySuccess = true
                    } else {
                        throw new Error("execCommand failed")
                    }
                } catch (fallbackError) {
                    console.error("Fallback copy method failed:", fallbackError)
                    copySuccess = false
                }
            }
            
            if (copySuccess) {
                console.log("Copied to clipboard:", valueToCopy)
                
                if (toastSettings.showToast) {
                    const toastManager = ToastManager.getInstance()
                    toastManager.addToast(`Copied: ${valueToCopy}`, toastSettings.toastDuration)
                }
            } else {
                throw new Error("All copy methods failed")
            }
            
        } catch (error) {
            console.error("Failed to copy to clipboard:", error)
            
            // Show error toast if enabled
            if (toastSettings.showToast) {
                const toastManager = ToastManager.getInstance()
                toastManager.addToast("Failed to copy", toastSettings.toastDuration)
            }
        }
    }

    const isFixedWidth = props?.style && props.style.width === "100%"
    const isFixedHeight = props?.style && props.style.height === "100%"

    // Only render toast container if showToast is enabled and no container is already mounted
    const shouldRenderToastContainer = toastSettings.showToast && typeof window !== "undefined" && !ToastManager.getInstance().isContainerMounted()

    return (
        <>
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    backgroundColor: "transparent",
                    overflow: "hidden",
                    ...(isFixedWidth ? {} : { minWidth: "max-content" }),
                    ...(isFixedHeight ? {} : { minHeight: "max-content" }),
                    cursor: enableCopy ? "pointer" : "default",
                    opacity: isHovered && enableCopy ? hoverOpacity : 1,
                    transition: "opacity 0.2s ease",
                }}
                onClick={handleClick}
                onMouseEnter={() => enableCopy && setIsHovered(true)}
                onMouseLeave={() => enableCopy && setIsHovered(false)}
            >
                {displayMode === "shape" && (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: color,
                            borderRadius,
                        }}
                        aria-label={`Color swatch: ${color}`}
                    />
                )}
                
                {displayMode === "name" && (
                    <div
                        style={{
                            ...font,
                            color: textColor,
                            opacity: isLoading ? 0.5 : 1,
                        }}
                    >
                        {colorName}
                    </div>
                )}
                
                {displayMode === "code" && (
                    <div
                        style={{
                            ...font,
                            color: textColor,
                        }}
                    >
                        {getDisplayColor()}
                    </div>
                )}
            </div>

            {/* Global Toast Container - only render once per page */}
            {shouldRenderToastContainer && (
                <GlobalToastContainer 
                    toastBackgroundColor={toastSettings.toastBackgroundColor}
                    toastTextColor={toastSettings.toastTextColor}
                    toastFont={toastSettings.toastFont}
                />
            )}
        </>
    )
}

addPropertyControls(AutoColorDisplay, {
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FF5588",
    },
    displayMode: {
        type: ControlType.Enum,
        title: "Display Mode",
        options: ["name", "code", "shape"],
        optionTitles: ["Text", "Code", "Color"],
        defaultValue: "name",
        displaySegmentedControl: true,
    },
    codeFormat: {
        type: ControlType.Enum,
        title: "Code Format",
        options: ["hex", "rgb"],
        optionTitles: ["HEX", "RGB"],
        defaultValue: "hex",
        displaySegmentedControl: true,
        hidden: ({ displayMode }) => displayMode !== "code",
    },
    enableCopy: {
        type: ControlType.Boolean,
        title: "Copy on Click",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverOpacity: {
        type: ControlType.Number,
        title: "Hover Opacity",
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.1,
        hidden: ({ enableCopy }) => !enableCopy,
    },
    shapeCopyFormat: {
        type: ControlType.Enum,
        title: "Copy Format",
        options: ["hex", "name", "rgb"],
        optionTitles: ["HEX", "Name", "RGB"],
        defaultValue: "hex",
        displaySegmentedControl: true,
        hidden: ({ displayMode, enableCopy }) => displayMode !== "shape" || !enableCopy,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        hidden: ({ displayMode }) => displayMode === "shape",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        hidden: ({ displayMode }) => displayMode === "shape",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        hidden: ({ displayMode }) => displayMode !== "shape",
    },
    toastSettings: {
        type: ControlType.Object,
        title: "Toast Settings",
        description: "Explore [more components](https://dub.sh/Explore-more).\n\nMade by [Till Janek](https://dub.sh/made-by-tilljanek).",
        controls: {
            showToast: {
                type: ControlType.Boolean,
                title: "Show Toast",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            toastDuration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 2000,
                min: 500,
                max: 5000,
                step: 100,
                unit: "ms",
            },
            toastBackgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
            },
            toastTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
            },
            toastFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
        },
        hidden: ({ enableCopy }) => !enableCopy,
    },
})