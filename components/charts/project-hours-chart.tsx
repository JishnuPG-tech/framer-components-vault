// Chart displaying hours worked divided into 4 projects with comparison to last month
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties } from "react"

interface ProjectData {
    name: string
    currentHours: number
    lastMonthHours: number
    color: string
}

// Theme definitions
interface Theme {
    backgroundColor: string
    cardBackground: string
    textColor: string
    secondaryTextColor: string
    borderColor: string
    positiveColor: string
    negativeColor: string
}

const themes: Record<string, Theme> = {
    light: {
        backgroundColor: "#F5F5F5",
        cardBackground: "#FFFFFF",
        textColor: "#000000",
        secondaryTextColor: "#666666",
        borderColor: "#EEEEEE",
        positiveColor: "#22CC66",
        negativeColor: "#FF5588",
    },
    dark: {
        backgroundColor: "#1A1A1A",
        cardBackground: "#2A2A2A",
        textColor: "#FFFFFF",
        secondaryTextColor: "#CCCCCC",
        borderColor: "#404040",
        positiveColor: "#4ADE80",
        negativeColor: "#F87171",
    },
    blue: {
        backgroundColor: "#EBF8FF",
        cardBackground: "#FFFFFF",
        textColor: "#1A365D",
        secondaryTextColor: "#4A5568",
        borderColor: "#BEE3F8",
        positiveColor: "#38A169",
        negativeColor: "#E53E3E",
    },
    green: {
        backgroundColor: "#F0FDF4",
        cardBackground: "#FFFFFF",
        textColor: "#14532D",
        secondaryTextColor: "#374151",
        borderColor: "#BBF7D0",
        positiveColor: "#059669",
        negativeColor: "#DC2626",
    },
}

interface ProjectHoursChartProps {
    projects: ProjectData[]
    title: string
    titleFont: any
    labelFont: any
    themeMode: "preset" | "custom"
    presetTheme: keyof typeof themes
    backgroundColor: string
    cardBackground: string
    textColor: string
    secondaryTextColor: string
    borderColor: string
    positiveColor: string
    negativeColor: string
    borderRadius: number
    showComparison: boolean
    showTotalLastMonth: boolean
    showLegend: boolean
    showTotalHours: boolean
    style?: CSSProperties
}

/**
 * Project Hours Chart
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 *  @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ProjectHoursChart(props: ProjectHoursChartProps) {
    const {
        projects = [
            {
                name: "Project Alpha",
                currentHours: 45,
                lastMonthHours: 38,
                color: "#0099FF",
            },
            {
                name: "Project Beta",
                currentHours: 32,
                lastMonthHours: 41,
                color: "#8855FF",
            },
            {
                name: "Project Gamma",
                currentHours: 28,
                lastMonthHours: 25,
                color: "#22CC66",
            },
            {
                name: "Project Delta",
                currentHours: 19,
                lastMonthHours: 22,
                color: "#FF5588",
            },
        ],
        title = "Hours Worked This Month",
        titleFont,
        labelFont,
        themeMode = "preset",
        presetTheme = "light",
        backgroundColor: customBackgroundColor = "#F5F5F5",
        cardBackground: customCardBackground = "#FFFFFF",
        textColor: customTextColor = "#000000",
        secondaryTextColor: customSecondaryTextColor = "#666666",
        borderColor: customBorderColor = "#EEEEEE",
        positiveColor: customPositiveColor = "#22CC66",
        negativeColor: customNegativeColor = "#FF5588",
        borderRadius = 12,
        showComparison = true,
        showTotalLastMonth = true,
        showLegend = true,
        showTotalHours = true,
        style,
    } = props

    // Get current theme colors
    const currentTheme = useMemo(() => {
        if (themeMode === "preset") {
            return themes[presetTheme]
        }
        return {
            backgroundColor: customBackgroundColor,
            cardBackground: customCardBackground,
            textColor: customTextColor,
            secondaryTextColor: customSecondaryTextColor,
            borderColor: customBorderColor,
            positiveColor: customPositiveColor,
            negativeColor: customNegativeColor,
        }
    }, [
        themeMode,
        presetTheme,
        customBackgroundColor,
        customCardBackground,
        customTextColor,
        customSecondaryTextColor,
        customBorderColor,
        customPositiveColor,
        customNegativeColor,
    ])

    const {
        maxHours,
        totalCurrentHours,
        totalLastMonthHours,
        percentageChange,
    } = useMemo(() => {
        const allHours = projects.flatMap((p) => [
            p.currentHours,
            p.lastMonthHours,
        ])
        const maxHours = Math.max(...allHours, 50)
        const totalCurrentHours = projects.reduce(
            (sum, p) => sum + p.currentHours,
            0
        )
        const totalLastMonthHours = projects.reduce(
            (sum, p) => sum + p.lastMonthHours,
            0
        )
        const percentageChange =
            totalLastMonthHours === 0
                ? 0
                : ((totalCurrentHours - totalLastMonthHours) /
                      totalLastMonthHours) *
                  100

        return {
            maxHours,
            totalCurrentHours,
            totalLastMonthHours,
            percentageChange,
        }
    }, [projects])

    const containerStyle: CSSProperties = {
        ...style,
        width: "100%",
        height: "100%",
        backgroundColor: currentTheme.backgroundColor,
        borderRadius,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflow: "hidden",
    }

    const cardStyle: CSSProperties = {
        backgroundColor: currentTheme.cardBackground,
        borderRadius: borderRadius - 4,
        padding: 16,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: Math.max(8, 48 / projects.length),
    }

    const renderHeader = () => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            <div>
                <h2
                    style={{
                        margin: 0,
                        color: currentTheme.textColor,
                        ...titleFont,
                    }}
                >
                    {title}
                </h2>
            </div>
            {showTotalHours && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                color: currentTheme.textColor,
                                ...labelFont,
                            }}
                        >
                            {totalCurrentHours}h
                        </span>
                        {showComparison && (
                            <span
                                style={{
                                    fontSize: "14px",
                                    color:
                                        percentageChange >= 0
                                            ? currentTheme.positiveColor
                                            : currentTheme.negativeColor,
                                    fontWeight: "500",
                                    ...labelFont,
                                }}
                            >
                                {percentageChange >= 0 ? "+" : ""}
                                {percentageChange.toFixed(1)}%
                            </span>
                        )}
                    </div>
                    {showTotalLastMonth && (
                        <span
                            style={{
                                fontSize: "14px",
                                color: currentTheme.secondaryTextColor,
                                textAlign: "right",
                                whiteSpace: "nowrap",
                                ...labelFont,
                            }}
                        >
                            Last month: {totalLastMonthHours}h
                        </span>
                    )}
                </div>
            )}
        </div>
    )

    const renderProject = (project: ProjectData, index: number) => {
        const currentPercentage = (project.currentHours / maxHours) * 100
        const lastMonthPercentage = showComparison
            ? (project.lastMonthHours / maxHours) * 100
            : 0
        const projectChange =
            showComparison && project.lastMonthHours > 0
                ? ((project.currentHours - project.lastMonthHours) /
                      project.lastMonthHours) *
                  100
                : 0

        return (
            <div
                key={index}
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            color: currentTheme.textColor,
                            fontWeight: "500",
                            ...labelFont,
                        }}
                    >
                        {project.name}
                    </span>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <span
                            style={{
                                color: currentTheme.textColor,
                                fontWeight: "600",
                                ...labelFont,
                            }}
                        >
                            {project.currentHours}h
                        </span>
                        {showComparison && (
                            <span
                                style={{
                                    fontSize: "12px",
                                    color:
                                        projectChange >= 0
                                            ? currentTheme.positiveColor
                                            : currentTheme.negativeColor,
                                    fontWeight: "500",
                                    minWidth: "40px",
                                    textAlign: "right",
                                    ...labelFont,
                                }}
                            >
                                {projectChange >= 0 ? "+" : ""}
                                {projectChange.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ position: "relative", height: 8 }}>
                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backgroundColor: currentTheme.borderColor,
                            borderRadius: 4,
                        }}
                    />

                    {showComparison && (
                        <div
                            style={{
                                position: "absolute",
                                width: `${lastMonthPercentage}%`,
                                height: "100%",
                                backgroundColor: project.color,
                                opacity: 0.3,
                                borderRadius: 4,
                                transition: "width 0.3s ease",
                            }}
                        />
                    )}

                    <div
                        style={{
                            position: "absolute",
                            width: `${currentPercentage}%`,
                            height: "100%",
                            backgroundColor: project.color,
                            borderRadius: 4,
                            transition: "width 0.3s ease",
                        }}
                    />
                </div>
            </div>
        )
    }

    const renderLegend = () =>
        showComparison &&
        showLegend && (
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 8,
                    justifyContent: "center",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                        style={{
                            width: 12,
                            height: 4,
                            backgroundColor: currentTheme.secondaryTextColor,
                            borderRadius: 2,
                        }}
                    />
                    <span
                        style={{
                            fontSize: "12px",
                            color: currentTheme.secondaryTextColor,
                            ...labelFont,
                        }}
                    >
                        Last Month
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                        style={{
                            width: 12,
                            height: 4,
                            backgroundColor: currentTheme.textColor,
                            borderRadius: 2,
                        }}
                    />
                    <span
                        style={{
                            fontSize: "12px",
                            color: currentTheme.textColor,
                            ...labelFont,
                        }}
                    >
                        This Month
                    </span>
                </div>
            </div>
        )

    return (
        <div style={containerStyle}>
            {renderHeader()}
            <div style={cardStyle}>
                {projects.map(renderProject)}
                {renderLegend()}
            </div>
        </div>
    )
}

addPropertyControls(ProjectHoursChart, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Project Name",
                    defaultValue: "Project",
                },
                currentHours: {
                    type: ControlType.Number,
                    title: "Current Hours",
                    defaultValue: 30,
                    min: 0,
                    max: 200,
                    step: 0.1,
                },
                lastMonthHours: {
                    type: ControlType.Number,
                    title: "Last Month Hours",
                    defaultValue: 25,
                    min: 0,
                    max: 200,
                    step: 0.1,
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#0099FF",
                },
            },
        },
        defaultValue: [
            {
                name: "Project Alpha",
                currentHours: 45,
                lastMonthHours: 38,
                color: "#0099FF",
            },
            {
                name: "Project Beta",
                currentHours: 32,
                lastMonthHours: 41,
                color: "#8855FF",
            },
            {
                name: "Project Gamma",
                currentHours: 28,
                lastMonthHours: 25,
                color: "#22CC66",
            },
            {
                name: "Project Delta",
                currentHours: 19,
                lastMonthHours: 22,
                color: "#FF5588",
            },
        ],
        maxCount: 8,
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Hours Worked This Month",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    themeMode: {
        type: ControlType.Enum,
        title: "Theme Mode",
        options: ["preset", "custom"],
        optionTitles: ["Preset Theme", "Custom Colors"],
        defaultValue: "preset",
        displaySegmentedControl: true,
    },
    presetTheme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "blue", "green"],
        optionTitles: ["Light", "Dark", "Blue", "Green"],
        defaultValue: "light",
        displaySegmentedControl: true,
        hidden: ({ themeMode }) => themeMode !== "preset",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#F5F5F5",
        hidden: ({ themeMode }) => themeMode !== "custom",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
        hidden: ({ themeMode }) => themeMode !== "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        hidden: ({ themeMode }) => themeMode !== "custom",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "#666666",
        hidden: ({ themeMode }) => themeMode !== "custom",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#EEEEEE",
        hidden: ({ themeMode }) => themeMode !== "custom",
    },
    positiveColor: {
        type: ControlType.Color,
        title: "Positive Color",
        defaultValue: "#22CC66",
        hidden: ({ themeMode }) => themeMode !== "custom",
    },
    negativeColor: {
        type: ControlType.Color,
        title: "Negative Color",
        defaultValue: "#FF5588",
        hidden: ({ themeMode }) => themeMode !== "custom",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    showComparison: {
        type: ControlType.Boolean,
        title: "Show Comparison",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showTotalHours: {
        type: ControlType.Boolean,
        title: "Show Total Hours",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showTotalLastMonth: {
        type: ControlType.Boolean,
        title: "Show Total Last Month",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showTotalHours }) => !showTotalHours,
    },
    showLegend: {
        type: ControlType.Boolean,
        title: "Show Legend",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
