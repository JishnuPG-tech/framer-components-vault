/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 */

import * as React from "react"
import { useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface GitHubStatsProps {
    username: string
    color: string
    labelColor: string
    accentColor: string
    fontSize: number
    showFollowers: boolean
    showFollowing: boolean
    showRepos: boolean
    showStars: boolean
    gap: number
    fontFamily: React.CSSProperties
    backgroundColor: string
    borderRadius: number
}

function GitHubStats(props: GitHubStatsProps) {
    const {
        username,
        color,
        labelColor,
        accentColor,
        fontSize,
        showFollowers,
        showFollowing,
        showRepos,
        showStars,
        gap,
        fontFamily,
        backgroundColor,
        borderRadius,
    } = props

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<{
        followers: number
        following: number
        public_repos: number
        total_stars: number
    } | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        const signal = controller.signal

        async function fetchStats() {
            if (!username) {
                setError("Username is required")
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)

            try {
                const userRes = await fetch(
                    `https://api.github.com/users/${username}`,
                    { signal }
                )
                if (!userRes.ok) {
                    if (userRes.status === 404) {
                        throw new Error("Invalid username")
                    } else if (userRes.status === 403) {
                        throw new Error("API rate limit exceeded")
                    } else {
                        throw new Error("Failed to fetch user data")
                    }
                }
                const userData = await userRes.json()

                let totalStars = 0
                if (showStars) {
                    // Fetch repos to sum stargazers_count
                    let page = 1
                    let keepFetching = true
                    while (keepFetching) {
                        const reposRes = await fetch(
                            `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`,
                            { signal }
                        )
                        if (reposRes.ok) {
                            const reposData = await reposRes.json()
                            if (reposData.length === 0) {
                                keepFetching = false
                            } else {
                                totalStars += reposData.reduce(
                                    (acc: number, curr: any) =>
                                        acc + curr.stargazers_count,
                                    0
                                )
                                if (reposData.length < 100) {
                                    keepFetching = false
                                } else {
                                    page++
                                    // limit to 5 pages (500 repos) to avoid aggressive rate limiting
                                    if (page > 5) keepFetching = false
                                }
                            }
                        } else {
                            keepFetching = false
                        }
                    }
                }

                setStats({
                    followers: userData.followers,
                    following: userData.following,
                    public_repos: userData.public_repos,
                    total_stars: totalStars,
                })
                setLoading(false)
            } catch (err: any) {
                if (err.name === "AbortError") {
                    return
                }
                setError(err.message || "An error occurred")
                setLoading(false)
            }
        }

        fetchStats()

        return () => {
            controller.abort()
        }
    }, [username, showStars])

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: (fontFamily?.fontFamily as string) || "monospace",
        backgroundColor: backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: "16px",
        boxSizing: "border-box",
    }

    const headerStyle: React.CSSProperties = {
        fontSize: fontSize * 1.2,
        fontWeight: "bold",
        marginBottom: "24px",
        color: accentColor,
    }

    const gridStyle: React.CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        gap: gap,
        width: "100%",
        justifyContent: "center",
        textAlign: "center",
    }

    const statBlockStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "80px",
    }

    const labelStyle: React.CSSProperties = {
        color: labelColor,
        fontSize: fontSize * 0.8,
        marginBottom: "8px",
        textTransform: "uppercase",
        letterSpacing: "1px",
    }

    const valueStyle: React.CSSProperties = {
        color: color,
        fontSize: fontSize * 1.5,
        fontWeight: "bold",
    }

    if (loading) {
        return (
            <div style={containerStyle}>
                <div
                    style={{
                        color: accentColor,
                        fontSize: fontSize,
                        opacity: 0.7,
                    }}
                >
                    Loading stats...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={containerStyle}>
                <div style={{ color: "#ff4444", fontSize: fontSize }}>
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>@{username}</div>
            <div style={gridStyle}>
                {showFollowers && (
                    <div style={statBlockStyle}>
                        <div style={labelStyle}>Followers</div>
                        <div style={valueStyle}>
                            {stats?.followers?.toLocaleString()}
                        </div>
                    </div>
                )}
                {showFollowing && (
                    <div style={statBlockStyle}>
                        <div style={labelStyle}>Following</div>
                        <div style={valueStyle}>
                            {stats?.following?.toLocaleString()}
                        </div>
                    </div>
                )}
                {showRepos && (
                    <div style={statBlockStyle}>
                        <div style={labelStyle}>Repos</div>
                        <div style={valueStyle}>
                            {stats?.public_repos?.toLocaleString()}
                        </div>
                    </div>
                )}
                {showStars && (
                    <div style={statBlockStyle}>
                        <div style={labelStyle}>Stars</div>
                        <div style={valueStyle}>
                            {stats?.total_stars?.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

GitHubStats.defaultProps = {
    username: "github",
    color: "#e8e8f0",
    labelColor: "#44445a",
    accentColor: "#5c5cf0",
    fontSize: 14,
    showFollowers: true,
    showFollowing: true,
    showRepos: true,
    showStars: true,
    gap: 24,
    fontFamily: {
        fontFamily: "monospace",
    },
    backgroundColor: "#0d0d12",
    borderRadius: 12,
}

addPropertyControls(GitHubStats, {
    username: {
        type: ControlType.String,
        title: "Username",
        defaultValue: "github",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#e8e8f0",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#44445a",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#5c5cf0",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 8,
        max: 64,
        displayStepper: true,
        defaultValue: 14,
    },
    showFollowers: {
        type: ControlType.Boolean,
        title: "Followers",
        defaultValue: true,
    },
    showFollowing: {
        type: ControlType.Boolean,
        title: "Following",
        defaultValue: true,
    },
    showRepos: {
        type: ControlType.Boolean,
        title: "Repos",
        defaultValue: true,
    },
    showStars: {
        type: ControlType.Boolean,
        title: "Stars",
        defaultValue: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 24,
        displayStepper: true,
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0d0d12",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
    },
})

//@framerDisableUnlink
export default GitHubStats
