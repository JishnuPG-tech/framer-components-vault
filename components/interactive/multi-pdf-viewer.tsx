import * as React from "react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

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
 * PDF Viewer Button
 *
 * A button that opens a modal overlay with an embedded PDF viewer.
 * Supports multiple PDFs (switchable via a dropdown), download,
 * print, maximize, close-on-ESC/backdrop, and a fallback
 * "Open in new tab" link.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PdfViewerButton(props) {
    const {
        buttonText,
        pdfDocuments,
        backgroundColor,
        textColor,
        borderRadius,
        font,
        paddingX,
        paddingY,
        overlayColor,
        modalBackground,
        closeButtonColor,
    } = props

    const docs = useMemo(
        () => (pdfDocuments || []).filter((d) => d && d.file),
        [pdfDocuments]
    )

    const [isOpen, setIsOpen] = useState(false)
    const [isMaximized, setIsMaximized] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const printFrameRef = useRef(null)
    const isStatic = useIsStaticRenderer()

    // Detect mobile viewport so the modal can go full-screen automatically
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 640)
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const activeDoc = docs[selectedIndex] || docs[0]
    const pdfUrl = activeDoc ? activeDoc.file : ""
    const fullScreen = isMaximized

    const openViewer = useCallback(() => {
        if (docs.length === 0) return
        setSelectedIndex(0)
        setIsOpen(true)
    }, [docs])

    const closeViewer = useCallback(() => {
        setIsOpen(false)
        setIsMaximized(false)
    }, [])

    const toggleMaximize = useCallback(() => {
        setIsMaximized((prev) => !prev)
    }, [])

    const [isDownloading, setIsDownloading] = useState(false)

    const getFileName = useCallback((url, label) => {
        try {
            const pathname = new URL(url).pathname
            const base = pathname.substring(pathname.lastIndexOf("/") + 1)
            if (base && base.toLowerCase().endsWith(".pdf")) {
                return decodeURIComponent(base)
            }
        } catch (err) {
            // ignore, fall through to label-based name
        }
        const safeLabel = (label || "document")
            .trim()
            .replace(/\s+/g, "-")
            .toLowerCase()
        return `${safeLabel}.pdf`
    }, [])

    const downloadPdf = useCallback(async () => {
        if (!pdfUrl || isDownloading) return
        setIsDownloading(true)
        try {
            const response = await fetch(pdfUrl)
            if (!response.ok) throw new Error("Failed to fetch PDF")
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = blobUrl
            link.download = getFileName(pdfUrl, activeDoc?.label)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(blobUrl)
        } catch (err) {
            // Fallback if fetch is blocked (e.g. CORS) — at least gets the user to the file
            window.open(pdfUrl, "_blank", "noopener,noreferrer")
        } finally {
            setIsDownloading(false)
        }
    }, [pdfUrl, isDownloading, activeDoc, getFileName])

    const printPdf = useCallback(() => {
        if (!pdfUrl) return

        const frame = printFrameRef.current
        if (!frame) {
            window.open(pdfUrl, "_blank")
            return
        }

        let fallbackTimer

        const handleLoad = () => {
            clearTimeout(fallbackTimer)
            try {
                frame.contentWindow.focus()
                frame.contentWindow.print()
            } catch (err) {
                window.open(pdfUrl, "_blank")
            }
        }

        frame.onload = handleLoad
        frame.src = pdfUrl

        // Fallback if the browser blocks silent cross-origin printing
        fallbackTimer = window.setTimeout(() => {
            window.open(pdfUrl, "_blank")
        }, 4000)
    }, [pdfUrl])

    // Close on ESC
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeViewer()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, closeViewer])

    // Lock body scroll while modal is open
    useEffect(() => {
        if (isOpen) {
            const original = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => {
                document.body.style.overflow = original
            }
        }
    }, [isOpen])

    const hasDocs = docs.length > 0

    return (
        <>
            <motion.button
                onClick={openViewer}
                whileHover={isStatic ? undefined : { scale: 1.03 }}
                whileTap={isStatic ? undefined : { scale: 0.97 }}
                style={{
                    backgroundColor,
                    color: textColor,
                    borderRadius,
                    ...font,
                    padding: `${paddingY}px ${paddingX}px`,
                    border: "none",
                    cursor: hasDocs ? "pointer" : "not-allowed",
                    opacity: hasDocs ? 1 : 0.5,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    whiteSpace: "nowrap",
                }}
                aria-haspopup="dialog"
                aria-label={buttonText}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0 }}
                >
                    <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M14 2v6h6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                {buttonText}
            </motion.button>

            {/* Hidden iframe used purely to trigger native print */}
            <iframe
                ref={printFrameRef}
                title="PDF print helper"
                style={{
                    position: "fixed",
                    width: 0,
                    height: 0,
                    border: "none",
                    visibility: "hidden",
                }}
            />

            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: isStatic ? 0 : 0.2 }}
                                onClick={closeViewer}
                                role="dialog"
                                aria-modal="true"
                                style={{
                                    position: "fixed",
                                    inset: 0,
                                    backgroundColor: overlayColor,
                                    zIndex: 999998,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: fullScreen ? 0 : 24,
                                }}
                            >
                                <motion.div
                                    layout={!isStatic}
                                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                                    transition={{
                                        duration: isStatic ? 0 : 0.22,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: "relative",
                                        width: fullScreen
                                            ? "100vw"
                                            : isMobile
                                              ? 300
                                              : "100%",
                                        maxWidth: fullScreen
                                            ? "100vw"
                                            : isMobile
                                              ? 300
                                              : 900,
                                        height: fullScreen ? "100dvh" : "85vh",
                                        backgroundColor: modalBackground,
                                        borderRadius: fullScreen ? 0 : 12,
                                        overflow: "hidden",
                                        boxShadow:
                                            "0 20px 60px rgba(0,0,0,0.35)",
                                        display: "flex",
                                        flexDirection: "column",
                                        zIndex: 999999,
                                    }}
                                >
                                    {/* Header */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: isMobile ? 6 : 12,
                                            padding: isMobile
                                                ? "10px 10px"
                                                : "12px 16px",
                                            borderBottom:
                                                "1px solid rgba(0,0,0,0.08)",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {docs.length > 1 ? (
                                            <select
                                                value={selectedIndex}
                                                onChange={(e) =>
                                                    setSelectedIndex(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                style={{
                                                    fontSize: 13,
                                                    color: "inherit",
                                                    background: "transparent",
                                                    border: "1px solid rgba(0,0,0,0.15)",
                                                    borderRadius: 6,
                                                    padding: "5px 6px",
                                                    fontFamily: "inherit",
                                                    maxWidth: isMobile
                                                        ? 110
                                                        : 220,
                                                    minWidth: 0,
                                                    flex: isMobile
                                                        ? "1 1 auto"
                                                        : "0 1 auto",
                                                }}
                                            >
                                                {docs.map((doc, i) => (
                                                    <option value={i} key={i}>
                                                        {doc.label ||
                                                            `Document ${i + 1}`}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <a
                                                href={pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    fontSize: 13,
                                                    color: "inherit",
                                                    opacity: 0.7,
                                                    textDecoration: "none",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {isMobile
                                                    ? "Open ↗"
                                                    : "Open in new tab ↗"}
                                            </a>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {/* Print */}
                                            <button
                                                onClick={printPdf}
                                                aria-label="Print PDF"
                                                title="Print"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: isMobile ? 38 : 32,
                                                    height: isMobile ? 38 : 32,
                                                    borderRadius: 8,
                                                    color: closeButtonColor,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <svg
                                                    width="17"
                                                    height="17"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6v-7z"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>

                                            {/* Download */}
                                            <button
                                                onClick={downloadPdf}
                                                disabled={isDownloading}
                                                aria-label="Download PDF"
                                                title="Download"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: isDownloading
                                                        ? "wait"
                                                        : "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: isMobile ? 38 : 32,
                                                    height: isMobile ? 38 : 32,
                                                    borderRadius: 8,
                                                    color: closeButtonColor,
                                                    opacity: isDownloading
                                                        ? 0.5
                                                        : 1,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isDownloading ? (
                                                    <motion.svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        animate={
                                                            isStatic
                                                                ? undefined
                                                                : {
                                                                      rotate: 360,
                                                                  }
                                                        }
                                                        transition={{
                                                            duration: 0.8,
                                                            repeat: isStatic
                                                                ? 0
                                                                : Infinity,
                                                            ease: "linear",
                                                        }}
                                                    >
                                                        <path
                                                            d="M21 12a9 9 0 11-9-9"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                        />
                                                    </motion.svg>
                                                ) : (
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                )}
                                            </button>

                                            {/* Maximize / Restore */}
                                            <button
                                                onClick={toggleMaximize}
                                                aria-label={
                                                    isMaximized
                                                        ? "Restore PDF viewer"
                                                        : "Maximize PDF viewer"
                                                }
                                                title={
                                                    isMaximized
                                                        ? "Restore"
                                                        : "Maximize"
                                                }
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    color: closeButtonColor,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isMaximized ? (
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M9 3H4a1 1 0 00-1 1v5m0 6v5a1 1 0 001 1h5m6 0h5a1 1 0 001-1v-5m0-6V4a1 1 0 00-1-1h-5"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M4 9V4h5M20 9V4h-5M4 15v5h5m11-5v5h-5"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                )}
                                            </button>

                                            {/* Close */}
                                            <button
                                                onClick={closeViewer}
                                                aria-label="Close PDF viewer"
                                                title="Close"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: isMobile ? 38 : 32,
                                                    height: isMobile ? 38 : 32,
                                                    borderRadius: 8,
                                                    color: closeButtonColor,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <svg
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M18 6L6 18M6 6l12 12"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* PDF embed */}
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        {pdfUrl ? (
                                            <iframe
                                                key={pdfUrl}
                                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                                                    pdfUrl
                                                )}&embedded=true`}
                                                title="PDF viewer"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    border: "none",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    height: "100%",
                                                    opacity: 0.5,
                                                    fontSize: 14,
                                                }}
                                            >
                                                No PDF selected
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    )
}

PdfViewerButton.defaultProps = {
    buttonText: "View PDF",
    pdfDocuments: [{ label: "Document", file: "" }],
    backgroundColor: "#111111",
    textColor: "#FFFFFF",
    borderRadius: 8,
    font: {
        fontFamily: "Inter",
        fontSize: 15,
        fontWeight: 500,
    },
    paddingX: 20,
    paddingY: 12,
    overlayColor: "rgba(0,0,0,0.6)",
    modalBackground: "#FFFFFF",
    closeButtonColor: "#111111",
}

addPropertyControls(PdfViewerButton, {
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "View PDF",
    },
    pdfDocuments: {
        type: ControlType.Array,
        title: "PDF Documents",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Document",
                },
                file: {
                    type: ControlType.File,
                    title: "PDF File",
                    allowedFileTypes: ["pdf"],
                },
            },
        },
        defaultValue: [{ label: "Document", file: "" }],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#111111",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 500,
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        defaultValue: 8,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 60,
        defaultValue: 20,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 40,
        defaultValue: 12,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "rgba(0,0,0,0.6)",
    },
    modalBackground: {
        type: ControlType.Color,
        title: "Modal Background",
        defaultValue: "#FFFFFF",
    },
    closeButtonColor: {
        type: ControlType.Color,
        title: "Close Icon Color",
        defaultValue: "#111111",
    },
})
