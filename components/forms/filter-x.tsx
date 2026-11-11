// Image Filter Component for Framer with Instagram-style filters
import { useState, useEffect, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageFilterProps {
    inputMethod: "upload" | "url"
    imageFile: string
    imageUrl: string
    showFilterButtons: boolean
    objectFit: "cover" | "contain" | "fill" | "none"
    enableComparison: boolean
    comparisonMode: "toggle" | "split"
    selectedFilter: string
    style?: CSSProperties
}

const filters = {
    "None": "none",
    "BRIGHT": "brightness(1.3) contrast(1.1) saturate(1.2)",
    "VINTAGE": "sepia(0.5) contrast(1.2) brightness(1.1) saturate(0.8) hue-rotate(15deg)",
    "MEMO": "grayscale(0.3) contrast(1.3) brightness(0.9) saturate(0.7)",
    "MOSS": "hue-rotate(80deg) saturate(1.4) contrast(1.1) brightness(0.95)",
    "SKIN": "saturate(1.3) brightness(1.05) contrast(0.95) hue-rotate(-10deg)",
    "CREAM": "sepia(0.2) saturate(1.1) brightness(1.1) contrast(0.9) hue-rotate(10deg)",
    "FLIM": "contrast(1.4) brightness(0.9) saturate(1.2) hue-rotate(5deg)",
    "BLUR": "blur(2px) brightness(1.05)",
    "BLACK & WHITE": "grayscale(1) contrast(1.1) brightness(1.05)",
    "ANTIQUE": "sepia(0.8) contrast(1.1) brightness(0.9) saturate(0.6) hue-rotate(20deg)",
    "MAGENTA": "hue-rotate(300deg) saturate(1.5) contrast(1.2) brightness(1.1)",
    "MOOD": "contrast(1.2) brightness(0.85) saturate(1.4) hue-rotate(-15deg)"
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FilterX(props: ImageFilterProps) {
    const {
        inputMethod = "url",
        imageFile = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        imageUrl = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        showFilterButtons = false,
        objectFit = "cover",
        enableComparison = false,
        comparisonMode = "toggle",
        selectedFilter = "None"
    } = props

    const [isLoading, setIsLoading] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [currentImageSrc, setCurrentImageSrc] = useState("")
    const [activeFilter, setActiveFilter] = useState(selectedFilter)
    const [showOriginal, setShowOriginal] = useState(false)
    const [splitPosition, setSplitPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const [filtersVisible, setFiltersVisible] = useState(false)

    // Update activeFilter when selectedFilter prop changes
    useEffect(() => {
        setActiveFilter(selectedFilter)
    }, [selectedFilter])

    // Determine which image source to use
    const imageSrc = useMemo(() => {
        if (inputMethod === "upload") {
            return imageFile
        }
        return imageUrl || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
    }, [inputMethod, imageFile, imageUrl])

    // Handle image loading
    useEffect(() => {
        if (!imageSrc) {
            setCurrentImageSrc("")
            setHasError(false)
            setErrorMessage("")
            return
        }

        // If it's a default image, use it directly
        if (imageSrc.startsWith("https://framerusercontent.com/")) {
            setCurrentImageSrc(imageSrc)
            setHasError(false)
            setErrorMessage("")
            setIsLoading(false)
            return
        }

        if (imageSrc === currentImageSrc) return

        startTransition(() => {
            setIsLoading(true)
            setHasError(false)
            setErrorMessage("")
        })

        const img = new Image()
        
        img.onload = () => {
            startTransition(() => {
                setCurrentImageSrc(imageSrc)
                setIsLoading(false)
                setHasError(false)
                setErrorMessage("")
            })
        }

        img.onerror = () => {
            startTransition(() => {
                setIsLoading(false)
                setHasError(true)
                setErrorMessage("Failed to load image. Please check the URL.")
                setCurrentImageSrc("")
            })
        }

        img.src = imageSrc
    }, [imageSrc, currentImageSrc])

    const filterStyle = useMemo(() => {
        return filters[activeFilter] || "none"
    }, [activeFilter])

    const handleFilterChange = (filterName: string) => {
        startTransition(() => {
            setActiveFilter(filterName)
        })
    }

    const handleComparisonToggle = () => {
        startTransition(() => {
            setShowOriginal(!showOriginal)
        })
    }

    const handleFiltersToggle = () => {
        startTransition(() => {
            setFiltersVisible(!filtersVisible)
        })
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (comparisonMode === "split" && enableComparison) {
            setIsDragging(true)
            e.preventDefault()
        }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (comparisonMode === "split" && enableComparison) {
            setIsDragging(true)
            e.preventDefault()
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && comparisonMode === "split" && enableComparison) {
            const rect = e.currentTarget.getBoundingClientRect()
            const newPosition = ((e.clientX - rect.left) / rect.width) * 100
            setSplitPosition(Math.max(0, Math.min(100, newPosition)))
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && comparisonMode === "split" && enableComparison) {
            const rect = e.currentTarget.getBoundingClientRect()
            const touch = e.touches[0]
            if (touch) {
                const newPosition = ((touch.clientX - rect.left) / rect.width) * 100
                setSplitPosition(Math.max(0, Math.min(100, newPosition)))
            }
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
    }

    useEffect(() => {
        if (isDragging) {
            const handleGlobalMouseUp = () => setIsDragging(false)
            const handleGlobalTouchEnd = () => setIsDragging(false)
            document.addEventListener('mouseup', handleGlobalMouseUp)
            document.addEventListener('touchend', handleGlobalTouchEnd)
            return () => {
                document.removeEventListener('mouseup', handleGlobalMouseUp)
                document.removeEventListener('touchend', handleGlobalTouchEnd)
            }
        }
    }, [isDragging])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const result = event.target?.result as string
                if (result) {
                    startTransition(() => {
                        setCurrentImageSrc(result)
                        setHasError(false)
                        setErrorMessage("")
                        setIsLoading(false)
                    })
                }
            }
            reader.onerror = () => {
                startTransition(() => {
                    setHasError(true)
                    setErrorMessage("Failed to read the selected file.")
                    setIsLoading(false)
                })
            }
            startTransition(() => {
                setIsLoading(true)
                setHasError(false)
                setErrorMessage("")
            })
            reader.readAsDataURL(file)
        }
    }

    const containerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px"
    }

    const imageStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: objectFit,
        filter: (enableComparison && comparisonMode === "toggle" && showOriginal) ? "none" : filterStyle,
        transition: "filter 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease",
        opacity: isLoading ? 0.7 : 1
    }

    const originalImageStyle: CSSProperties = {
        ...imageStyle,
        filter: "none",
        clipPath: comparisonMode === "split" ? `inset(0 ${100 - splitPosition}% 0 0)` : "none",
        position: comparisonMode === "split" ? "absolute" : "static",
        top: 0,
        left: 0
    }

    const filteredImageStyle: CSSProperties = {
        ...imageStyle,
        filter: filterStyle,
        clipPath: comparisonMode === "split" ? `inset(0 0 0 ${splitPosition}%)` : "none",
        position: comparisonMode === "split" ? "absolute" : "static",
        top: 0,
        left: 0
    }

    const splitDividerStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: `${splitPosition}%`,
        width: "2px",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        boxShadow: "0 0 4px rgba(0,0,0,0.3)",
        cursor: "ew-resize",
        transform: "translateX(-1px)",
        zIndex: 10,
        touchAction: "none"
    }

    const comparisonButtonStyle: CSSProperties = {
        position: "absolute",
        top: "3%",
        right: "3%",
        padding: "2% 3%",
        fontSize: "clamp(10px, 2.5vw, 12px)",
        fontWeight: "500",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "6px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "#fff",
        cursor: "pointer",
        transition: "all 0.2s ease",
        userSelect: "none",
        backdropFilter: "blur(10px)",
        zIndex: 5
    }

    const labelStyle: CSSProperties = {
        position: "absolute",
        top: "3%",
        padding: "1% 2%",
        fontSize: "clamp(8px, 2vw, 10px)",
        fontWeight: "500",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "#fff",
        borderRadius: "4px",
        backdropFilter: "blur(10px)",
        userSelect: "none"
    }

    const filtersToggleButtonStyle: CSSProperties = {
        position: "absolute",
        bottom: "3%",
        left: "3%",
        padding: "2% 3%",
        fontSize: "clamp(10px, 2.5vw, 12px)",
        fontWeight: "500",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "6px",
        backgroundColor: filtersVisible ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.7)",
        color: filtersVisible ? "#000" : "#fff",
        cursor: "pointer",
        transition: "all 0.2s ease",
        userSelect: "none",
        backdropFilter: "blur(10px)",
        zIndex: 6
    }

    const filterOverlayStyle: CSSProperties = {
        position: "absolute",
        bottom: "3%",
        left: "3%",
        right: "3%",
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        rowGap: "8px",
        padding: "12px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        borderRadius: "8px",
        backdropFilter: "blur(10px)",
        opacity: (showFilterButtons && filtersVisible) ? 1 : 0,
        pointerEvents: (showFilterButtons && filtersVisible) ? "auto" : "none",
        transition: "opacity 0.3s ease",
        transform: filtersVisible ? "translateY(0)" : "translateY(10px)",
        marginBottom: "50px",
        alignItems: "center",
        justifyContent: "flex-start"
    }

    const filterButtonStyle = (filterName: string): CSSProperties => ({
        padding: "2% 3%",
        fontSize: "clamp(8px, 2vw, 10px)",
        fontWeight: "500",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "4px",
        backgroundColor: activeFilter === filterName ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.1)",
        color: activeFilter === filterName ? "#000" : "#fff",
        cursor: "pointer",
        transition: "all 0.2s ease",
        userSelect: "none",
        whiteSpace: "nowrap",
        minWidth: "fit-content",
        minHeight: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    })

    const placeholderStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
        textAlign: "center",
        color: "#666",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }

    const loadingStyle: CSSProperties = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "#666",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    }

    const errorStyle: CSSProperties = {
        ...placeholderStyle,
        color: "#e74c3c"
    }

    const spinnerStyle: CSSProperties = {
        width: "16px",
        height: "16px",
        border: "2px solid #ddd",
        borderTop: "2px solid #666",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
    }

    if (hasError) {
        return (
            <div style={containerStyle}>
                <div style={errorStyle}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <div>
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                            Failed to load image
                        </div>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            {inputMethod === "upload" ? "Please try a different file" : "Check the URL and try again"}
                        </div>
                    </div>
                    {inputMethod === "upload" && (
                        <label style={{
                            marginTop: "12px",
                            padding: "8px 16px",
                            backgroundColor: "#007AFF",
                            color: "white",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500"
                        }}>
                            Choose Another File
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                style={{ display: "none" }}
                            />
                        </label>
                    )}
                </div>
            </div>
        )
    }

    if (!currentImageSrc && !isLoading) {
        return (
            <div style={containerStyle}>
                <div style={placeholderStyle}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <div>
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>No image selected</div>
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            {inputMethod === "upload" ? "Upload an image file to get started" : "Enter an image URL to get started"}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div 
            style={containerStyle}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
            
            {currentImageSrc && (
                <>
                    {enableComparison && comparisonMode === "split" ? (
                        <>
                            <img
                                src={currentImageSrc}
                                alt="Original image"
                                style={originalImageStyle}
                            />
                            <img
                                src={currentImageSrc}
                                alt="Filtered image"
                                style={filteredImageStyle}
                            />
                            <div 
                                style={splitDividerStyle}
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleTouchStart}
                            />
                            <div style={{...labelStyle, left: "12px"}}>Original</div>
                            <div style={{...labelStyle, right: "12px"}}>Filtered</div>
                        </>
                    ) : (
                        <img
                            src={currentImageSrc}
                            alt={enableComparison && showOriginal ? "Original image" : "Filtered image"}
                            style={imageStyle}
                        />
                    )}

                    {enableComparison && comparisonMode === "toggle" && (
                        <button
                            style={comparisonButtonStyle}
                            onClick={handleComparisonToggle}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
                            }}
                        >
                            {showOriginal ? "Show Filtered" : "Show Original"}
                        </button>
                    )}
                </>
            )}

            {currentImageSrc && (
                <div style={filterOverlayStyle}>
                    {Object.keys(filters).map((filterName) => (
                        <button
                            key={filterName}
                            style={filterButtonStyle(filterName)}
                            onClick={() => handleFilterChange(filterName)}
                            onMouseEnter={(e) => {
                                if (activeFilter !== filterName) {
                                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFilter !== filterName) {
                                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
                                }
                            }}
                        >
                            {filterName}
                        </button>
                    ))}
                </div>
            )}

            {currentImageSrc && showFilterButtons && (
                <button
                    style={filtersToggleButtonStyle}
                    onClick={handleFiltersToggle}
                    onMouseEnter={(e) => {
                        if (!filtersVisible) {
                            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!filtersVisible) {
                            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
                        }
                    }}
                >
                    {filtersVisible ? "Hide Filters" : "Filters"}
                </button>
            )}
            
            {isLoading && (
                <div style={loadingStyle}>
                    <div style={spinnerStyle}></div>
                    Loading image...
                </div>
            )}
        </div>
    )
}

addPropertyControls(FilterX, {
    inputMethod: {
        type: ControlType.Enum,
        title: "Image Source",
        description: "Choose between uploading a file or entering a URL",
        options: ["upload", "url"],
        optionTitles: ["Upload", "URL"],
        defaultValue: "url",
        displaySegmentedControl: true
    },
    imageUrl: {
        type: ControlType.String,
        title: "URL",
        description: "Enter a direct link to an image file",
        placeholder: "https://example.com/image.jpg",
        defaultValue: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        hidden: ({ inputMethod }) => inputMethod !== "url"
    },
    imageFile: {
        type: ControlType.File,
        title: "File",
        description: "Upload an image file from your device",
        allowedFileTypes: ["jpg", "jpeg", "png", "svg", "gif", "webp", "bmp", "tiff", "ico", "avif"],
        hidden: ({ inputMethod }) => inputMethod !== "upload"
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        description: "Controls how the image scales within the container",
        options: ["cover", "contain", "fill", "none"],
        defaultValue: "cover"
    },
    selectedFilter: {
        type: ControlType.Enum,
        title: "Filter",
        description: "Apply an Instagram-style filter to the image",
        options: Object.keys(filters),
        defaultValue: "None"
    },
    showFilterButtons: {
        type: ControlType.Boolean,
        title: "Filter Controls",
        description: "Show interactive filter buttons on the image",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide"
    },
    enableComparison: {
        type: ControlType.Boolean,
        title: "Comparison",
        description: "Enable before/after comparison with original image",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    comparisonMode: {
        type: ControlType.Enum,
        title: "Mode",
        description: "Toggle switches views, Split shows both sides",
        options: ["toggle", "split"],
        optionTitles: ["Toggle", "Split"],
        defaultValue: "toggle",
        displaySegmentedControl: true,
        hidden: ({ enableComparison }) => !enableComparison
    }
})