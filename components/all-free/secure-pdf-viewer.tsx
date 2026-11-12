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


interface SecurePDFViewerProps {
    mediaSettings?: {
        sourceType?: "url" | "file"
        pdfUrl?: string
        pdfFile?: string
    }
    security?: {
        enableProtection?: boolean
        watermarkText?: string
    }
    design?: {
        backgroundColor?: string
        canvasColor?: string
        controlBarColor?: string
        accentColor?: string
        radius?: number
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SecurePDFViewer(props: SecurePDFViewerProps) {
    const { mediaSettings = {}, security = {}, design = {} } = props
    const isStaticRenderer = useIsStaticRenderer()

    const {
        sourceType = "url",
        pdfUrl = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
        pdfFile = "",
    } = mediaSettings

    const { enableProtection = true, watermarkText = "CONFIDENTIAL" } = security

    const {
        backgroundColor = "#111111",
        canvasColor = "#1a1a1a",
        controlBarColor = "#0a0a0a",
        accentColor = "#ffffff",
        radius = 12,
    } = design

    const [isMounted, setIsMounted] = React.useState(false)
    const [numPages, setNumPages] = React.useState<number | null>(null)
    const [pageNumber, setPageNumber] = React.useState(1)
    const [scale, setScale] = React.useState(1.0)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [pdfLib, setPdfLib] = React.useState<null | {
        Document: React.ComponentType<any>
        Page: React.ComponentType<any>
    }>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Ensure initialization only happens in the browser, protecting the SSG build
    React.useEffect(() => {
        setIsMounted(true)
        if (isStaticRenderer) return
        if (typeof window === "undefined") return

        let cancelled = false
        import("react-pdf")
            .then((mod) => {
                if (cancelled) return
                mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url
                ).toString()
                setPdfLib({
                    Document: mod.Document,
                    Page: mod.Page,
                })
            })
            .catch(() => {
                if (cancelled) return
                setPdfLib(null)
            })

        return () => {
            cancelled = true
        }
    }, [isStaticRenderer])

    const resolvedSource = React.useMemo(() => {
        return sourceType === "file" && pdfFile ? pdfFile : pdfUrl
    }, [sourceType, pdfFile, pdfUrl])

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
        setPageNumber(1)
    }

    const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1))
    const goToNextPage = () =>
        setPageNumber((prev) => Math.min(prev + 1, numPages || 1))
    const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5))
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))

    const toggleFullscreen = () => {
        if (typeof document === "undefined") return
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.error(
                    `Error attempting to enable full-screen mode: ${err.message}`
                )
            })
        } else {
            document.exitFullscreen()
        }
    }

    React.useEffect(() => {
        if (!isMounted) return
        if (isStaticRenderer) return
        if (typeof document === "undefined") return

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () =>
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            )
    }, [isMounted, isStaticRenderer])

    // Fallback UI for Framer's SSG Build Process
    if (!isMounted || isStaticRenderer) {
        const sourceLabel = (() => {
            if (!resolvedSource) return "PDF Preview"
            try {
                if (typeof window !== "undefined") {
                    const url = new URL(resolvedSource, window.location.href)
                    return (
                        url.pathname.split("/").pop() ||
                        url.hostname ||
                        "PDF Preview"
                    )
                }
            } catch {
                // Ignore parsing failure and use fallback label.
            }
            return "PDF Preview"
        })()

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "400px",
                    backgroundColor: backgroundColor,
                    borderRadius: radius,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#a1a1aa",
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    position: "relative",
                }}
                onContextMenu={(e) => enableProtection && e.preventDefault()}
            >
                {enableProtection && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            padding: "8px 16px",
                            background:
                                "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            zIndex: 10,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "11px",
                                color: "#a1a1aa",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                fontWeight: 600,
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                    ry="2"
                                ></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Protected View
                        </div>
                    </div>
                )}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "24px",
                        color: "#a1a1aa",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "28px", lineHeight: 1 }}>📄</div>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                        PDF Preview
                    </div>
                    <div
                        style={{
                            fontSize: "12px",
                            opacity: 0.85,
                            maxWidth: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {sourceLabel}
                    </div>
                </div>
            </div>
        )
    }

    const DocumentComponent = pdfLib?.Document
    const PageComponent = pdfLib?.Page

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: isFullscreen ? "100vh" : "100%",
                minHeight: "400px",
                backgroundColor: backgroundColor,
                borderRadius: isFullscreen ? 0 : radius,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: isFullscreen
                    ? "none"
                    : "0 20px 40px rgba(0, 0, 0, 0.6)",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                position: "relative",
            }}
            onContextMenu={(e) => enableProtection && e.preventDefault()}
        >
            {enableProtection && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        padding: "8px 16px",
                        background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            color: "#a1a1aa",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            fontWeight: 600,
                        }}
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                            ></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Protected View
                    </div>
                </div>
            )}

            <div
                style={{
                    flexGrow: 1,
                    background: canvasColor,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "24px",
                    overflow: "auto",
                    position: "relative",
                }}
            >
                {resolvedSource && DocumentComponent && PageComponent ? (
                    <DocumentComponent
                        file={resolvedSource}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                            <div style={{ color: "#a1a1aa", fontSize: "14px" }}>
                                Loading Document...
                            </div>
                        }
                        error={
                            <div
                                style={{
                                    color: "#ef4444",
                                    fontSize: "14px",
                                    textAlign: "center",
                                    padding: "20px",
                                }}
                            >
                                Failed to load PDF. Please check the URL or CORS
                                policies.
                            </div>
                        }
                    >
                        <div
                            style={{
                                position: "relative",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            }}
                        >
                            <PageComponent
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                            {enableProtection && watermarkText && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform:
                                            "translate(-50%, -50%) rotate(-30deg)",
                                        fontSize: `${scale * 48}px`,
                                        color: "rgba(0, 0, 0, 0.05)",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        pointerEvents: "none",
                                        whiteSpace: "nowrap",
                                        userSelect: "none",
                                        zIndex: 5,
                                    }}
                                >
                                    {watermarkText}
                                </div>
                            )}
                        </div>
                    </DocumentComponent>
                ) : (
                    <div style={{ color: "#a1a1aa", fontSize: "14px" }}>
                        {resolvedSource
                            ? "Loading Document..."
                            : "Provide a PDF File or URL"}
                    </div>
                )}
            </div>

            <div
                style={{
                    height: "60px",
                    background: controlBarColor,
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0 20px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        aria-label="Previous page"
                        title="Previous page"
                        style={{
                            width: "36px",
                            height: "36px",
                            background: "transparent",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            color:
                                pageNumber <= 1
                                    ? "rgba(255,255,255,0.3)"
                                    : accentColor,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: pageNumber <= 1 ? "not-allowed" : "pointer",
                        }}
                    >
                        <svg
                            aria-hidden="true"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <span
                        style={{
                            color: accentColor,
                            fontSize: "13px",
                            fontWeight: 500,
                            minWidth: "60px",
                            textAlign: "center",
                            userSelect: "none",
                        }}
                    >
                        {numPages ? `${pageNumber} / ${numPages}` : "-- / --"}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= (numPages || 1)}
                        aria-label="Next page"
                        title="Next page"
                        style={{
                            width: "36px",
                            height: "36px",
                            background: "transparent",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            color:
                                pageNumber >= (numPages || 1)
                                    ? "rgba(255,255,255,0.3)"
                                    : accentColor,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor:
                                pageNumber >= (numPages || 1)
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        <svg
                            aria-hidden="true"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        aria-label="Zoom out"
                        title="Zoom out"
                        style={{
                            width: "36px",
                            height: "36px",
                            background: "transparent",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            color:
                                scale <= 0.5
                                    ? "rgba(255,255,255,0.3)"
                                    : accentColor,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: scale <= 0.5 ? "not-allowed" : "pointer",
                        }}
                    >
                        <svg
                            aria-hidden="true"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <button
                        onClick={zoomIn}
                        disabled={scale >= 2.5}
                        aria-label="Zoom in"
                        title="Zoom in"
                        style={{
                            width: "36px",
                            height: "36px",
                            background: "transparent",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            color:
                                scale >= 2.5
                                    ? "rgba(255,255,255,0.3)"
                                    : accentColor,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: scale >= 2.5 ? "not-allowed" : "pointer",
                        }}
                    >
                        <svg
                            aria-hidden="true"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <div
                        style={{
                            width: "1px",
                            height: "24px",
                            background: "rgba(255,255,255,0.1)",
                            margin: "0 4px",
                        }}
                    ></div>
                    <button
                        onClick={toggleFullscreen}
                        aria-label={
                            isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                        }
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        style={{
                            width: "36px",
                            height: "36px",
                            background: "transparent",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            color: accentColor,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                        }}
                    >
                        <svg
                            aria-hidden="true"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(SecurePDFViewer, {
    mediaSettings: {
        type: ControlType.Object,
        title: "Document Setup",
        controls: {
            sourceType: {
                type: ControlType.Enum,
                title: "Source",
                options: ["url", "file"],
                optionTitles: ["PDF Link", "Upload PDF"],
                defaultValue: "url",
            },
            pdfUrl: {
                type: ControlType.String,
                title: "Paste URL",
                defaultValue:
                    "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
                placeholder: "https://example.com/pitch-deck.pdf",
                hidden: (mediaSettingsProps) =>
                    mediaSettingsProps.sourceType !== "url",
            },
            pdfFile: {
                type: ControlType.File,
                title: "Upload PDF",
                allowedFileTypes: ["pdf"],
                hidden: (mediaSettingsProps) =>
                    mediaSettingsProps.sourceType !== "file",
            },
        },
        defaultValue: {
            sourceType: "url",
            pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf",
        },
    },
    security: {
        type: ControlType.Object,
        title: "Security & IP",
        controls: {
            enableProtection: {
                type: ControlType.Boolean,
                title: "Protected Mode",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            watermarkText: {
                type: ControlType.String,
                title: "Watermark",
                defaultValue: "CONFIDENTIAL",
                hidden: (securityProps) => !securityProps.enableProtection,
            },
        },
        defaultValue: {
            enableProtection: true,
            watermarkText: "CONFIDENTIAL",
        },
    },
    design: {
        type: ControlType.Object,
        title: "Design Setup",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#111111",
            },
            canvasColor: {
                type: ControlType.Color,
                title: "Canvas Fill",
                defaultValue: "#1a1a1a",
            },
            controlBarColor: {
                type: ControlType.Color,
                title: "Bar Color",
                defaultValue: "#0a0a0a",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Icon Tint",
                defaultValue: "#ffffff",
            },
            radius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 12,
            },
        },
        defaultValue: {
            backgroundColor: "#111111",
            canvasColor: "#1a1a1a",
            controlBarColor: "#0a0a0a",
            accentColor: "#ffffff",
            radius: 12,
        },
    },
})
