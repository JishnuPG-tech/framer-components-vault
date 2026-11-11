/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
import {
    useState,
    useCallback,
    useEffect,
    useState as useReactState,
} from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function PasswordProtectedScreen(props) {
    const isFramerEditor = () => {
        if (typeof window === "undefined") return false
        if (window.FramerDesignTimeModeEnabled !== undefined) return true
        if (
            window.Framer &&
            window.Framer.CurrentContext &&
            window.Framer.CurrentContext.isDesignTime
        )
            return true
        if (
            window.document &&
            window.document.documentElement.hasAttribute(
                "data-framer-preview-mode"
            )
        )
            return false
        const url = window.location.href
        return (
            url.includes("framer.com") &&
            (url.includes("/editor") ||
                url.includes("/projects") ||
                !url.includes("/preview"))
        )
    }

    if (isFramerEditor()) return null

    const {
        password,
        titleText = "Enter password to view case study",
        titleColor = "#3D3733",
        titleFont,
        bodyFont,
        overlayType = "color",
        overlayColor = "#FCFBF7",
        overlayImage,
        inputBackground = "#E5E3DE",
        inputTextColor = "#5F5956",
        inputPlaceholder = "Password",
        buttonBackground = "#E06B41",
        buttonTextColor = "#ffffff",
        buttonText = "Submit",
        errorTextColor = "#E06B41",
        cardBackground = "#F2F0EB",
        linkText = "Get in touch",
        linkColor = "#5F5956",
        linkHref = "",
        // NEW: focus border color
        focusBorderColor = "#C5C3BD",
    } = props

    const [inputValue, setInputValue] = useState("")
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [error, setError] = useState("")
    const [isMobile, setIsMobile] = useReactState(false)
    const [isInputFocused, setIsInputFocused] = useState(false) // NEW

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handlePasswordSubmit = useCallback(() => {
        if (inputValue === password) {
            setIsAuthenticated(true)
        } else {
            setError("Incorrect password. Please try again.")
            setInputValue("")
        }
    }, [inputValue, password])

    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === "Enter") handlePasswordSubmit()
        },
        [handlePasswordSubmit]
    )

    const getOverlayStyle = () =>
        overlayType === "image" && overlayImage
            ? {
                  backgroundImage: `url(${overlayImage})`,
                  backgroundSize: "cover",
              }
            : { backgroundColor: overlayColor }

    if (isAuthenticated) return null

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "4rem",
                zIndex: 9999,
                ...getOverlayStyle(),
            }}
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                    maxWidth: isMobile ? "none" : "400px",
                    width: isMobile ? "calc(100vw - 32px)" : "100%",
                    margin: isMobile ? "16px" : "0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "24px",
                    padding: isMobile ? "40px 24px" : "4rem",
                    borderRadius: "1.03156rem",
                    backgroundColor: cardBackground,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        color: titleColor,
                        ...(titleFont || {}),
                    }}
                >
                    {titleText}
                </h2>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                    }}
                >
                    <input
                        type="password"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setIsInputFocused(true)} // NEW
                        onBlur={() => setIsInputFocused(false)} // NEW
                        style={{
                            display: "flex",
                            padding: "1rem 0.8125rem",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: "0.41263rem",
                            backgroundColor: inputBackground,
                            color: inputTextColor,
                            textAlign: "center",
                            ...(bodyFont || {}),
                            // NEW: custom focus/blur visuals
                            outline: "none",
                            border: `1px solid ${isInputFocused ? focusBorderColor : "transparent"}`,
                            boxShadow: "none",
                            transition:
                                "border-color .2s ease, box-shadow .2s ease",
                        }}
                        placeholder={inputPlaceholder}
                        autoFocus
                    />

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                marginTop: "12px",
                                color: errorTextColor,
                                textAlign: "center",
                                ...(bodyFont || {}),
                                fontSize: bodyFont?.fontSize || "0.875rem",
                            }}
                        >
                            {error}
                        </motion.p>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePasswordSubmit}
                        style={{
                            marginTop: "20px",
                            display: "flex",
                            padding: "1rem 0.8125rem",
                            justifyContent: "center",
                            alignItems: "center",
                            border: "none",
                            borderRadius: "0.41263rem",
                            backgroundColor: buttonBackground,
                            color: buttonTextColor,
                            textAlign: "center",
                            cursor: "pointer",
                            ...(bodyFont || {}),
                        }}
                    >
                        {buttonText}
                    </motion.button>

                    {linkText && (
                        <a
                            href={linkHref || "#"}
                            style={{
                                marginTop: "24px",
                                textDecoration: "underline",
                                textAlign: "center",
                                color: linkColor,
                                cursor: "pointer",
                                ...(bodyFont || {}),
                                fontSize: bodyFont?.fontSize || "0.9375rem",
                            }}
                        >
                            {linkText}
                        </a>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

PasswordProtectedScreen.defaultProps = {
    password: "secret123",
    titleText: "Enter password to view case study",
    titleColor: "#3D3733",

    titleFont: {
        fontFamily:
            "'Editorial New', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        textAlign: "center",
        fontSize: "1.75rem",
        lineHeight: "100%",
        letterSpacing: "-0.035rem",
        fontWeight: 400,
    },
    bodyFont: {
        fontFamily:
            "'PP Neue Montreal', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontSize: "1rem",
        lineHeight: "100%",
        fontWeight: 400,
    },

    overlayType: "color",
    overlayColor: "#FCFBF7",
    inputBackground: "#E5E3DE",
    inputTextColor: "#5F5956",
    inputPlaceholder: "Password",
    buttonBackground: "#E06B41",
    buttonTextColor: "#ffffff",
    buttonText: "Submit",
    errorTextColor: "#E06B41",
    cardBackground: "#F2F0EB",
    linkText: "Get in touch",
    linkColor: "#5F5956",
    linkHref: "",
    // NEW
    focusBorderColor: "#C5C3BD",
}

addPropertyControls(PasswordProtectedScreen, {
    password: { type: ControlType.String, title: "Password" },

    overlayType: {
        type: ControlType.Enum,
        title: "Overlay Type",
        options: ["color", "image"],
        optionTitles: ["Color", "Image"],
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        hidden: (p) => p.overlayType !== "color",
    },
    cardBackground: { type: ControlType.Color, title: "Card Background" },
    overlayImage: {
        type: ControlType.Image,
        title: "Overlay Image",
        hidden: (p) => p.overlayType !== "image",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        displayTextAlignment: true,
        displayFontSize: true,
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        displayTextAlignment: false,
        displayFontSize: true,
    },

    titleText: { type: ControlType.String, title: "Title Text" },
    titleColor: { type: ControlType.Color, title: "Title Color" },

    inputBackground: { type: ControlType.Color, title: "Input Background" },
    inputTextColor: { type: ControlType.Color, title: "Input Text Color" },
    inputPlaceholder: { type: ControlType.String, title: "Input Text" },

    buttonBackground: { type: ControlType.Color, title: "Button Color" },
    buttonTextColor: { type: ControlType.Color, title: "Button Text Color" },
    buttonText: { type: ControlType.String, title: "Button Text" },

    linkText: { type: ControlType.String, title: "Link Text" },
    linkColor: { type: ControlType.Color, title: "Link Color" },
    linkHref: { type: ControlType.String, title: "Link URL" },

    // NEW: make focus color editable too
    focusBorderColor: { type: ControlType.Color, title: "Input Focus Border" },
})
