import * as React from "react"
import { useState, useMemo, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"
import Papa from "https://esm.sh/papaparse"
import * as XLSX from "https://esm.sh/xlsx"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function DataVisualisePro(props) {
    const {
        dataSource,
        datasetTitle,
        logoImage,
        maxWidth,
        colTitle,
        colValue,
        colCategory,
        colDate,
        customFont,
        primaryColor,
        backgroundColor,
        panelColor,
        textColor,
        accentColor,
        borderRadius,
        darkMode,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const [rawData, setRawData] = useState([])
    const [columns, setColumns] = useState([])
    const [fileMeta, setFileMeta] = useState(null)
    const [isParsing, setIsParsing] = useState(false)
    const [error, setError] = useState("")

    const [view, setView] = useState("table") // "table" | "grid"
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")

    const [sort, setSort] = useState({ key: colValue || "", direction: "desc" })
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 100

    const getFontFamily = (fontProp) => {
        if (typeof fontProp === "string") return fontProp
        if (fontProp && typeof fontProp === "object" && fontProp.fontFamily)
            return fontProp.fontFamily
        return "Inter, system-ui, sans-serif"
    }
    const appliedFontFamily = getFontFamily(customFont)

    const theme = useMemo(
        () => ({
            bg: darkMode ? "#09090B" : backgroundColor,
            panel: darkMode ? "#18181B" : panelColor,
            text: darkMode ? "#FAFAFA" : textColor,
            muted: darkMode ? "#A1A1AA" : "#71717A",
            border: darkMode ? "#27272A" : "#E4E4E7",
            hover: darkMode ? "#27272A" : "#F4F4F5",
            primary: primaryColor,
            accent: accentColor,
            radius: borderRadius,
            font: appliedFontFamily,
        }),
        [
            darkMode,
            backgroundColor,
            panelColor,
            textColor,
            primaryColor,
            accentColor,
            borderRadius,
            appliedFontFamily,
        ]
    )

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(handler)
    }, [search])

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, activeCategory, sort, view])

    useEffect(() => {
        if (colValue && !sort.key) {
            setSort({ key: colValue, direction: "desc" })
        }
    }, [colValue])

    useEffect(() => {
        if (!dataSource) {
            setRawData([])
            setColumns([])
            setFileMeta(null)
            return
        }

        const fetchAndParse = async () => {
            setIsParsing(true)
            setError("")

            try {
                const response = await fetch(dataSource)
                const isExcel = dataSource.toLowerCase().includes(".xls")

                const urlParts = dataSource.split("/")
                let rawFileName = urlParts[urlParts.length - 1] || "dataset.csv"
                rawFileName = rawFileName.split("?")[0]

                if (isExcel) {
                    const arrayBuffer = await response.arrayBuffer()
                    const workbook = XLSX.read(arrayBuffer, { type: "array" })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        defval: "",
                    })
                    processParsedData(jsonData, rawFileName)
                } else {
                    const text = await response.text()
                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        dynamicTyping: true,
                        complete: (results) => {
                            if (
                                results.errors.length &&
                                results.data.length === 0
                            ) {
                                setError("Failed to parse CSV.")
                                setIsParsing(false)
                            } else {
                                processParsedData(results.data, rawFileName)
                            }
                        },
                        error: (err) => {
                            setError(err.message)
                            setIsParsing(false)
                        },
                    })
                }
            } catch (err) {
                console.error(err)
                setError("Failed to load or parse the data file.")
                setIsParsing(false)
            }
        }

        fetchAndParse()
    }, [dataSource])

    const processParsedData = (data, fileName) => {
        if (!data || data.length === 0) {
            setError("File contains no data.")
            setIsParsing(false)
            return
        }

        const cols = Object.keys(data[0])
        setColumns(cols)
        setRawData(data)
        setFileMeta({
            name: fileName,
            rows: data.length,
        })

        if (!sort.key && cols.length > 0) {
            setSort({ key: colValue || cols[0], direction: "desc" })
        }

        setIsParsing(false)
    }

    const categories = useMemo(() => {
        if (!colCategory || !rawData.length) return []
        const cats = new Set()
        rawData.forEach((row) => {
            if (
                row[colCategory] !== undefined &&
                row[colCategory] !== null &&
                row[colCategory] !== ""
            ) {
                cats.add(String(row[colCategory]))
            }
        })
        return ["All", ...Array.from(cats)].slice(0, 20)
    }, [rawData, colCategory])

    const processedData = useMemo(() => {
        let result = [...rawData]

        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase()
            result = result.filter((row) =>
                Object.values(row).some((val) =>
                    String(val).toLowerCase().includes(query)
                )
            )
        }

        if (colCategory && activeCategory !== "All") {
            result = result.filter(
                (row) => String(row[colCategory]) === activeCategory
            )
        }

        if (sort.key) {
            result.sort((a, b) => {
                const valA = a[sort.key]
                const valB = b[sort.key]
                if (typeof valA === "number" && typeof valB === "number") {
                    return sort.direction === "asc" ? valA - valB : valB - valA
                }
                const strA = String(valA || "").toLowerCase()
                const strB = String(valB || "").toLowerCase()
                if (strA < strB) return sort.direction === "asc" ? -1 : 1
                if (strA > strB) return sort.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return result
    }, [rawData, debouncedSearch, activeCategory, sort, colCategory])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return processedData.slice(start, start + PAGE_SIZE)
    }, [processedData, page])

    const metrics = useMemo(() => {
        if (!colValue || processedData.length === 0) return null
        let sum = 0
        let min = Infinity
        let max = -Infinity
        let validCount = 0

        processedData.forEach((row) => {
            const val = parseFloat(row[colValue])
            if (!isNaN(val)) {
                sum += val
                if (val < min) min = val
                if (val > max) max = val
                validCount++
            }
        })

        if (validCount === 0) return null
        return {
            sum,
            avg: sum / validCount,
            min,
            max,
            count: validCount,
        }
    }, [processedData, colValue])

    const exportToCSV = () => {
        const csv = Papa.unparse(processedData)
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `export_${new Date().getTime()}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleSort = (key) => {
        setSort((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === "desc" ? "asc" : "desc",
        }))
    }

    const formatValue = (val) => {
        if (typeof val === "number") {
            return new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2,
            }).format(val)
        }
        return String(val || "-")
    }

    const containerStyle = {
        width: "100%",
        height: "100%",
        minHeight: isCanvas ? 600 : "100vh",
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: theme.font,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    }

    const renderContentBody = () => {
        if (processedData.length === 0) {
            return (
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: theme.muted,
                    }}
                >
                    No results found.
                </div>
            )
        }

        if (view === "table") {
            return (
                <div style={{ flex: 1, overflow: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "left",
                            fontSize: 13,
                        }}
                    >
                        <thead
                            style={{
                                position: "sticky",
                                top: 0,
                                backgroundColor: theme.panel,
                                zIndex: 10,
                                boxShadow: `0 1px 0 ${theme.border}`,
                            }}
                        >
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        onClick={() => handleSort(col)}
                                        style={{
                                            padding: "12px 16px",
                                            fontWeight: 600,
                                            color: theme.muted,
                                            cursor: "pointer",
                                            userSelect: "none",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            {col}
                                            {sort.key === col && (
                                                <span
                                                    style={{
                                                        color: theme.primary,
                                                    }}
                                                >
                                                    {sort.direction === "asc"
                                                        ? "↑"
                                                        : "↓"}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((row, i) => (
                                <tr
                                    key={i}
                                    style={{
                                        borderBottom: `1px solid ${theme.border}`,
                                        backgroundColor: theme.bg,
                                    }}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col}
                                            style={{
                                                padding: "12px 16px",
                                                whiteSpace: "nowrap",
                                                maxWidth: 300,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {formatValue(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }

        return (
            <div
                style={{
                    flex: 1,
                    overflow: "auto",
                    padding: 24,
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                    alignContent: "start",
                }}
            >
                {paginatedData.map((row, i) => (
                    <div
                        key={i}
                        style={{
                            padding: 16,
                            border: `1px solid ${theme.border}`,
                            borderRadius: theme.radius,
                            backgroundColor: theme.bg,
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: 15,
                                marginBottom: 8,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {colTitle
                                ? row[colTitle]
                                : row[columns[0]] || "Untitled"}
                        </div>
                        {colCategory && row[colCategory] && (
                            <span
                                style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    background: `${theme.primary}20`,
                                    color: theme.primary,
                                    borderRadius: Math.max(theme.radius / 2, 4),
                                    fontSize: 11,
                                    marginBottom: 12,
                                }}
                            >
                                {String(row[colCategory])}
                            </span>
                        )}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                fontSize: 13,
                            }}
                        >
                            {colValue && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span style={{ color: theme.muted }}>
                                        {colValue}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>
                                        {formatValue(row[colValue])}
                                    </span>
                                </div>
                            )}
                            {colDate && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span style={{ color: theme.muted }}>
                                        {colDate}
                                    </span>
                                    <span>{String(row[colDate] || "-")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <AnimatePresence mode="wait">
                {!dataSource ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: isCanvas ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 24,
                            backgroundColor: theme.bg,
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                maxWidth: maxWidth,
                                height: "100%",
                                border: `2px dashed ${theme.border}`,
                                borderRadius: theme.radius,
                                backgroundColor: theme.panel,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 40,
                                textAlign: "center",
                            }}
                        >
                            {/* Visual Placeholder for Canvas */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    marginBottom: 24,
                                    opacity: 0.5,
                                }}
                            >
                                <div
                                    style={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: theme.radius,
                                        backgroundColor: theme.border,
                                    }}
                                />
                                <div
                                    style={{
                                        width: 120,
                                        height: 60,
                                        borderRadius: theme.radius,
                                        backgroundColor: theme.border,
                                    }}
                                />
                                <div
                                    style={{
                                        width: 120,
                                        height: 60,
                                        borderRadius: theme.radius,
                                        backgroundColor: theme.border,
                                    }}
                                />
                            </div>
                            <h3
                                style={{
                                    margin: "0 0 8px 0",
                                    color: theme.text,
                                }}
                            >
                                Data Visualise Pro
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    color: theme.muted,
                                    fontSize: 14,
                                    maxWidth: 300,
                                }}
                            >
                                Connect a CSV or Excel data source in the
                                properties panel to render the dashboard.
                            </p>
                        </div>
                    </motion.div>
                ) : isParsing ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: isCanvas ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div style={{ textAlign: "center" }}>
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    border: `4px solid ${theme.border}`,
                                    borderTopColor: theme.primary,
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                    margin: "0 auto 16px",
                                }}
                            />
                            <p
                                style={{
                                    margin: 0,
                                    color: theme.muted,
                                    fontWeight: 500,
                                }}
                            >
                                Processing Dataset...
                            </p>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: isCanvas ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 24,
                        }}
                    >
                        <div
                            style={{
                                textAlign: "center",
                                color: "#EF4444",
                                backgroundColor: theme.panel,
                                padding: 32,
                                borderRadius: theme.radius,
                                border: `1px solid #FECACA`,
                            }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 12 }}>
                                ⚠️
                            </div>
                            <p style={{ fontWeight: 600, margin: 0 }}>
                                {error}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: isCanvas ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            width: "100%",
                            maxWidth: maxWidth,
                            margin: "0 auto",
                        }}
                    >
                        {/* TOOLBAR */}
                        <div
                            style={{
                                padding: "20px 24px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 16,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: theme.radius / 2,
                                            backgroundColor: logoImage?.src
                                                ? "transparent"
                                                : `${theme.primary}20`,
                                            color: theme.primary,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {logoImage?.src ? (
                                            <img
                                                src={logoImage.src}
                                                srcSet={logoImage.srcSet}
                                                alt={logoImage.alt || "Logo"}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        ) : (
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                                <line
                                                    x1="12"
                                                    y1="22.08"
                                                    x2="12"
                                                    y2="12"
                                                />
                                            </svg>
                                        )}
                                    </div>

                                    <h1
                                        style={{
                                            margin: 0,
                                            fontSize: 16,
                                            fontWeight: 600,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            maxWidth: 250,
                                        }}
                                    >
                                        {datasetTitle ||
                                            fileMeta?.name ||
                                            "Dataset"}
                                    </h1>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 12,
                                }}
                            >
                                {/* Search Input */}
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        style={{
                                            padding: "8px 12px 8px 36px",
                                            borderRadius: theme.radius,
                                            border: `1px solid ${theme.border}`,
                                            background: theme.panel,
                                            color: theme.text,
                                            fontSize: 13,
                                            outline: "none",
                                            width: 200,
                                            fontFamily: "inherit",
                                            transition: "border-color 0.2s",
                                        }}
                                        onFocus={(e) =>
                                            (e.target.style.borderColor =
                                                theme.primary)
                                        }
                                        onBlur={(e) =>
                                            (e.target.style.borderColor =
                                                theme.border)
                                        }
                                    />
                                    <svg
                                        style={{
                                            position: "absolute",
                                            left: 12,
                                            top: 10,
                                            color: theme.muted,
                                        }}
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <line
                                            x1="21"
                                            y1="21"
                                            x2="16.65"
                                            y2="16.65"
                                        />
                                    </svg>
                                </div>

                                {/* Sorting Controls */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        background: theme.panel,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: theme.radius,
                                        overflow: "hidden",
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: "8px 0 8px 12px",
                                            color: theme.muted,
                                            fontSize: 13,
                                            whiteSpace: "nowrap",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Sort by:
                                    </span>
                                    <select
                                        value={sort.key}
                                        onChange={(e) =>
                                            setSort((prev) => ({
                                                ...prev,
                                                key: e.target.value,
                                            }))
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            border: "none",
                                            background: "transparent",
                                            color: theme.text,
                                            fontSize: 13,
                                            outline: "none",
                                            cursor: "pointer",
                                            fontFamily: "inherit",
                                            maxWidth: 140,
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        <option value="" disabled>
                                            Select column...
                                        </option>
                                        {columns.map((col) => (
                                            <option key={col} value={col}>
                                                {col}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() =>
                                            setSort((prev) => ({
                                                ...prev,
                                                direction:
                                                    prev.direction === "asc"
                                                        ? "desc"
                                                        : "asc",
                                            }))
                                        }
                                        style={{
                                            padding: "8px 12px",
                                            background: theme.hover,
                                            border: "none",
                                            borderLeft: `1px solid ${theme.border}`,
                                            cursor: "pointer",
                                            color: theme.text,
                                            fontSize: 13,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            fontFamily: "inherit",
                                            whiteSpace: "nowrap",
                                        }}
                                        title="Toggle Sort Direction"
                                    >
                                        {sort.direction === "asc"
                                            ? "Ascending ↑"
                                            : "Descending ↓"}
                                    </button>
                                </div>

                                {/* View Toggles */}
                                <div
                                    style={{
                                        display: "flex",
                                        background: theme.panel,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: theme.radius,
                                        overflow: "hidden",
                                    }}
                                >
                                    <button
                                        onClick={() => setView("table")}
                                        style={{
                                            padding: "8px 12px",
                                            background:
                                                view === "table"
                                                    ? theme.primary
                                                    : "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            color:
                                                view === "table"
                                                    ? "#fff"
                                                    : theme.muted,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                x="3"
                                                y="3"
                                                width="18"
                                                height="18"
                                                rx="2"
                                                ry="2"
                                            />
                                            <line
                                                x1="3"
                                                y1="9"
                                                x2="21"
                                                y2="9"
                                            />
                                            <line
                                                x1="3"
                                                y1="15"
                                                x2="21"
                                                y2="15"
                                            />
                                            <line
                                                x1="9"
                                                y1="9"
                                                x2="9"
                                                y2="21"
                                            />
                                            <line
                                                x1="15"
                                                y1="9"
                                                x2="15"
                                                y2="21"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setView("grid")}
                                        style={{
                                            padding: "8px 12px",
                                            background:
                                                view === "grid"
                                                    ? theme.primary
                                                    : "transparent",
                                            border: "none",
                                            borderLeft:
                                                view === "grid"
                                                    ? "none"
                                                    : `1px solid ${theme.border}`,
                                            cursor: "pointer",
                                            color:
                                                view === "grid"
                                                    ? "#fff"
                                                    : theme.muted,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                x="3"
                                                y="3"
                                                width="7"
                                                height="7"
                                            />
                                            <rect
                                                x="14"
                                                y="3"
                                                width="7"
                                                height="7"
                                            />
                                            <rect
                                                x="14"
                                                y="14"
                                                width="7"
                                                height="7"
                                            />
                                            <rect
                                                x="3"
                                                y="14"
                                                width="7"
                                                height="7"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Export Button */}
                                <button
                                    onClick={exportToCSV}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: theme.radius,
                                        border: `1px solid ${theme.primary}`,
                                        background: theme.panel,
                                        color: theme.primary,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontFamily: "inherit",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background =
                                            theme.primary
                                        e.target.style.color = "#fff"
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = theme.panel
                                        e.target.style.color = theme.primary
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* DASHBOARD BODY */}
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                                padding: "0 24px 24px 24px",
                            }}
                        >
                            {metrics && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 16,
                                        marginBottom: 24,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <MetricCard
                                        theme={theme}
                                        label="Total Records"
                                        value={processedData.length}
                                    />
                                    <MetricCard
                                        theme={theme}
                                        label={`Sum of ${colValue}`}
                                        value={metrics.sum}
                                        isNumber
                                    />
                                    <MetricCard
                                        theme={theme}
                                        label={`Avg ${colValue}`}
                                        value={metrics.avg}
                                        isNumber
                                    />
                                    <MetricCard
                                        theme={theme}
                                        label={`Max ${colValue}`}
                                        value={metrics.max}
                                        isNumber
                                    />
                                </div>
                            )}

                            {categories.length > 1 && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginBottom: 24,
                                        overflowX: "auto",
                                        paddingBottom: 8,
                                    }}
                                >
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() =>
                                                setActiveCategory(cat)
                                            }
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: 99,
                                                border: `1px solid ${activeCategory === cat ? theme.primary : theme.border}`,
                                                background:
                                                    activeCategory === cat
                                                        ? theme.primary
                                                        : theme.panel,
                                                color:
                                                    activeCategory === cat
                                                        ? "#fff"
                                                        : theme.text,
                                                fontSize: 13,
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                                transition: "all 0.2s",
                                                fontFamily: "inherit",
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.panel,
                                    borderRadius: theme.radius,
                                    border: `1px solid ${theme.border}`,
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {renderContentBody()}

                                {processedData.length > PAGE_SIZE && (
                                    <div
                                        style={{
                                            padding: "12px 24px",
                                            borderTop: `1px solid ${theme.border}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            fontSize: 13,
                                            backgroundColor: theme.bg,
                                        }}
                                    >
                                        <span style={{ color: theme.muted }}>
                                            Showing {(page - 1) * PAGE_SIZE + 1}{" "}
                                            -{" "}
                                            {Math.min(
                                                page * PAGE_SIZE,
                                                processedData.length
                                            )}{" "}
                                            of {processedData.length}
                                        </span>
                                        <div
                                            style={{ display: "flex", gap: 8 }}
                                        >
                                            <button
                                                disabled={page === 1}
                                                onClick={() =>
                                                    setPage((p) => p - 1)
                                                }
                                                style={{
                                                    padding: "6px 12px",
                                                    border: `1px solid ${theme.border}`,
                                                    borderRadius: Math.max(
                                                        theme.radius / 2,
                                                        4
                                                    ),
                                                    background: theme.panel,
                                                    color: theme.text,
                                                    cursor:
                                                        page === 1
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    opacity:
                                                        page === 1 ? 0.5 : 1,
                                                    fontFamily: "inherit",
                                                }}
                                            >
                                                Prev
                                            </button>
                                            <button
                                                disabled={
                                                    page * PAGE_SIZE >=
                                                    processedData.length
                                                }
                                                onClick={() =>
                                                    setPage((p) => p + 1)
                                                }
                                                style={{
                                                    padding: "6px 12px",
                                                    border: `1px solid ${theme.border}`,
                                                    borderRadius: Math.max(
                                                        theme.radius / 2,
                                                        4
                                                    ),
                                                    background: theme.panel,
                                                    color: theme.text,
                                                    cursor:
                                                        page * PAGE_SIZE >=
                                                        processedData.length
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    opacity:
                                                        page * PAGE_SIZE >=
                                                        processedData.length
                                                            ? 0.5
                                                            : 1,
                                                    fontFamily: "inherit",
                                                }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function MetricCard({ theme, label, value, isNumber }) {
    const formatted = isNumber
        ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
              value
          )
        : value
    return (
        <div
            style={{
                flex: 1,
                minWidth: 160,
                padding: "16px 20px",
                backgroundColor: theme.panel,
                borderRadius: theme.radius,
                border: `1px solid ${theme.border}`,
            }}
        >
            <div
                style={{
                    fontSize: 13,
                    color: theme.muted,
                    marginBottom: 4,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.accent }}>
                {formatted}
            </div>
        </div>
    )
}

addPropertyControls(DataVisualisePro, {
    dataSource: {
        type: ControlType.File,
        title: "Data File",
        allowedFileTypes: ["csv", "xlsx", "xls"],
    },
    datasetTitle: {
        type: ControlType.String,
        title: "Dataset Title",
        defaultValue: "My Enterprise Dataset",
        description: "Overrides the default file name.",
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1400,
        min: 600,
        max: 3000,
        step: 50,
        displayStepper: true,
    },
    colTitle: {
        type: ControlType.String,
        title: "Title Column",
        description: "Exact column name. Populates the Grid View card title.",
    },
    colValue: {
        type: ControlType.String,
        title: "Value Column",
        description: "Numeric column for the Grid View & top Metric Cards.",
    },
    colCategory: {
        type: ControlType.String,
        title: "Category Column",
        description: "Column to generate filtering pills and Grid tags.",
    },
    colDate: {
        type: ControlType.String,
        title: "Date Column",
        description: "Date column used exclusively for Grid View layouts.",
    },
    customFont: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: "Inter",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#3B82F6",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#10B981",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F4F4F5",
    },
    panelColor: {
        type: ControlType.Color,
        title: "Panel Base",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#18181B",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
    },
    darkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        defaultValue: false,
    },
})
