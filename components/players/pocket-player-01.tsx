// First-generation IPodPlayer (2001) music player interface with API integration
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
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


interface Track {
    id: string
    url: string
    title: string
    artist?: string
    album?: string
    lyricOffset?: number
}

// 歌词行接口（供将来使用）
// @ts-ignore - 供将来使用
interface LyricLine {
    words: string
    startTimeMs: string
}

interface IPodPlayerProps {
    theme: "classic" | "black" | "u2"
    youtubeUrl: string
    textShadow: boolean
    font: any
    style?: CSSProperties
    ownerName?: string // iPod 所有者名称（用于开机动画）
    size?: "default" | "medium" | "large" // iPod 尺寸选项
}

/**
 * First Generation IPodPlayer Music Player
 *
 * @framerIntrinsicWidth 250
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function IPodPlayer(props: IPodPlayerProps) {
    const {
        theme = "classic",
        youtubeUrl = "",
        textShadow = false,
        font,
        ownerName = "Zihan",
        size = "default",
    } = props

    // State management
    const [tracks, setTracks] = useState<Track[]>([])
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentMenu, setCurrentMenu] = useState<string[]>([
        "main",
        "music",
        "allsongs",
    ])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [backlight, setBacklight] = useState(false)
    const [backlightAutoEnabled, setBacklightAutoEnabled] = useState(false) // 跟踪自动背光是否启用（开机动画完成前保持关闭）
    const [lcdFilter, setLcdFilter] = useState(true)
    const [shuffle, setShuffle] = useState(false)
    const [repeat, setRepeat] = useState<"off" | "one" | "all">("off")
    const [showLyrics, setShowLyrics] = useState(false)
    const [_lyrics, _setLyrics] = useState<string>("")
    const [_statusMessage, _setStatusMessage] = useState("")
    const [_isLoading, _setIsLoading] = useState(false)
    const [_addSongUrl, _setAddSongUrl] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [playerReady, setPlayerReady] = useState(false)
    const [duration, setDuration] = useState(0)
    const [showVideo, setShowVideo] = useState(false)
    const [apiReady, setApiReady] = useState(false)
    const [forcePlayTrack, setForcePlayTrack] = useState(0)
    const [shouldAutoPlay, setShouldAutoPlay] = useState(false) // 标记是否需要自动播放
    const [batteryLevel, setBatteryLevel] = useState(1)

    const scrollRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false) // 鼠标是否进入组件
    const [bootAnimationComplete, setBootAnimationComplete] = useState(false) // 开机动画是否完成
    // @ts-ignore - 供将来使用
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const wheelRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<any>(null)
    const progressIntervalRef = useRef<number | null>(null)
    const isDraggingRef = useRef<boolean>(false)
    const lastAngleRef = useRef<number>(0)
    const backlightTimeoutRef = useRef<number | null>(null)
    const shouldAutoPlayRef = useRef<boolean>(false) // 使用 ref 来跟踪是否需要自动播放

    // Get current track
    const currentTrack = tracks[currentTrackIndex]

    // Auto-backlight: turn off after 30 seconds of inactivity
    const resetBacklightTimer = useCallback(() => {
        // 只有在自动背光启用时才自动开启
        if (backlightAutoEnabled) {
            // Turn on backlight
            if (!backlight) {
                startTransition(() => setBacklight(true))
            }

            // Clear existing timeout
            if (backlightTimeoutRef.current) {
                clearTimeout(backlightTimeoutRef.current)
            }

            // Set new timeout to turn off backlight after 30 seconds
            backlightTimeoutRef.current = window.setTimeout(() => {
                startTransition(() => setBacklight(false))
            }, 30000) // 30 seconds
        }
    }, [backlight, backlightAutoEnabled])

    // Theme colors（供将来使用）
    // @ts-ignore - 供将来使用
    const themeColors = useMemo(() => {
        switch (theme) {
            case "black":
                return {
                    device: "rgba(0, 0, 0, 0.85)",
                    wheel: "rgba(38, 38, 38, 0.5)",
                    centerButton: "rgba(0, 0, 0, 0.6)",
                }
            case "u2":
                return {
                    device: "rgba(0, 0, 0, 0.85)",
                    wheel: "rgba(185, 28, 28, 0.6)",
                    centerButton: "rgba(0, 0, 0, 0.6)",
                }
            default:
                return {
                    device: "rgba(255, 255, 255, 0.85)",
                    wheel: "rgba(209, 213, 219, 0.6)",
                    centerButton: "rgba(255, 255, 255, 0.6)",
                }
        }
    }, [theme])

    // 菜单键与菜单项类型
    type MenuKey =
        | "main"
        | "music"
        | "settings"
        | "allsongs"
        | "artists"
        | "albums"
        | "nowplaying"
        | `artist-${string}` // 动态艺术家页面
    interface MenuItem {
        label: string
        action: () => void
    }

    // Navigation helper
    const navigateTo = useCallback((path: string[]) => {
        startTransition(() => {
            setCurrentMenu(path)
            setSelectedIndex(0)
        })
    }, [])

    // Play track helper - 从列表选择时自动播放
    const playTrack = useCallback((index: number) => {
        shouldAutoPlayRef.current = true // 使用 ref 标记需要自动播放
        startTransition(() => {
            setCurrentTrackIndex(index)
            setIsPlaying(true) // 设置为播放状态
            setShouldAutoPlay(true) // 标记需要自动播放（用于 UI 显示）
            setCurrentMenu(["nowplaying"])
            setForcePlayTrack((prev) => prev + 1)
        })
    }, [])

    // Shuffle Songs - 随机播放所有歌曲
    const handleShuffleSongs = useCallback(() => {
        if (tracks.length === 0) return

        // 创建打乱后的索引数组
        const shuffledIndices = tracks.map((_, idx) => idx)
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffledIndices[i], shuffledIndices[j]] = [
                shuffledIndices[j],
                shuffledIndices[i],
            ]
        }

        // 设置 shuffle 状态并开始播放
        startTransition(() => {
            setShuffle(true)
            // 注意：这里我们只是设置状态，实际的随机播放逻辑在 handleNext 中处理
            // 随机选择一个起始索引
            const randomIndex = Math.floor(Math.random() * tracks.length)
            setCurrentTrackIndex(randomIndex)
            shouldAutoPlayRef.current = true // 使用 ref 标记需要自动播放
            setIsPlaying(true)
            setShouldAutoPlay(true) // 标记需要自动播放（用于 UI 显示）
            setCurrentMenu(["nowplaying"])
            setForcePlayTrack((prev) => prev + 1)
        })
    }, [tracks.length])

    // 提取艺术家列表
    const artistsList = useMemo(() => {
        const artistsSet = new Set<string>()
        tracks.forEach((track) => {
            if (track.artist && track.artist.trim()) {
                artistsSet.add(track.artist.trim())
            }
        })
        return Array.from(artistsSet).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
        )
    }, [tracks])

    // 按艺术家分组歌曲
    const tracksByArtist = useMemo(() => {
        const grouped: Record<string, { track: Track; index: number }[]> = {}
        tracks.forEach((track, index) => {
            const artist = track.artist?.trim() || "Unknown Artist"
            if (!grouped[artist]) {
                grouped[artist] = []
            }
            grouped[artist].push({ track, index })
        })
        return grouped
    }, [tracks])

    // Extract YouTube video ID from URL
    const extractVideoId = useCallback((url: string): string | null => {
        const trimmedUrl = url.trim()

        // Match youtube.com/watch?v=ID
        const watchMatch = trimmedUrl.match(
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
        )
        if (watchMatch) return watchMatch[1]

        // Match youtu.be/ID
        const shortMatch = trimmedUrl.match(
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/
        )
        if (shortMatch) return shortMatch[1]

        // Check if it's already just an ID (11 characters)
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl)) return trimmedUrl

        return null
    }, [])

    // Parse YouTube URLs and update tracks
    useEffect(() => {
        if (!youtubeUrl || youtubeUrl.trim() === "") {
            // Set default tracks if no URL provided
            startTransition(() => {
                setTracks([
                    {
                        id: "dQw4w9WgXcQ",
                        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        title: "Never Gonna Give You Up",
                        artist: "Rick Astley",
                        album: "Whenever You Need Somebody",
                    },
                    {
                        id: "9bZkp7q19f0",
                        url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
                        title: "Gangnam Style",
                        artist: "PSY",
                    },
                    {
                        id: "kJQP7kiw5Fk",
                        url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
                        title: "Despacito",
                        artist: "Luis Fonsi",
                    },
                ])
            })
            return
        }

        const urls = youtubeUrl
            .split(",")
            .map((u) => u.trim())
            .filter((u) => u.length > 0)
        const newTracks: Track[] = []

        urls.forEach((url) => {
            const videoId = extractVideoId(url)
            if (videoId) {
                newTracks.push({
                    id: videoId,
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    title: `Loading...`,
                    artist: "YouTube",
                })
            }
        })

        if (newTracks.length > 0) {
            startTransition(() => {
                setTracks(newTracks)
                setCurrentTrackIndex(0)
            })

            // Fetch real titles from YouTube oEmbed API
            newTracks.forEach(async (track, index) => {
                try {
                    const response = await fetch(
                        `https://www.youtube.com/oembed?url=${encodeURIComponent(track.url)}&format=json`
                    )
                    if (response.ok) {
                        const data = await response.json()
                        startTransition(() => {
                            setTracks((prevTracks) => {
                                const updatedTracks = [...prevTracks]
                                if (updatedTracks[index]) {
                                    updatedTracks[index] = {
                                        ...updatedTracks[index],
                                        title: data.title || track.title,
                                        artist: data.author_name || "YouTube",
                                    }
                                }
                                return updatedTracks
                            })
                        })
                    }
                } catch (error) {
                    console.error("Failed to fetch YouTube title:", error)
                }
            })
        }
    }, [youtubeUrl, extractVideoId])

    // Load YouTube IFrame API
    useEffect(() => {
        if (typeof window === "undefined") return

        // Check if API is already loaded
        if ((window as any).YT && (window as any).YT.Player) {
            startTransition(() => setApiReady(true))
            return
        }

        // Load the IFrame Player API code asynchronously
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

        // API will call this function when ready
        ;(window as any).onYouTubeIframeAPIReady = () => {
            console.log("YouTube IFrame API Ready")
            startTransition(() => setApiReady(true))
        }
    }, [])

    // Initialize YouTube player when track changes
    useEffect(() => {
        if (typeof window === "undefined" || !currentTrack || !apiReady) return

        const initPlayer = () => {
            if (!(window as any).YT || !(window as any).YT.Player) {
                return
            }

            // Destroy existing player
            if (playerRef.current) {
                try {
                    playerRef.current.destroy()
                } catch (error) {
                    // Ignore errors when destroying player (DOM might be already removed)
                    console.log("Player destroy error (safe to ignore):", error)
                }
                playerRef.current = null
            }

            // Create new player
            playerRef.current = new (window as any).YT.Player(
                `youtube-player-${currentTrack.id}`,
                {
                    videoId: currentTrack.id,
                    playerVars: {
                        autoplay: 0, // 不自动播放，需要用户手动点击播放
                        controls: 0,
                        modestbranding: 1,
                        showinfo: 0,
                        rel: 0,
                        iv_load_policy: 3,
                        fs: 0,
                        disablekb: 1,
                    },
                    events: {
                        onReady: (event: any) => {
                            console.log("Player ready for:", currentTrack.id)
                            const duration = event.target.getDuration()
                            startTransition(() => {
                                setDuration(duration)
                                setPlayerReady(true)
                            })
                            // 如果需要自动播放（从列表选择或切换歌曲），则自动播放
                            // 使用 ref 来获取最新的值，避免闭包问题
                            if (shouldAutoPlayRef.current) {
                                console.log(
                                    "Auto playing track:",
                                    currentTrack.id
                                )
                                event.target.playVideo()
                                shouldAutoPlayRef.current = false // 重置标记
                                startTransition(() => setShouldAutoPlay(false)) // 同步 UI 状态
                            }
                        },
                        onStateChange: (event: any) => {
                            console.log("Player state changed:", event.data)
                            // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
                            if (event.data === 1) {
                                // Playing
                                startTransition(() => {
                                    setIsPlaying(true)
                                })
                                startProgressTracking()
                            } else if (event.data === 2) {
                                // Paused
                                startTransition(() => setIsPlaying(false))
                                stopProgressTracking()
                            } else if (event.data === 0) {
                                // Video ended
                                handleNext()
                            } else if (event.data === 3) {
                                // Buffering - keep playerReady true if it was already true
                                // This prevents the loading screen from reappearing during buffering
                            }
                        },
                    },
                }
            )
        }

        // 注意：不重置 shouldAutoPlayRef，因为我们需要保留自动播放标记直到播放器准备好
        startTransition(() => {
            setPlayerReady(false)
            setShowVideo(false)
            setCurrentTime(0)
            setDuration(0)
        })

        // Small delay to ensure DOM element exists
        setTimeout(initPlayer, 50)

        return () => {
            stopProgressTracking()
        }
    }, [currentTrackIndex, currentTrack, apiReady, forcePlayTrack])

    // Start tracking progress
    const startProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
        }

        progressIntervalRef.current = window.setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime()
                startTransition(() => setCurrentTime(time))
            }
        }, 100) // Update every 100ms for smooth progress
    }, [])

    // Stop tracking progress
    const stopProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
        }
    }, [])

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            stopProgressTracking()
        }
    }, [stopProgressTracking])

    // Handle play/pause
    const togglePlayPause = useCallback(() => {
        if (playerRef.current) {
            if (playerReady) {
                // 播放器已准备好，可以播放/暂停
                if (isPlaying) {
                    playerRef.current.pauseVideo()
                    startTransition(() => setIsPlaying(false))
                } else {
                    playerRef.current.playVideo()
                    startTransition(() => setIsPlaying(true))
                }
            } else {
                // 播放器未准备好，等待播放器准备好后再播放
                // 这个情况不应该发生，因为用户需要等待播放器加载完成
                console.log("Player not ready yet")
            }
        }
    }, [isPlaying, playerReady])

    // Handle next track
    const handleNext = useCallback(() => {
        if (tracks.length === 0) return

        let nextIndex: number
        if (shuffle) {
            // 随机播放模式：随机选择下一首
            nextIndex = Math.floor(Math.random() * tracks.length)
            // 确保不重复当前歌曲（如果有多首歌曲）
            if (tracks.length > 1) {
                while (nextIndex === currentTrackIndex) {
                    nextIndex = Math.floor(Math.random() * tracks.length)
                }
            }
        } else {
            // 顺序播放模式
            nextIndex = currentTrackIndex + 1
            if (nextIndex >= tracks.length) {
                if (repeat === "all") {
                    nextIndex = 0
                } else {
                    return
                }
            }
        }

        shouldAutoPlayRef.current = true // 使用 ref 标记需要自动播放
        startTransition(() => {
            setCurrentTrackIndex(nextIndex)
            setIsPlaying(true) // 切换歌曲时自动播放
            setShouldAutoPlay(true) // 标记需要自动播放（用于 UI 显示）
        })
    }, [currentTrackIndex, tracks.length, repeat, shuffle])

    // Handle previous track
    const handlePrevious = useCallback(() => {
        if (tracks.length === 0) return

        let prevIndex: number
        if (shuffle) {
            // 随机播放模式：随机选择上一首
            prevIndex = Math.floor(Math.random() * tracks.length)
            // 确保不重复当前歌曲（如果有多首歌曲）
            if (tracks.length > 1) {
                while (prevIndex === currentTrackIndex) {
                    prevIndex = Math.floor(Math.random() * tracks.length)
                }
            }
        } else {
            // 顺序播放模式
            prevIndex = currentTrackIndex - 1
            if (prevIndex < 0) {
                if (repeat === "all") {
                    prevIndex = tracks.length - 1
                } else {
                    prevIndex = 0
                }
            }
        }

        shouldAutoPlayRef.current = true // 使用 ref 标记需要自动播放
        startTransition(() => {
            setCurrentTrackIndex(prevIndex)
            setIsPlaying(true) // 切换歌曲时自动播放
            setShouldAutoPlay(true) // 标记需要自动播放（用于 UI 显示）
        })
    }, [currentTrackIndex, tracks.length, repeat, shuffle])

    // Menu structure
    const menuStructure = useMemo<Record<MenuKey, MenuItem[]>>(() => {
        const structure: Record<string, MenuItem[]> = {
            main: [
                { label: "Music", action: () => navigateTo(["main", "music"]) },
                {
                    label: "Extras",
                    action: () => {
                        // 暂时无功能（占位）
                    },
                },
                {
                    label: "Settings",
                    action: () => navigateTo(["main", "settings"]),
                },
                {
                    label: "Shuffle Songs",
                    action: () => handleShuffleSongs(),
                },
                {
                    label: "Backlight",
                    action: () =>
                        startTransition(() => {
                            const newBacklight = !backlight
                            setBacklight(newBacklight)
                            // 如果用户手动关闭，禁用自动背光；如果手动开启，启用自动背光
                            setBacklightAutoEnabled(newBacklight)
                        }),
                },
                ...(currentTrack
                    ? [
                          {
                              label: "Now Playing",
                              action: () => navigateTo(["nowplaying"]),
                          },
                      ]
                    : []),
            ],
            music: [
                {
                    label: "All Songs",
                    action: () => navigateTo(["main", "music", "allsongs"]),
                },
                {
                    label: "Artists",
                    action: () => navigateTo(["main", "music", "artists"]),
                },
            ],
            settings: [
                {
                    label: `Shuffle: ${shuffle ? "On" : "Off"}`,
                    action: () => startTransition(() => setShuffle(!shuffle)),
                },
                {
                    label: `Repeat: ${repeat === "off" ? "Off" : repeat === "one" ? "One" : "All"}`,
                    action: () =>
                        startTransition(() =>
                            setRepeat(
                                repeat === "off"
                                    ? "one"
                                    : repeat === "one"
                                      ? "all"
                                      : "off"
                            )
                        ),
                },
                {
                    label: `Backlight: ${backlight ? "On" : "Off"}`,
                    action: () =>
                        startTransition(() => {
                            const newBacklight = !backlight
                            setBacklight(newBacklight)
                            // 如果用户手动关闭，禁用自动背光；如果手动开启，启用自动背光
                            setBacklightAutoEnabled(newBacklight)
                        }),
                },
                {
                    label: `LCD Filter: ${lcdFilter ? "On" : "Off"}`,
                    action: () =>
                        startTransition(() => setLcdFilter(!lcdFilter)),
                },
                {
                    label: `Theme: ${theme}`,
                    action: () => {},
                },
                {
                    label: `Lyrics: ${showLyrics ? "On" : "Off"}`,
                    action: () =>
                        startTransition(() => setShowLyrics(!showLyrics)),
                },
            ],
            allsongs: tracks.map((track, idx) => ({
                label: track.title,
                action: () => playTrack(idx),
            })),
            artists: artistsList.map((artist) => ({
                label: artist,
                action: () =>
                    navigateTo([
                        "main",
                        "music",
                        "artists",
                        `artist-${artist}`,
                    ]),
            })),
            albums: [],
            nowplaying: [],
        }

        // 动态生成艺术家歌曲列表
        artistsList.forEach((artist) => {
            const artistKey: MenuKey = `artist-${artist}` as MenuKey
            const artistTracks = tracksByArtist[artist] || []
            structure[artistKey] = artistTracks.map(({ index }) => ({
                label: tracks[index].title,
                action: () => playTrack(index),
            }))
        })

        return structure as Record<MenuKey, MenuItem[]>
    }, [
        shuffle,
        repeat,
        backlight,
        lcdFilter,
        theme,
        showLyrics,
        tracks,
        navigateTo,
        playTrack,
        handleShuffleSongs,
        artistsList,
        tracksByArtist,
        currentTrack,
    ])

    // Get current menu items
    const currentMenuKey = currentMenu[currentMenu.length - 1] as MenuKey
    const currentMenuItems = menuStructure[currentMenuKey] || []

    // Determine if we're in playing mode
    const isPlayingMode = currentMenuKey === "nowplaying"

    // Handle center button press
    const handleCenterPress = useCallback(() => {
        resetBacklightTimer()
        if (isPlayingMode) {
            // Toggle between audio (default) and video (MV mode)
            startTransition(() => setShowVideo(!showVideo))
        } else if (currentMenuItems[selectedIndex]) {
            currentMenuItems[selectedIndex].action()
        }
    }, [
        isPlayingMode,
        showVideo,
        currentMenuItems,
        selectedIndex,
        resetBacklightTimer,
    ])

    // Handle menu button press
    const handleMenuPress = useCallback(() => {
        resetBacklightTimer()
        if (isPlayingMode) {
            // In playing mode, MENU returns to all songs list
            startTransition(() => {
                setCurrentMenu(["main", "music", "allsongs"])
                setSelectedIndex(0)
            })
        } else {
            // In menu mode, MENU goes back to previous level
            if (currentMenu.length > 1) {
                startTransition(() => {
                    const newMenu = currentMenu.slice(0, -1)
                    setCurrentMenu(newMenu)
                    setSelectedIndex(0)
                })
            } else {
                // Already at main menu, go to now playing if there's a track
                if (currentTrack) {
                    startTransition(() => {
                        setCurrentMenu(["nowplaying"])
                        setSelectedIndex(0)
                    })
                }
            }
        }
    }, [isPlayingMode, currentMenu, currentTrack, resetBacklightTimer])

    // Handle scroll wheel - 仅在菜单模式下使用
    const handleScrollUp = useCallback(() => {
        if (isPlayingMode) return // 在播放模式下不处理
        resetBacklightTimer()
        startTransition(() => {
            setSelectedIndex((prev) => Math.max(0, prev - 1))
        })
    }, [resetBacklightTimer, isPlayingMode])

    const handleScrollDown = useCallback(() => {
        if (isPlayingMode) return // 在播放模式下不处理
        resetBacklightTimer()
        startTransition(() => {
            setSelectedIndex((prev) =>
                Math.min(currentMenuItems.length - 1, prev + 1)
            )
        })
    }, [currentMenuItems.length, resetBacklightTimer, isPlayingMode])

    // Handle scroll wheel rotation
    const handleWheelRotate = useCallback(
        (delta: number) => {
            resetBacklightTimer()
            if (isPlayingMode) {
                // In playing mode: seek ±5 seconds
                // 顺时针旋转（delta > 0）= 快进（+5秒）
                // 逆时针旋转（delta < 0）= 快退（-5秒）
                if (playerRef.current && playerRef.current.seekTo) {
                    const currentTime = playerRef.current.getCurrentTime()
                    const seekAmount = delta > 0 ? 5 : -5
                    const newTime = Math.max(
                        0,
                        Math.min(duration, currentTime + seekAmount)
                    )
                    playerRef.current.seekTo(newTime, true)
                    startTransition(() => setCurrentTime(newTime))
                }
            } else {
                // In menu mode: scroll wheel rotation controls menu selection (up/down)
                // Positive delta = scroll down (next item)
                // Negative delta = scroll up (previous item)
                if (delta > 0) {
                    handleScrollDown()
                } else {
                    handleScrollUp()
                }
            }
        },
        [
            isPlayingMode,
            duration,
            handleScrollDown,
            handleScrollUp,
            resetBacklightTimer,
        ]
    )

    // Handle keyboard events
    useEffect(() => {
        if (typeof window === "undefined") return

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault()
                    if (isPlayingMode) {
                        // In playing mode: previous track
                        handlePrevious()
                    } else {
                        // 在菜单模式下，左箭头键 = 向上滚动菜单
                        handleScrollUp()
                    }
                    break
                case "ArrowRight":
                    e.preventDefault()
                    if (isPlayingMode) {
                        // In playing mode: next track
                        handleNext()
                    } else {
                        // 在菜单模式下，右箭头键 = 向下滚动菜单
                        handleScrollDown()
                    }
                    break
                case "ArrowUp":
                    e.preventDefault()
                    if (!isPlayingMode) {
                        // 在菜单模式下，上下箭头键控制菜单选择
                        handleScrollUp()
                    }
                    break
                case "ArrowDown":
                    e.preventDefault()
                    if (!isPlayingMode) {
                        // 在菜单模式下，上下箭头键控制菜单选择
                        handleScrollDown()
                    }
                    break
                case "Enter":
                    e.preventDefault()
                    handleCenterPress()
                    break
                case "Escape":
                    e.preventDefault()
                    handleMenuPress()
                    break
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [
        isPlayingMode,
        handlePrevious,
        handleNext,
        handleScrollUp,
        handleScrollDown,
        handleCenterPress,
        handleMenuPress,
        resetBacklightTimer,
    ])

    // Initialize backlight timer on mount
    useEffect(() => {
        resetBacklightTimer()

        return () => {
            if (backlightTimeoutRef.current) {
                clearTimeout(backlightTimeoutRef.current)
            }
        }
    }, [resetBacklightTimer])

    // 开机动画：当鼠标进入组件后触发，0.5 秒后开启背光并显示内容
    useEffect(() => {
        if (isHovered && !bootAnimationComplete) {
            const timer = window.setTimeout(() => {
                startTransition(() => {
                    setBootAnimationComplete(true)
                    setBacklight(true)
                    setBacklightAutoEnabled(true)
                })
                resetBacklightTimer()
            }, 500)

            return () => window.clearTimeout(timer)
        }
    }, [isHovered, bootAnimationComplete, resetBacklightTimer])

    // Wheel rotation tracking
    const handleWheelMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDraggingRef.current || !wheelRef.current) return
            const rect = wheelRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)

            let delta = angle - lastAngleRef.current

            // Handle angle wrap-around
            if (delta > Math.PI) delta -= 2 * Math.PI
            if (delta < -Math.PI) delta += 2 * Math.PI

            // Trigger rotation if delta is significant enough (reduced threshold for better responsiveness)
            if (Math.abs(delta) > 0.05) {
                handleWheelRotate(delta)
                lastAngleRef.current = angle
            }
        },
        [handleWheelRotate, resetBacklightTimer]
    )

    const handleWheelMouseUp = useCallback(() => {
        isDraggingRef.current = false
    }, [])

    const handleWheelMouseDown = useCallback(
        (e: React.MouseEvent) => {
            resetBacklightTimer()
            if (!wheelRef.current) return
            isDraggingRef.current = true
            const rect = wheelRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
            lastAngleRef.current = angle

            const handleMouseMove = (e: MouseEvent) => handleWheelMouseMove(e)
            const handleMouseUp = () => {
                handleWheelMouseUp()
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
            }

            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
        },
        [resetBacklightTimer, handleWheelMouseMove, handleWheelMouseUp]
    )

    // Handle menu item click
    const handleMenuItemClick = useCallback(
        (index: number) => {
            resetBacklightTimer()
            startTransition(() => setSelectedIndex(index))
            if (currentMenuItems[index]) {
                currentMenuItems[index].action()
            }
        },
        [currentMenuItems, resetBacklightTimer]
    )

    // Format time as MM:SS
    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }, [])

    // Battery charging animation
    useEffect(() => {
        const interval = setInterval(() => {
            startTransition(() => {
                setBatteryLevel((prev) => (prev >= 4 ? 1 : prev + 1))
            })
        }, 1500) // Change every 1500ms for slower animation

        return () => clearInterval(interval)
    }, [])

    // Battery indicator component
    const BatteryIndicator = () => (
        <div
            style={{
                width: 19,
                height: 10,
                border: `1px solid ${backlight ? "#0a3667" : "#4a4a4a"}`,
                borderRadius: 2,
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: "1px",
                gap: "1px",
            }}
        >
            {[0, 1, 2, 3].map((i) => (
                <div
                    key={i}
                    style={{
                        flex: 1, // 使用 flex: 1 填充可用空间
                        height: "100%",
                        backgroundColor:
                            i < batteryLevel
                                ? backlight
                                    ? "#0a3667"
                                    : "#4a4a4a"
                                : "transparent",
                        transition: "background-color 0.2s ease",
                    }}
                />
            ))}
            <div
                style={{
                    position: "absolute",
                    right: -3,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 2,
                    height: 4,
                    backgroundColor: backlight ? "#0a3667" : "#4a4a4a",
                    borderRadius: "0 1px 1px 0",
                }}
            />
        </div>
    )

    // Auto-scroll selected item into view
    useEffect(() => {
        if (scrollRef.current) {
            const selectedElement = scrollRef.current.children[
                selectedIndex
            ] as HTMLElement
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                })
            }
        }
    }, [selectedIndex])

    // Calculate scale based on size prop
    const scaleValue = size === "medium" ? 1.3 : size === "large" ? 1.6 : 1

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
                ...props.style,
            }}
        >
            {/* Scrollbar Styles */}
            <style>{`
                .ipod-menu-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .ipod-menu-scroll::-webkit-scrollbar-track {
                    background: transparent;
                    margin: 0;
                    box-shadow: inset 1px 0 0 ${backlight ? "rgba(10, 54, 103, 0.5)" : "rgba(74, 74, 74, 0.5)"}, inset -1px 0 0 ${backlight ? "rgba(10, 54, 103, 0.5)" : "rgba(74, 74, 74, 0.5)"};
                }
                .ipod-menu-scroll::-webkit-scrollbar-thumb {
                    background: ${backlight ? "#0a3667" : "#4a4a4a"};
                    border-radius: 0;
                }
                .ipod-menu-scroll::-webkit-scrollbar-thumb:hover {
                    background: ${backlight ? "#0a3667" : "#4a4a4a"};
                }
                @keyframes loading-dot-1 {
                    0%, 100% {
                        opacity: 1;
                    }
                }
                @keyframes loading-dot-2 {
                    0%, 32.99% {
                        opacity: 0;
                    }
                    33%, 99.99% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                    }
                }
                @keyframes loading-dot-3 {
                    0%, 65.99% {
                        opacity: 0;
                    }
                    66%, 99.99% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                    }
                }
                .loading-dot-1 {
                    animation: loading-dot-1 1.5s infinite;
                }
                .loading-dot-2 {
                    animation: loading-dot-2 1.5s infinite;
                }
                .loading-dot-3 {
                    animation: loading-dot-3 1.5s infinite;
                }
            `}</style>

            {/* iPod Device */}
            <div
                style={{
                    width: 200,
                    height: 340,
                    background:
                        theme === "classic"
                            ? "linear-gradient(145deg, #ffffff, #f5f5f5)"
                            : theme === "u2"
                              ? "linear-gradient(145deg, #1a1a1a, #000000)"
                              : "linear-gradient(145deg, #2a2a2a, #0a0a0a)",
                    borderRadius: 20,
                    padding: 15,
                    display: "flex",
                    flexDirection: "column",
                    gap: 15,
                    boxShadow: `
                        0 0 0 1px ${theme === "classic" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)"},
                        0 2px 4px rgba(0,0,0,0.1),
                        0 8px 16px rgba(0,0,0,0.15),
                        0 16px 32px rgba(0,0,0,0.2)
                    `,
                    position: "relative",
                    transform: `scale(${scaleValue})`,
                    transformOrigin: "center center",
                }}
            >
                {/* Glossy overlay for classic white */}
                {theme === "classic" && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background:
                                "linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0))",
                            borderRadius: "20px 20px 0 0",
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Screen */}
                <div
                    style={{
                        width: "100%",
                        height: 140,
                        background: backlight
                            ? "linear-gradient(to bottom, #d1e8fa, #e0f0fc)"
                            : "linear-gradient(to bottom, #a0a8a0, #b8c0b8)",
                        borderRadius: 8,
                        padding: 0,
                        position: "relative",
                        overflow: "hidden",
                        filter: backlight ? "none" : "none",
                        border: "1px solid #999",
                    }}
                >
                    {/* YouTube Player Container - 始终在DOM中（使用外层包裹，避免被 YouTube 替换掉样式） */}
                    {currentTrack && (
                        <div
                            style={{
                                position: "absolute",
                                top: 20,
                                left: 0,
                                width: "100%",
                                height: "calc(100% - 20px)",
                                display: "block",
                                zIndex:
                                    bootAnimationComplete &&
                                    isPlayingMode &&
                                    showVideo
                                        ? 50
                                        : -1,
                                pointerEvents:
                                    bootAnimationComplete &&
                                    isPlayingMode &&
                                    showVideo
                                        ? "auto"
                                        : "none",
                                opacity:
                                    bootAnimationComplete &&
                                    isPlayingMode &&
                                    showVideo
                                        ? 1
                                        : 0,
                            }}
                        >
                            <div
                                id={`youtube-player-${currentTrack.id}`}
                                style={{ width: "100%", height: "100%" }}
                            />
                        </div>
                    )}
                    {/* Boot Overlay - 覆盖所有内容（位于条纹之下、内阴影之下） */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            color: backlight ? "#0a3667" : "#2a2a2a",
                            pointerEvents: "none",
                            zIndex: 90,
                            opacity: bootAnimationComplete ? 0 : 1,
                            transition: "opacity 0.5s ease",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: "bold",
                                letterSpacing: 2,
                                color: backlight ? "#0a3667" : "#2a2a2a",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            
                        </div>
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 12,
                                fontWeight: "bold",
                                color: backlight ? "#0a3667" : "#2a2a2a",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            {ownerName ? `${ownerName}'s iPod` : "iPod"}
                        </div>
                    </div>
                    {/* 内阴影层 - 始终置顶 */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: 7, // 外层borderRadius 8 - border 1px = 7，确保与边框内边缘对齐
                            pointerEvents: "none",
                            zIndex: 100,
                            boxShadow: `
                                inset 0 1px 3px rgba(0,0,0,0.12),
                                inset 0 0 6px rgba(0,0,0,0.06),
                                inset 0 -1px 3px rgba(0,0,0,0.06),
                                inset 1px 0 2px rgba(0,0,0,0.06),
                                inset -1px 0 2px rgba(0,0,0,0.06)
                            `,
                        }}
                    />
                    {lcdFilter && (
                        <>
                            {/* Scanline texture */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background:
                                        "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, transparent 1px, transparent 2px)",
                                    pointerEvents: "none",
                                    zIndex: 95,
                                }}
                            />
                            {/* Glass reflection */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "30%",
                                    background:
                                        "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
                                    pointerEvents: "none",
                                    zIndex: 96,
                                }}
                            />
                        </>
                    )}

                    {/* Screen Content */}
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            color: backlight ? "#0a3667" : "#2a2a2a",
                            fontSize: 10,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0,
                            padding: "0",
                            backgroundColor: backlight ? "#c5e0f5" : "#9ca49c",
                            opacity: bootAnimationComplete ? 1 : 0,
                            pointerEvents: bootAnimationComplete
                                ? "auto"
                                : "none",
                            transition: "opacity 0.5s ease",
                            ...font,
                        }}
                    >
                        {/* Top Navigation Bar - Always Visible */}
                        <div
                            style={{
                                height: 20,
                                borderBottom: `1px solid ${backlight ? "#0a3667" : "#4a4a4a"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0",
                                fontSize: 10,
                                flexShrink: 0,
                                ...font,
                            }}
                        >
                            {/* Play/Pause Icon */}
                            <div
                                style={{
                                    width: 20,
                                    textAlign: "left",
                                    paddingLeft: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {isPlaying ? (
                                    <svg
                                        width="8"
                                        height="8"
                                        viewBox="0 0 8 8"
                                        fill={backlight ? "#0a3667" : "#2a2a2a"}
                                    >
                                        <polygon points="0,0 8,4 0,8" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="8"
                                        height="8"
                                        viewBox="0 0 8 8"
                                        fill={backlight ? "#0a3667" : "#2a2a2a"}
                                    >
                                        <rect x="0" y="0" width="3" height="8" />
                                        <rect x="5" y="0" width="3" height="8" />
                                    </svg>
                                )}
                            </div>

                            {/* Title - Changes based on current screen */}
                            <div
                                style={{
                                    flex: 1,
                                    textAlign: "center",
                                    fontWeight: "bold",
                                }}
                            >
                                {isPlayingMode
                                    ? "Now Playing"
                                    : currentMenuKey === "main"
                                      ? "iPod"
                                      : currentMenuKey === "music"
                                        ? "Music"
                                        : currentMenuKey === "allsongs"
                                          ? "All Songs"
                                          : currentMenuKey === "artists"
                                            ? "Artists"
                                            : currentMenuKey.startsWith(
                                                    "artist-"
                                                )
                                              ? currentMenuKey.replace(
                                                    "artist-",
                                                    ""
                                                )
                                              : currentMenuKey === "settings"
                                                ? "Settings"
                                                : "iPod"}
                            </div>

                            {/* Battery */}
                            <div
                                style={{
                                    width: 24,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    paddingRight: "8px",
                                }}
                            >
                                <BatteryIndicator />
                            </div>
                        </div>

                        {/* Content Area */}
                        {isPlayingMode && currentTrack ? (
                            <div
                                style={{
                                    width: "100%",
                                    flex: 1,
                                    position: "relative",
                                }}
                            >
                                {/* Overlay to block mouse interaction on video */}
                                {showVideo && isPlayingMode && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            pointerEvents: "auto",
                                            zIndex: 20,
                                        }}
                                    />
                                )}

                                {/* Loading Screen */}
                                {!playerReady && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: backlight
                                                ? "#c5e0f5"
                                                : "#9ca49c",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8,
                                            zIndex: 15,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: backlight
                                                    ? "#0a3667"
                                                    : "#2a2a2a",
                                                textAlign: "center",
                                                padding: "0 8px",
                                                ...font,
                                            }}
                                        >
                                            {currentTrack.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 8,
                                                color: backlight
                                                    ? "#0a3667"
                                                    : "#2a2a2a",
                                                opacity: 0.7,
                                                ...font,
                                            }}
                                        >
                                            {currentTrack.artist}
                                        </div>
                                        <div
                                            style={{
                                                marginTop: 8,
                                                fontSize: 10,
                                                color: backlight
                                                    ? "#0a3667"
                                                    : "#2a2a2a",
                                                ...font,
                                            }}
                                        >
                                            Loading
                                            <span className="loading-dot-1">
                                                .
                                            </span>
                                            <span className="loading-dot-2">
                                                .
                                            </span>
                                            <span className="loading-dot-3">
                                                .
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Audio Mode UI - 覆盖视频 */}
                                {!showVideo && playerReady && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            backgroundColor: backlight
                                                ? "#c5e0f5"
                                                : "#9ca49c",
                                            zIndex: 10,
                                        }}
                                    >
                                        {/* Track Counter */}
                                        <div
                                            style={{
                                                padding: "4px 8px",
                                                fontSize: 9,
                                                backgroundColor: backlight
                                                    ? "#c5e0f5"
                                                    : "#9ca49c",
                                                ...font,
                                            }}
                                        >
                                            {currentTrackIndex + 1} of{" "}
                                            {tracks.length}
                                        </div>

                                        {/* Song Info */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                                padding: "0 8px",
                                                backgroundColor: backlight
                                                    ? "#c5e0f5"
                                                    : "#9ca49c",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: "bold",
                                                    textAlign: "center",
                                                    color: backlight
                                                        ? "#0a3667"
                                                        : "#2a2a2a",
                                                    ...font,
                                                }}
                                            >
                                                {currentTrack.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    textAlign: "center",
                                                    color: backlight
                                                        ? "#0a3667"
                                                        : "#2a2a2a",
                                                    ...font,
                                                }}
                                            >
                                                {currentTrack.artist ||
                                                    "Unknown Artist"}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div
                                            style={{
                                                padding: "0 8px 8px 8px",
                                                backgroundColor: backlight
                                                    ? "#c5e0f5"
                                                    : "#9ca49c",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: 8,
                                                    backgroundColor:
                                                        "transparent",
                                                    border: `1px solid ${backlight ? "#0a3667" : "#4a4a4a"}`,
                                                    borderRadius: 4,
                                                    position: "relative",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        left: 0,
                                                        top: 0,
                                                        height: "100%",
                                                        width:
                                                            duration > 0
                                                                ? `${(currentTime / duration) * 100}%`
                                                                : "0%",
                                                        backgroundColor:
                                                            backlight
                                                                ? "#0a3667"
                                                                : "#4a4a4a",
                                                        borderRadius: 3,
                                                        transition:
                                                            "width 0.1s linear",
                                                    }}
                                                />
                                            </div>

                                            {/* Time Display */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginTop: 2,
                                                    fontSize: 9,
                                                    color: backlight
                                                        ? "#0a3667"
                                                        : "#2a2a2a",
                                                    ...font,
                                                }}
                                            >
                                                <span>
                                                    {formatTime(currentTime)}
                                                </span>
                                                <span>
                                                    -
                                                    {formatTime(
                                                        Math.max(
                                                            0,
                                                            duration -
                                                                currentTime
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                ref={scrollRef}
                                className="ipod-menu-scroll"
                                style={{
                                    height: "100%",
                                    overflowY: "auto",
                                    overflowX: "hidden",
                                    position: "relative",
                                }}
                            >
                                {currentMenuItems.map(
                                    (item: MenuItem, idx: number) => (
                                        <div
                                            key={idx}
                                            onClick={() =>
                                                handleMenuItemClick(idx)
                                            }
                                            onMouseEnter={(e) => {
                                                if (idx !== selectedIndex) {
                                                    e.currentTarget.style.backgroundColor =
                                                        backlight
                                                            ? "#c0d8f0"
                                                            : "#7a827a"
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (idx !== selectedIndex) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "transparent"
                                                }
                                            }}
                                            style={{
                                                padding: "4px 8px",
                                                backgroundColor:
                                                    idx === selectedIndex
                                                        ? backlight
                                                            ? "#0a3667"
                                                            : "#4a4a4a"
                                                        : "transparent",
                                                color:
                                                    idx === selectedIndex
                                                        ? backlight
                                                            ? "#c5e0f5"
                                                            : "#d0d8d0"
                                                        : backlight
                                                          ? "#0a3667"
                                                          : "#2a2a2a",
                                                cursor: "pointer",
                                                fontSize: 12,
                                                textShadow: textShadow
                                                    ? "1px 1px 0 rgba(0,0,0,0.15)"
                                                    : "none",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                ...font,
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Click Wheel */}
                <div
                    ref={wheelRef}
                    onMouseDown={handleWheelMouseDown}
                    style={{
                        width: 170,
                        height: 170,
                        aspectRatio: "1 / 1", // 强制保持1:1宽高比，确保为正圆
                        borderRadius: "50%",
                        background:
                            theme === "classic"
                                ? "linear-gradient(145deg, #e8e8e8, #d0d0d0)"
                                : theme === "u2"
                                  ? "linear-gradient(145deg, #c41e3a, #8b0000)"
                                  : "linear-gradient(145deg, #3a3a3a, #1a1a1a)",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "center",
                        boxShadow: `
                            inset 0 0 0 1px ${theme === "classic" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"},
                            inset 0 2px 4px rgba(0,0,0,0.1),
                            0 2px 8px rgba(0,0,0,0.15)
                        `,
                    }}
                >
                    {/* Metallic ring effect */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: "50%",
                            background: `conic-gradient(
                                from 0deg,
                                ${theme === "classic" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"} 0deg,
                                transparent 90deg,
                                ${theme === "classic" ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.3)"} 180deg,
                                transparent 270deg,
                                ${theme === "classic" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"} 360deg
                            )`,
                            pointerEvents: "none",
                        }}
                    />

                    {/* Menu Button */}
                    <button
                        onClick={handleMenuPress}
                        style={{
                            position: "absolute",
                            top: 15,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textShadow:
                                theme === "classic"
                                    ? "0 1px 0 rgba(255,255,255,0.5)"
                                    : "0 1px 2px rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg
                            width="32"
                            height="12"
                            viewBox="0 0 32 12"
                            fill={
                                theme === "classic"
                                    ? "#666"
                                    : theme === "u2"
                                      ? "#fff"
                                      : "#ccc"
                            }
                        >
                            <text
                                x="16"
                                y="9"
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                                fontFamily="system-ui, -apple-system, sans-serif"
                            >
                                MENU
                            </text>
                        </svg>
                    </button>

                    {/* Forward Button */}
                    <button
                        onClick={
                            isPlayingMode
                                ? handleNext
                                : () => handleScrollDown()
                        }
                        style={{
                            position: "absolute",
                            right: 15,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            opacity: 1,
                            textShadow:
                                theme === "classic"
                                    ? "0 1px 0 rgba(255,255,255,0.5)"
                                    : "0 1px 2px rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill={
                                theme === "classic"
                                    ? "#666"
                                    : theme === "u2"
                                      ? "#fff"
                                      : "#ccc"
                            }
                        >
                            <polygon points="0,2 6,8 0,14" />
                            <polygon points="6,2 12,8 6,14" />
                            <rect x="13" y="2" width="2" height="12" />
                        </svg>
                    </button>

                    {/* Play/Pause Button */}
                    <button
                        onClick={
                            isPlayingMode
                                ? () => {
                                      resetBacklightTimer()
                                      togglePlayPause()
                                  }
                                : undefined
                        }
                        style={{
                            position: "absolute",
                            bottom: 15,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: isPlayingMode ? "pointer" : "default",
                            opacity: isPlayingMode ? 1 : 0.5,
                            textShadow:
                                theme === "classic"
                                    ? "0 1px 0 rgba(255,255,255,0.5)"
                                    : "0 1px 2px rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {isPlaying ? (
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill={
                                    theme === "classic"
                                        ? "#666"
                                        : theme === "u2"
                                          ? "#fff"
                                          : "#ccc"
                                }
                            >
                                <rect x="3" y="2" width="4" height="12" />
                                <rect x="9" y="2" width="4" height="12" />
                            </svg>
                        ) : (
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill={
                                    theme === "classic"
                                        ? "#666"
                                        : theme === "u2"
                                          ? "#fff"
                                          : "#ccc"
                                }
                            >
                                <polygon points="4,2 14,8 4,14" />
                            </svg>
                        )}
                    </button>

                    {/* Back Button */}
                    <button
                        onClick={
                            isPlayingMode
                                ? handlePrevious
                                : () => handleScrollUp()
                        }
                        style={{
                            position: "absolute",
                            left: 15,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            opacity: 1,
                            textShadow:
                                theme === "classic"
                                    ? "0 1px 0 rgba(255,255,255,0.5)"
                                    : "0 1px 2px rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill={
                                theme === "classic"
                                    ? "#666"
                                    : theme === "u2"
                                      ? "#fff"
                                      : "#ccc"
                            }
                        >
                            <rect x="1" y="2" width="2" height="12" />
                            <polygon points="10,2 4,8 10,14" />
                            <polygon points="16,2 10,8 16,14" />
                        </svg>
                    </button>

                    {/* Center Button */}
                    <button
                        onClick={handleCenterPress}
                        style={{
                            width: 60,
                            height: 60,
                            aspectRatio: "1 / 1", // 强制保持1:1宽高比，确保为正圆
                            borderRadius: "50%",
                            background:
                                theme === "classic"
                                    ? "linear-gradient(145deg, #ffffff, #f0f0f0)"
                                    : theme === "u2"
                                      ? "linear-gradient(145deg, #2a2a2a, #0a0a0a)"
                                      : "linear-gradient(145deg, #4a4a4a, #2a2a2a)",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: `
                                0 0 0 1px ${theme === "classic" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"},
                                0 2px 4px rgba(0,0,0,0.2),
                                inset 0 1px 0 ${theme === "classic" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)"}
                            `,
                            position: "relative",
                        }}
                    >
                        {/* Center button highlight */}
                        <div
                            style={{
                                position: "absolute",
                                top: "10%",
                                left: "10%",
                                right: "10%",
                                height: "40%",
                                background:
                                    theme === "classic"
                                        ? "linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)"
                                        : "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)",
                                borderRadius: "50%",
                                pointerEvents: "none",
                            }}
                        />
                    </button>
                </div>
            </div>

            {/* Status Message */}
            {_statusMessage && (
                <div
                    style={{
                        marginTop: 10,
                        padding: "5px 10px",
                        backgroundColor: "rgba(0,0,0,0.8)",
                        color: "#fff",
                        borderRadius: 4,
                        fontSize: 10,
                    }}
                >
                    {_statusMessage}
                </div>
            )}
        </div>
    )
}

addPropertyControls(IPodPlayer, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["classic", "black", "u2"],
        optionTitles: ["WH", "BLK", "U2"],
        defaultValue: "classic",
        displaySegmentedControl: true,
    },
    youtubeUrl: {
        type: ControlType.String,
        title: "YouTube URL",
        defaultValue: "",
        placeholder: "Enter YouTube URLs separated by commas",
        displayTextArea: true,
        description: "Enter multiple YouTube URLs separated by commas",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "10px",
            variant: "Regular",
        },
    },
    textShadow: {
        type: ControlType.Boolean,
        title: "Text Shadow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    ownerName: {
        type: ControlType.String,
        title: "Owner Name",
        defaultValue: "Zihan",
        placeholder: "Enter iPod owner name",
        description:
            "Name displayed during boot animation. Created by Zihan Huang (bravohenry.com)",
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["default", "medium", "large"],
        optionTitles: ["100%", "130%", "160%"],
        defaultValue: "default",
        displaySegmentedControl: true,
    },
})
