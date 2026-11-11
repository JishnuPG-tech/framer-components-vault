import * as React from "react"
import { useRef, useEffect, useMemo } from "react"
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
 * InstagramCard — v7 (static-renderer safe)
 *
 * Instagram post mockup with the media playing inside the card.
 *
 * Three sources:
 *   file  — uploaded mp4/webm/mov, native <video>
 *   url   — direct link to a video file, native <video>
 *   embed — YouTube / Vimeo / any other platform, <iframe>
 *
 * On the canvas, in exports and in thumbnails, useIsStaticRenderer() returns
 * true: no <video>, no <iframe>, no playback, no network requests. The media
 * box renders the poster image, or a plain styled placeholder if none is set.
 *
 * Embeds are cover-fitted by hand: an iframe can't do object-fit, so the
 * frame is oversized past the media box on whichever axis is short and
 * the box clips the rest.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 380
 */

const ICON = {
    heart: "M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z",
    comment: "M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z",
    share: "M13.545 17.442 22 3 2 10.845l8.157 2.998ZM10.157 13.843 12.5 21l1.045-3.558M10.157 13.843 22 3",
    bookmark: "M20 21 12 13.44 4 21V3h16Z",
    play: "M8 5v14l11-7z",
}

/* ---------- Embed URL parsing ---------- */

function buildEmbed(
    raw: string,
    opts: {
        autoplay: boolean
        muted: boolean
        loop: boolean
        controls: boolean
    }
) {
    const url = (raw || "").trim()
    if (!url) return null

    const q = (params: Record<string, string | number>) =>
        Object.entries(params)
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join("&")

    // YouTube: watch?v=, youtu.be/, /shorts/, /embed/, /live/
    const yt = url.match(
        /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    )
    if (yt) {
        const id = yt[1]
        const start = url.match(/[?&](?:t|start)=(\d+)/)
        return `https://www.youtube-nocookie.com/embed/${id}?${q({
            autoplay: opts.autoplay ? 1 : 0,
            mute: opts.muted ? 1 : 0,
            loop: opts.loop ? 1 : 0,
            playlist: id, // required for loop on a single video
            controls: opts.controls ? 1 : 0,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            ...(start ? { start: start[1] } : {}),
        })}`
    }

    // Vimeo: vimeo.com/ID, vimeo.com/ID/HASH, player.vimeo.com/video/ID?h=HASH
    const vm = url.match(
        /vimeo\.com\/(?:video\/)?(\d+)(?:[/?](?:h=)?([A-Za-z0-9]+))?/
    )
    if (vm) {
        const id = vm[1]
        const hash = vm[2]
        return `https://player.vimeo.com/video/${id}?${q({
            ...(hash ? { h: hash } : {}),
            autoplay: opts.autoplay ? 1 : 0,
            muted: opts.muted ? 1 : 0,
            loop: opts.loop ? 1 : 0,
            // background strips all chrome and forces autoplay-friendly mode
            ...(opts.controls
                ? { title: 0, byline: 0, portrait: 0 }
                : { background: 1 }),
            dnt: 1,
        })}`
    }

    // Anything else: Loom, Wistia, Dailymotion, Streamable, Bunny, Mux,
    // self-hosted players. Pass the URL through — most platforms hand you
    // an embed link straight from their share dialog.
    return url
}

function Icon({ d, filled, color, size = 24, strokeWidth = 2 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? color : "none"}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ display: "block", flexShrink: 0 }}
        >
            <path d={d} />
        </svg>
    )
}

function Verified({ size = 14 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ display: "block", flexShrink: 0 }}
        >
            <path
                fill="#0095F6"
                d="M12 1.5l2.61 2.02 3.29-.42 1.25 3.07 3.07 1.25-.42 3.29L23.82 13l-2.02 2.61.42 3.29-3.07 1.25-1.25 3.07-3.29-.42L12 24.82l-2.61-2.02-3.29.42-1.25-3.07-3.07-1.25.42-3.29L.18 13l2.02-2.61-.42-3.29 3.07-1.25 1.25-3.07 3.29.42L12 1.5z"
                transform="scale(0.92) translate(1 -1)"
            />
            <path
                fill="#fff"
                d="M10.5 15.5l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4-6 6z"
            />
        </svg>
    )
}

/* Static fallback: poster image, or a plain styled placeholder. No playback,
   no iframe, no timers — this is what the canvas and exports render. */
function StaticMedia({ poster, focus, c }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: poster
                    ? `url(${poster}) 50% ${focus * 100}% / cover no-repeat`
                    : c.placeholder,
            }}
        >
            {!poster && (
                <Icon
                    d={ICON.play}
                    filled
                    color={c.secondary}
                    size={44}
                    strokeWidth={0}
                />
            )}
        </div>
    )
}

export default function InstagramCard(props) {
    const {
        video,
        post,
        engagement,
        comments,
        theme,
        cornerRadius,
        shadow,
        style,
    } = props

    const videoRef = useRef<HTMLVideoElement>(null)
    const isStatic = useIsStaticRenderer()

    const dark = theme === "dark"
    const c = {
        bg: dark ? "#000000" : "#FFFFFF",
        text: dark ? "#F5F5F5" : "#000000",
        secondary: dark ? "#A8A8A8" : "#737373",
        border: dark ? "#262626" : "#DBDBDB",
        placeholder: dark ? "#111111" : "#EEEEEE",
        heart: "#FF3040",
    }

    const isEmbed = video.source === "embed"
    const fileSrc =
        video.source === "url" ? (video.url || "").trim() : video.src

    const embedSrc = useMemo(
        () =>
            isEmbed && !isStatic
                ? buildEmbed(video.url, {
                      autoplay: video.autoplay,
                      muted: video.muted,
                      loop: video.loop,
                      controls: video.controls,
                  })
                : null,
        [
            isEmbed,
            isStatic,
            video.url,
            video.autoplay,
            video.muted,
            video.loop,
            video.controls,
        ]
    )

    /* Autoplay on preview/live only — never in a static render */
    useEffect(() => {
        if (isStatic) return
        const v = videoRef.current
        if (!v || isEmbed || !video.autoplay) return
        v.play().catch(() => {})
    }, [video.autoplay, fileSrc, isEmbed, isStatic])

    /* Cover-fit for the iframe: oversize the short axis, box clips it */
    const boxAspect = post.mediaAspect
    const embedAspect = Math.max(0.1, video.embedAspect)
    const wider = embedAspect >= boxAspect
    const iframeGeometry: React.CSSProperties = wider
        ? {
              height: "100%",
              width: `${(embedAspect / boxAspect) * 100}%`,
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
          }
        : {
              width: "100%",
              height: `${(boxAspect / embedAspect) * 100}%`,
              left: 0,
              top: `${video.focus * 100}%`,
              transform: `translateY(-${video.focus * 100}%)`,
          }

    const likesText = Number(engagement.likes || 0).toLocaleString("en-US")
    const commentsText = Number(engagement.commentCount || 0).toLocaleString(
        "en-US"
    )

    const font = {
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        WebkitFontSmoothing: "antialiased" as const,
    }

    return (
        <div
            style={{
                ...style,
                ...font,
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                background: c.bg,
                borderRadius: cornerRadius,
                border: `1px solid ${c.border}`,
                boxShadow: shadow
                    ? "0 16px 48px -16px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.06)"
                    : "none",
                color: c.text,
                fontSize: 14,
                lineHeight: 1.4,
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                }}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: post.avatar
                            ? `url(${post.avatar}) center/cover`
                            : "linear-gradient(135deg, #FEDA75, #FA7E1E, #D62976, #962FBF)",
                    }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 600,
                        }}
                    >
                        <span
                            style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {post.username}
                        </span>
                        {post.verified && <Verified />}
                        <span style={{ color: c.secondary, fontWeight: 400 }}>
                            · {post.timestamp}
                        </span>
                    </div>
                    {post.subtitle && (
                        <div
                            style={{
                                fontSize: 12,
                                color: c.secondary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {post.subtitle}
                        </div>
                    )}
                </div>
                <div
                    style={{
                        fontWeight: 700,
                        letterSpacing: 1,
                        paddingLeft: 8,
                    }}
                >
                    ···
                </div>
            </div>

            {/* Media box — clips whichever source is active */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: `${boxAspect}`,
                    overflow: "hidden",
                    background: c.placeholder,
                }}
            >
                {isStatic ? (
                    <StaticMedia
                        poster={video.poster}
                        focus={video.focus}
                        c={c}
                    />
                ) : isEmbed ? (
                    embedSrc && (
                        <iframe
                            key={embedSrc}
                            src={embedSrc}
                            title={post.username}
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                            allowFullScreen
                            style={{
                                position: "absolute",
                                border: 0,
                                display: "block",
                                pointerEvents: video.controls ? "auto" : "none",
                                ...iframeGeometry,
                            }}
                        />
                    )
                ) : fileSrc ? (
                    <video
                        ref={videoRef}
                        src={fileSrc}
                        poster={video.poster || undefined}
                        muted={video.muted}
                        loop={video.loop}
                        controls={video.controls}
                        playsInline
                        preload="auto"
                        disablePictureInPicture
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: `50% ${video.focus * 100}%`,
                            display: "block",
                        }}
                    />
                ) : (
                    <StaticMedia
                        poster={video.poster}
                        focus={video.focus}
                        c={c}
                    />
                )}
            </div>

            {/* Actions */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "10px 12px 6px",
                }}
            >
                <Icon
                    d={ICON.heart}
                    filled={engagement.liked}
                    color={engagement.liked ? c.heart : c.text}
                    strokeWidth={engagement.liked ? 0 : 2}
                />
                <Icon d={ICON.comment} color={c.text} />
                <Icon d={ICON.share} color={c.text} />
                <div style={{ marginLeft: "auto" }}>
                    <Icon
                        d={ICON.bookmark}
                        filled={engagement.saved}
                        color={c.text}
                        strokeWidth={engagement.saved ? 0 : 2}
                    />
                </div>
            </div>

            {/* Meta */}
            <div style={{ padding: "0 12px 12px" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {likesText} likes
                </div>
                <div style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{post.username}</span>{" "}
                    <span>{post.caption}</span>
                    {post.captionTruncated && (
                        <span style={{ color: c.secondary }}> ... more</span>
                    )}
                </div>
                {engagement.showCommentCount && (
                    <div style={{ color: c.secondary, marginBottom: 4 }}>
                        View all {commentsText} comments
                    </div>
                )}
                {comments.showComments && (
                    <>
                        <CommentRow
                            username={comments.firstUsername}
                            text={comments.firstText}
                            c={c}
                        />
                        <CommentRow
                            username={comments.secondUsername}
                            text={comments.secondText}
                            c={c}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

function CommentRow({ username, text, c }) {
    if (!username && !text) return null
    return (
        <div
            style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                marginBottom: 2,
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{username}</span>{" "}
                <span>{text}</span>
            </div>
            <Icon d={ICON.heart} color={c.secondary} size={12} />
        </div>
    )
}

InstagramCard.defaultProps = {
    theme: "light",
    cornerRadius: 8,
    shadow: true,
    video: {
        source: "file",
        src: "",
        url: "",
        poster: "",
        autoplay: true,
        loop: true,
        muted: true,
        controls: false,
        focus: 0.5,
        embedAspect: 1.7778,
    },
    post: {
        username: "artzenmedia",
        verified: true,
        subtitle: "Original Audio!",
        timestamp: "36m",
        avatar: "",
        caption: "Follow for daily effects! 🤝",
        captionTruncated: true,
        mediaAspect: 0.8,
    },
    engagement: {
        likes: 12643,
        liked: true,
        saved: false,
        commentCount: 17344,
        showCommentCount: true,
    },
    comments: {
        showComments: true,
        firstUsername: "janedoe",
        firstText: "I liked the post John. Thanks for sharing.",
        secondUsername: "johnniedoe",
        secondText: "🔥🔥🔥",
    },
}

addPropertyControls(InstagramCard, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        displaySegmentedControl: true,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 32,
        step: 1,
    },
    shadow: { type: ControlType.Boolean, title: "Shadow" },
    video: {
        type: ControlType.Object,
        title: "Video",
        controls: {
            source: {
                type: ControlType.Enum,
                title: "Source",
                options: ["file", "url", "embed"],
                optionTitles: ["Upload", "Video URL", "Embed"],
            },
            src: {
                type: ControlType.File,
                title: "File",
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (p) => p.source !== "file",
            },
            url: {
                type: ControlType.String,
                title: "URL",
                placeholder: "https://…",
                hidden: (p) => p.source === "file",
                description:
                    "Video URL: a direct .mp4/.webm link. Embed: any YouTube or Vimeo link, or another platform's embed URL.",
            },
            poster: {
                type: ControlType.Image,
                title: "Poster",
                description:
                    "Shown on the canvas and in exports, where the video does not play.",
            },
            embedAspect: {
                type: ControlType.Number,
                title: "Ratio",
                min: 0.4,
                max: 2.5,
                step: 0.0001,
                displayStepper: false,
                hidden: (p) => p.source !== "embed",
                description: "1.7778 = 16:9, 0.5625 = 9:16 shorts.",
            },
            autoplay: { type: ControlType.Boolean, title: "Autoplay" },
            loop: { type: ControlType.Boolean, title: "Loop" },
            muted: {
                type: ControlType.Boolean,
                title: "Muted",
                description: "Browsers block autoplay with sound.",
            },
            controls: {
                type: ControlType.Boolean,
                title: "Controls",
                description: "Off keeps the post looking like a real feed.",
            },
            focus: {
                type: ControlType.Number,
                title: "Focus Y",
                min: 0,
                max: 1,
                step: 0.05,
                description: "0 = top of frame, 1 = bottom.",
            },
        },
    },
    post: {
        type: ControlType.Object,
        title: "Post",
        controls: {
            username: { type: ControlType.String, title: "Username" },
            verified: { type: ControlType.Boolean, title: "Verified" },
            subtitle: { type: ControlType.String, title: "Subtitle" },
            timestamp: { type: ControlType.String, title: "Time" },
            avatar: { type: ControlType.Image, title: "Avatar" },
            caption: {
                type: ControlType.String,
                title: "Caption",
                displayTextArea: true,
            },
            captionTruncated: { type: ControlType.Boolean, title: "Show more" },
            mediaAspect: {
                type: ControlType.Number,
                title: "Aspect",
                min: 0.5,
                max: 1.8,
                step: 0.05,
            },
        },
    },
    engagement: {
        type: ControlType.Object,
        title: "Engagement",
        controls: {
            likes: { type: ControlType.Number, title: "Likes", step: 1 },
            liked: { type: ControlType.Boolean, title: "Liked" },
            saved: { type: ControlType.Boolean, title: "Saved" },
            commentCount: {
                type: ControlType.Number,
                title: "Comments",
                step: 1,
            },
            showCommentCount: { type: ControlType.Boolean, title: "View all" },
        },
    },
    comments: {
        type: ControlType.Object,
        title: "Comments",
        controls: {
            showComments: { type: ControlType.Boolean, title: "Show" },
            firstUsername: { type: ControlType.String, title: "User 1" },
            firstText: {
                type: ControlType.String,
                title: "Text 1",
                displayTextArea: true,
            },
            secondUsername: { type: ControlType.String, title: "User 2" },
            secondText: {
                type: ControlType.String,
                title: "Text 2",
                displayTextArea: true,
            },
        },
    },
})
