import { useRef, useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function CinematicScroll(props) {
    const { videoFile, objectFit, borderRadius, startPoint, endPoint } = props

    const videoRef = useRef(null)
    const containerRef = useRef(null) // 新增：用來追蹤組件 DOM 節點

    const isStatic = useIsStaticRenderer()
    const [isVisible, setIsVisible] = useState(false) // 新增：記錄組件是否在畫面上

    // 【P2 修正】檢查設定值是否有效：Start 不能大於或等於 End
    const isInvalidRange = startPoint >= endPoint

    // 【P1 修正】使用 IntersectionObserver 監聽組件可視狀態
    useEffect(() => {
        if (isStatic || !containerRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            {
                root: null,
                // 設定 rootMargin 提早 200px 觸發，避免使用者滑動太快時影片來不及準備
                rootMargin: "200px",
                threshold: 0,
            }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    // 強制解鎖 iOS 的影片控制權
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.defaultMuted = true
            videoRef.current.muted = true
        }
    }, [videoFile])

    // 處理捲動與影片進度
    useEffect(() => {
        // 【P1 & P2 修正】如果是靜態渲染、組件不在畫面上、或設定值錯誤時，直接不綁定 scroll 事件
        if (isStatic || !isVisible || isInvalidRange) return

        const handleScroll = () => {
            if (!videoRef.current) return
            const duration = videoRef.current.duration
            if (isNaN(duration) || duration === 0) return

            const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop
            const maxScroll =
                document.documentElement.scrollHeight - window.innerHeight
            if (maxScroll <= 0) return

            const rawScrollFraction = scrollTop / maxScroll

            const start = startPoint / 100
            const end = endPoint / 100

            // 【P2 修正】避免除以零的狀況（雙重保險）
            if (end <= start) return

            let relativeProgress = (rawScrollFraction - start) / (end - start)
            relativeProgress = Math.max(0, Math.min(1, relativeProgress))

            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = relativeProgress * duration
                }
            })
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll() // 初始化時執行一次

        return () => window.removeEventListener("scroll", handleScroll)
    }, [videoFile, startPoint, endPoint, isStatic, isVisible, isInvalidRange])

    const handleMetadataLoad = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            // 只有在非靜態且可視的狀態下才觸發定位
            if (!isStatic && isVisible) {
                window.dispatchEvent(new Event("scroll"))
            }
        }
    }

    // 【P2 修正】當參數設定錯誤時，顯示明顯的提示 UI 給使用者
    if (isInvalidRange) {
        return (
            <div style={{ ...placeholderStyle, borderRadius: borderRadius }}>
                ⚠️ "Start (%)" must be less than "End (%)". Please check your
                settings.
            </div>
        )
    }

    return (
        <div
            ref={containerRef} // 將 ref 綁定到外層容器
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: borderRadius,
                position: "relative",
            }}
        >
            {videoFile ? (
                <video
                    ref={videoRef}
                    src={videoFile}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: objectFit,
                        display: "block",
                    }}
                    muted={true}
                    playsInline={true}
                    autoPlay={true}
                    onLoadedMetadata={handleMetadataLoad}
                />
            ) : (
                <div style={placeholderStyle}>
                    🎥 Please upload the video and specify the range.
                </div>
            )}
        </div>
    )
}

const placeholderStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#000",
    backgroundColor: "#f5f5f5", // 加一點底色讓 Placeholder/錯誤訊息 更清晰
    padding: "16px",
    fontSize: "14px",
    textAlign: "center",
}

addPropertyControls(CinematicScroll, {
    videoFile: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["mp4", "webm", "mov"],
        description:
            "Ensure lag-free scrolling by using GOP=1 (All-Intra) video",
    },
    startPoint: {
        type: ControlType.Number,
        title: "Start (%)",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "%",
        displayStepper: true,
    },
    endPoint: {
        type: ControlType.Number,
        title: "End (%)",
        min: 0,
        max: 100,
        defaultValue: 100,
        unit: "%",
        displayStepper: true,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Type",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        defaultValue: 0,
    },
})
