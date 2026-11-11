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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type Props = {
    heroImage?: string
    profileImage?: string
    productImage?: string
    video1Image?: string
    video2Image?: string
    video3Image?: string
    video4Image?: string
    accent?: string
    orange?: string
    background?: string
}

const NAV = [
    ["dashboard", "Dashboard"],
    ["content", "Content"],
    ["analytics", "Analytics"],
    ["audience", "Audience"],
    ["money", "Monetization"],
    ["community", "Community"],
    ["settings", "Settings"],
]

const VIDEOS = [
    ["Build an Amazing Back Workout", "16.3K", "13:21", "17.54%", "$420"],
    ["How to Train the Muscles at Home", "14.8K", "17:34", "38.54%", "$310"],
    ["My Creative Process", "12.6K", "11:08", "21.20%", "$298"],
    ["Productive Morning Routine", "10.9K", "09:42", "18.72%", "$210"],
]

export default function EditorialAnalyticsDashboard(props: Props) {
    const {
        heroImage,
        profileImage,
        productImage,
        video1Image,
        video2Image,
        video3Image,
        video4Image,
        accent = "#CDEFA4",
        orange = "#F06A18",
        background = "#292728",
    } = props

    const [activeNav, setActiveNav] = React.useState("Dashboard")

    const images = [video1Image, video2Image, video3Image, video4Image]

    return (
        <div
            className="analytics-root"
            style={{
                width: "100%",
                boxSizing: "border-box",
                background,
                padding: 26,
                color: "#F7F3F1",
                fontFamily:
                    "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <style>{`
                .analytics-root {
                    container-type: inline-size;
                }

                .dashboard-shell {
                    position: relative;
                    width: 100%;
                    max-width: 1500px;
                    margin: 0 auto;
                    display: flex;
                    overflow: hidden;
                    border-radius: 38px;
                }

                .desktop-sidebar {
                    display: flex;
                    flex-shrink: 0;
                }

                .mobile-nav-wrap {
                    display: none;
                }

                .dashboard-main {
                    position: relative;
                    flex: 1;
                    min-width: 0;
                    padding: 32px 32px 36px;
                    box-sizing: border-box;
                }

                .dashboard-grid {
                    position: relative;
                    z-index: 2;
                    display: grid;
                    grid-template-columns:
                        minmax(0, 1.65fr)
                        minmax(300px, .92fr);
                    gap: 16px;
                    margin-top: 25px;
                }

                .right-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .hero-card {
                    min-height: 455px;
                }

                .hero-copy {
                    width: 46%;
                    min-width: 300px;
                    padding: 49px 34px 145px;
                }

                .hero-overlay {
                    background:
                        linear-gradient(
                            90deg,
                            rgba(43,38,43,.86),
                            rgba(48,39,42,.46) 45%,
                            rgba(30,25,27,.05) 76%
                        );
                }

                .hero-image {
                    object-position: center;
                }

                .kpi-grid {
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                }

                .mobile-profile {
                    display: none;
                }

                .phone-date {
                    display: flex;
                }

                .video-desktop-header {
                    display: grid;
                }

                .video-row {
                    grid-template-columns:
                        minmax(0,2fr)
                        .6fr
                        .9fr
                        .7fr
                        .6fr;
                }

                .video-table-header {
                    grid-template-columns:
                        minmax(0,2fr)
                        .6fr
                        .9fr
                        .7fr
                        .6fr;
                }

                .tablet-hidden {
                    display: block;
                }

                .phone-only-value {
                    display: none;
                }

                @container (max-width: 1199px) {
                    .analytics-root {
                        padding: 14px !important;
                    }

                    .dashboard-shell {
                        display: block;
                        border-radius: 32px;
                    }

                    .desktop-sidebar {
                        display: none;
                    }

                    .mobile-nav-wrap {
                        display: flex;
                    }

                    .dashboard-main {
                        padding: 25px 22px 24px;
                    }

                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }

                    .right-grid {
                        grid-template-columns:
                            repeat(2, minmax(0,1fr));
                    }

                    .hero-card {
                        min-height: 460px;
                    }

                    .mobile-profile {
                        display: flex;
                    }

                    .video-row {
                        grid-template-columns:
                            minmax(0,1fr)
                            80px
                            100px;
                    }

                    .video-table-header {
                        grid-template-columns:
                            minmax(0,1fr)
                            80px
                            100px;
                    }

                    .tablet-hidden {
                        display: none !important;
                    }
                }

                @container (max-width: 620px) {
                    .analytics-root {
                        padding: 8px !important;
                    }

                    .dashboard-shell {
                        border-radius: 24px;
                    }

                    .dashboard-main {
                        padding: 18px 14px 16px;
                    }

                    .dashboard-grid {
                        margin-top: 18px;
                    }

                    .right-grid {
                        grid-template-columns: 1fr;
                    }

                    .hero-card {
                        min-height: 540px;
                    }

                    .hero-copy {
                        width: auto;
                        min-width: 0;
                        padding: 32px 24px 190px;
                    }

                    .hero-overlay {
                        background:
                            linear-gradient(
                                180deg,
                                rgba(40,35,39,.78),
                                rgba(40,35,39,.08) 65%
                            );
                    }

                    .hero-image {
                        object-position: 62% center;
                    }

                    .kpi-grid {
                        grid-template-columns:
                            repeat(2,minmax(0,1fr));
                    }

                    .phone-date {
                        display: none !important;
                    }

                    .video-desktop-header {
                        display: none !important;
                    }

                    .video-row {
                        grid-template-columns:
                            minmax(0,1fr) auto;
                    }

                    .phone-only-value {
                        display: block;
                    }

                    .phone-hide {
                        display: none !important;
                    }
                }
            `}</style>

            <div
                className="dashboard-shell"
                style={{
                    background:
                        "linear-gradient(135deg,#464247,#383536 52%,#302F2F)",
                    border: "1px solid rgba(255,255,255,.08)",
                    boxShadow: "0 30px 80px rgba(0,0,0,.28)",
                }}
            >
                <div className="desktop-sidebar">
                    <Sidebar
                        orange={orange}
                        profileImage={profileImage}
                        active={activeNav}
                        setActive={setActiveNav}
                    />
                </div>

                <div className="mobile-nav-wrap">
                    <MobileNav
                        orange={orange}
                        active={activeNav}
                        setActive={setActiveNav}
                    />
                </div>

                <main className="dashboard-main">
                    <Glow orange={orange} />

                    <Header />

                    <div className="dashboard-grid">
                        <Hero
                            heroImage={heroImage}
                            accent={accent}
                            orange={orange}
                        />

                        <div className="right-grid">
                            <ActiveUsers accent={accent} />

                            <LatestSales
                                productImage={productImage}
                                accent={accent}
                                orange={orange}
                            />
                        </div>
                    </div>

                    <VideoTable
                        images={images}
                        accent={accent}
                        orange={orange}
                    />

                    <div
                        className="mobile-profile"
                        style={{
                            marginTop: 14,
                            justifyContent: "flex-end",
                        }}
                    >
                        <Profile profileImage={profileImage} compact />
                    </div>
                </main>
            </div>
        </div>
    )
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
    const p = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }

    switch (name) {
        case "dashboard":
            return (
                <svg {...p}>
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                </svg>
            )

        case "content":
            return (
                <svg {...p}>
                    <rect x="4" y="3" width="16" height="18" rx="3" />
                    <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
            )

        case "analytics":
            return (
                <svg {...p}>
                    <path d="M4 19V10M10 19V5M16 19v-7M22 19H2" />
                </svg>
            )

        case "audience":
            return (
                <svg {...p}>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6" />
                    <circle cx="17" cy="9" r="2.2" />
                    <path d="M15.5 14c3.2-.2 5 1.5 5.5 4.5" />
                </svg>
            )

        case "money":
            return (
                <svg {...p}>
                    <rect x="3" y="5" width="18" height="14" rx="4" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M7 9H6M18 15h-1" />
                </svg>
            )

        case "community":
            return (
                <svg {...p}>
                    <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.5-4.5A8.4 8.4 0 1 1 21 11.5Z" />
                    <path d="M8 12h.01M12 12h.01M16 12h.01" />
                </svg>
            )

        case "settings":
            return (
                <svg {...p}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
                </svg>
            )

        case "calendar":
            return (
                <svg {...p}>
                    <rect x="3" y="5" width="18" height="16" rx="3" />
                    <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
            )

        case "bell":
            return (
                <svg {...p}>
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                </svg>
            )

        case "play":
            return (
                <svg {...p} fill="currentColor" stroke="none">
                    <path d="m9 7 8 5-8 5V7Z" />
                </svg>
            )

        default:
            return null
    }
}

function Sidebar({ orange, profileImage, active, setActive }: any) {
    return (
        <aside
            style={{
                width: 178,
                flexShrink: 0,
                padding: "25px 15px 20px",
                display: "flex",
                flexDirection: "column",
                background: "linear-gradient(180deg,#171718,#101011)",
                borderRight: "1px solid rgba(255,255,255,.055)",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: 43,
                    height: 43,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 14,
                    background: "rgba(255,255,255,.07)",
                    marginBottom: 28,
                }}
            >
                <Icon name="analytics" size={20} />
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                }}
            >
                {NAV.map(([icon, label]) => (
                    <NavItem
                        key={label}
                        icon={icon}
                        label={label}
                        active={active === label}
                        orange={orange}
                        onClick={() => setActive(label)}
                    />
                ))}
            </div>

            <div style={{ flex: 1, minHeight: 80 }} />

            <Profile profileImage={profileImage} compact={false} />
        </aside>
    )
}

function NavItem({ icon, label, active, orange, onClick }: any) {
    const [hover, setHover] = React.useState(false)

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: "100%",
                height: 44,
                border: 0,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                gap: 11,
                borderRadius: 14,
                cursor: "pointer",
                color: active || hover ? "#FFF" : "#AAA5A3",
                background: active
                    ? `linear-gradient(90deg,${hexAlpha(
                          orange,
                          0.35
                      )},rgba(255,255,255,.06))`
                    : hover
                      ? "rgba(255,255,255,.055)"
                      : "transparent",
                transform: hover ? "translateX(3px)" : "translateX(0)",
                transition: "all .2s ease",
                fontSize: 11,
                textAlign: "left",
            }}
        >
            <span
                style={{
                    width: 20,
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <Icon name={icon} />
            </span>

            {label}
        </button>
    )
}

function MobileNav({ orange, active, setActive }: any) {
    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                gap: 7,
                padding: "14px 16px 0",
                overflowX: "auto",
                boxSizing: "border-box",
                scrollbarWidth: "none",
            }}
        >
            {NAV.map(([icon, label]) => {
                const selected = active === label

                return (
                    <button
                        key={label}
                        onClick={() => setActive(label)}
                        style={{
                            height: 42,
                            minWidth: 42,
                            padding: "0 13px",
                            border: 0,
                            borderRadius: 13,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                            color: selected ? "#FFF" : "#B7B0AD",
                            background: selected
                                ? hexAlpha(orange, 0.28)
                                : "rgba(255,255,255,.045)",
                            cursor: "pointer",
                            flexShrink: 0,
                        }}
                    >
                        <Icon name={icon} size={16} />

                        <span className="phone-hide" style={{ fontSize: 9 }}>
                            {label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

function Header() {
    const [dateHover, setDateHover] = React.useState(false)

    return (
        <header
            style={{
                position: "relative",
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
            }}
        >
            <div>
                <div
                    style={{
                        color: "#AAA3A0",
                        fontSize: 9,
                        marginBottom: 5,
                    }}
                >
                    Overview
                </div>

                <div
                    style={{
                        fontSize: "clamp(22px,3cqw,28px)",
                        lineHeight: 1,
                        fontWeight: 620,
                        letterSpacing: "-.035em",
                    }}
                >
                    Channel Analytics
                </div>
            </div>

            <div
                className="phone-date"
                style={{
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <button
                    onMouseEnter={() => setDateHover(true)}
                    onMouseLeave={() => setDateHover(false)}
                    style={{
                        height: 38,
                        padding: "0 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,.09)",
                        background: dateHover
                            ? "rgba(255,255,255,.10)"
                            : "rgba(20,20,20,.18)",
                        color: "#D6CFCC",
                        fontSize: 10,
                        cursor: "pointer",
                        transform: dateHover ? "translateY(-2px)" : "none",
                        transition: "all .2s ease",
                    }}
                >
                    <Icon name="calendar" size={15} />1 – 30 Sep, 2026
                </button>

                <HoverCircle>
                    <Icon name="bell" size={16} />
                </HoverCircle>
            </div>
        </header>
    )
}

function HoverCircle({ children }: any) {
    const [hover, setHover] = React.useState(false)

    return (
        <button
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: 38,
                height: 38,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,.09)",
                background: hover
                    ? "rgba(255,255,255,.11)"
                    : "rgba(20,20,20,.18)",
                color: "#DDD6D3",
                cursor: "pointer",
                transform: hover ? "translateY(-2px)" : "none",
                transition: "all .2s ease",
            }}
        >
            {children}
        </button>
    )
}

function Hero({ heroImage, accent, orange }: any) {
    const [buttonHover, setButtonHover] = React.useState(false)

    return (
        <div
            className="hero-card"
            style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 31,
                background: "linear-gradient(120deg,#706673,#94716C,#C9683D)",
                border: "1px solid rgba(255,255,255,.10)",
            }}
        >
            {heroImage && (
                <img
                    className="hero-image"
                    src={heroImage}
                    alt=""
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            )}

            <div
                className="hero-overlay"
                style={{
                    position: "absolute",
                    inset: 0,
                }}
            />

            <div
                className="hero-copy"
                style={{
                    position: "relative",
                    zIndex: 2,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        fontSize: 9,
                        letterSpacing: ".1em",
                        color: "#E5D1CA",
                        marginBottom: 13,
                    }}
                >
                    POPULAR SOLUTION
                </div>

                <h1
                    style={{
                        margin: 0,
                        fontSize: "clamp(38px,4.3cqw,51px)",
                        lineHeight: 0.98,
                        letterSpacing: "-.045em",
                        fontWeight: 570,
                    }}
                >
                    Optimize
                    <br />
                    Your Metrics
                </h1>

                <p
                    style={{
                        margin: "15px 0 0",
                        maxWidth: 270,
                        color: "#D8CECB",
                        fontSize: 11,
                        lineHeight: 1.55,
                    }}
                >
                    Track your growth, understand your audience and turn
                    insights into momentum.
                </p>

                <button
                    onMouseEnter={() => setButtonHover(true)}
                    onMouseLeave={() => setButtonHover(false)}
                    style={{
                        marginTop: 21,
                        minWidth: 145,
                        padding: "12px 20px",
                        border: 0,
                        borderRadius: 14,
                        background: "#F7F3F1",
                        color: "#242122",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        transform: buttonHover ? "translateY(-3px)" : "none",
                        boxShadow: buttonHover
                            ? "0 12px 28px rgba(0,0,0,.25)"
                            : "none",
                        transition: "all .22s ease",
                    }}
                >
                    Start Now
                </button>
            </div>

            <Kpis accent={accent} orange={orange} />
        </div>
    )
}

function Kpis({ accent, orange }: any) {
    const metrics = [
        ["76K", "Users", accent],
        ["1.5M", "Clicks", "#E6B8C6"],
        ["$3.6K", "Sales", orange],
        ["47", "Items", "#EAB9A5"],
    ]

    return (
        <div
            className="kpi-grid"
            style={{
                position: "absolute",
                zIndex: 4,
                left: 17,
                right: 17,
                bottom: 16,
                display: "grid",
                overflow: "hidden",
                borderRadius: 23,
                background:
                    "linear-gradient(90deg,rgba(112,101,106,.75),rgba(118,84,70,.68))",
                border: "1px solid rgba(255,255,255,.13)",
                backdropFilter: "blur(25px)",
                WebkitBackdropFilter: "blur(25px)",
            }}
        >
            {metrics.map((metric, index) => (
                <Kpi key={metric[1]} metric={metric} index={index} />
            ))}
        </div>
    )
}

function Kpi({ metric, index }: any) {
    const [hover, setHover] = React.useState(false)

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                padding: "16px 14px",
                background: hover ? "rgba(255,255,255,.08)" : "transparent",
                transform: hover ? "translateY(-3px)" : "none",
                transition: "all .2s ease",
                borderRight:
                    index < 3 ? "1px solid rgba(255,255,255,.08)" : "none",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    fontSize: 24,
                    fontWeight: 580,
                }}
            >
                {metric[0]}
            </div>

            <div
                style={{
                    color: "#D5CDCA",
                    fontSize: 8,
                    marginTop: 4,
                }}
            >
                {metric[1]}
            </div>

            <div
                style={{
                    width: "65%",
                    height: 2,
                    marginTop: 8,
                    borderRadius: 999,
                    background: metric[2],
                }}
            />
        </div>
    )
}

function InteractiveCard({ children, style }: any) {
    const [hover, setHover] = React.useState(false)

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                padding: 20,
                borderRadius: 27,
                background: hover
                    ? "linear-gradient(145deg,rgba(145,132,130,.36),rgba(78,73,74,.35))"
                    : "linear-gradient(145deg,rgba(137,126,124,.27),rgba(73,69,70,.30))",
                border: hover
                    ? "1px solid rgba(255,255,255,.16)"
                    : "1px solid rgba(255,255,255,.09)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: hover
                    ? "0 24px 48px rgba(0,0,0,.22)"
                    : "0 16px 35px rgba(0,0,0,.12)",
                transform: hover ? "translateY(-4px)" : "none",
                transition: "all .25s ease",
                boxSizing: "border-box",
                ...style,
            }}
        >
            {children}
        </div>
    )
}

function ActiveUsers({ accent }: any) {
    return (
        <InteractiveCard
            style={{
                minHeight: 263,
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        Active Users right now
                    </div>

                    <div
                        style={{
                            marginTop: 9,
                            fontSize: 28,
                            fontWeight: 620,
                        }}
                    >
                        28.4K
                    </div>
                </div>

                <div
                    style={{
                        height: 28,
                        padding: "0 10px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 999,
                        color: accent,
                        background: "rgba(205,239,164,.09)",
                        fontSize: 9,
                    }}
                >
                    ↑ 12%
                </div>
            </div>

            <svg
                viewBox="0 0 360 125"
                style={{
                    width: "100%",
                    marginTop: 12,
                    overflow: "visible",
                }}
            >
                {[25, 55, 85, 115].map((y) => (
                    <line
                        key={y}
                        x1="0"
                        x2="360"
                        y1={y}
                        y2={y}
                        stroke="rgba(255,255,255,.06)"
                    />
                ))}

                <path
                    d="M0 105 C35 95,45 55,80 62 S130 90,160 52 S210 25,235 64 S285 86,315 42 S345 48,360 65"
                    fill="none"
                    stroke={accent}
                    strokeWidth="2.3"
                    strokeLinecap="round"
                />

                <path
                    d="M0 112 C40 80,70 72,105 82 S155 110,190 75 S235 44,270 66 S320 40,360 83"
                    fill="none"
                    stroke="#E5C322"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                <circle cx="315" cy="42" r="4" fill="#E5C322" />
            </svg>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#AAA3A0",
                    fontSize: 8,
                }}
            >
                <span>Oct</span>
                <span>Mar</span>
                <span>Jul</span>
                <span>Aug</span>
            </div>
        </InteractiveCard>
    )
}

/* ÇANTA ALANI GENİŞLETİLMİŞ VERSİYON */
function LatestSales({ productImage, accent, orange }: any) {
    const [imageHover, setImageHover] = React.useState(false)

    return (
        <InteractiveCard
            style={{
                minHeight: 176,
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(150px,42%)",
                gap: 16,
            }}
        >
            <div>
                <div
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    Latest Sales
                </div>

                <div
                    style={{
                        marginTop: 17,
                        color: accent,
                        fontSize: 31,
                        fontWeight: 620,
                    }}
                >
                    $586
                </div>

                <div
                    style={{
                        color: "#C3BBB8",
                        fontSize: 9,
                        marginTop: 7,
                    }}
                >
                    ↑ 6% total earnings
                </div>

                <div
                    style={{
                        width: 70,
                        height: 2,
                        background: orange,
                        marginTop: 14,
                    }}
                />
            </div>

            <div
                onMouseEnter={() => setImageHover(true)}
                onMouseLeave={() => setImageHover(false)}
                style={{
                    overflow: "hidden",
                    minHeight: 145,
                    borderRadius: 20,
                    background: "rgba(255,255,255,.09)",
                }}
            >
                {productImage && (
                    <img
                        src={productImage}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            transform: imageHover ? "scale(1.07)" : "scale(1)",
                            transition: "transform .35s ease",
                        }}
                    />
                )}
            </div>
        </InteractiveCard>
    )
}

function VideoTable({ images, accent, orange }: any) {
    return (
        <InteractiveCard
            style={{
                position: "relative",
                zIndex: 2,
                marginTop: 16,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        fontSize: 15,
                        fontWeight: 600,
                    }}
                >
                    Your top videos in this period
                </div>

                <div
                    className="phone-hide"
                    style={{
                        padding: "9px 13px",
                        borderRadius: 13,
                        background: "rgba(255,255,255,.08)",
                        color: "#D4CDCA",
                        fontSize: 9,
                    }}
                >
                    Popularity ↓
                </div>
            </div>

            <div
                className="video-desktop-header video-table-header"
                style={{
                    gap: 14,
                    padding: "17px 10px 11px",
                    borderBottom: "1px solid rgba(255,255,255,.10)",
                    color: "#AFA8A5",
                    fontSize: 8,
                }}
            >
                <span>Video</span>
                <span>Views</span>
                <span>Avg. duration</span>

                <span className="tablet-hidden">Engagement</span>

                <span className="tablet-hidden">Revenue</span>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                    marginTop: 9,
                }}
            >
                {VIDEOS.map((video, index) => (
                    <VideoRow
                        key={video[0]}
                        video={video}
                        image={images[index]}
                        index={index}
                        accent={accent}
                        orange={orange}
                    />
                ))}
            </div>
        </InteractiveCard>
    )
}

function VideoRow({ video, image, index, accent }: any) {
    const [hover, setHover] = React.useState(false)

    return (
        <div
            className="video-row"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: "grid",
                gap: 14,
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 17,
                background: hover
                    ? "rgba(255,255,255,.10)"
                    : "rgba(255,255,255,.045)",
                border: hover
                    ? "1px solid rgba(255,255,255,.12)"
                    : "1px solid rgba(255,255,255,.04)",
                transform: hover ? "translateX(4px)" : "none",
                transition: "all .22s ease",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                }}
            >
                <div
                    className="phone-hide"
                    style={{
                        width: 25,
                        height: 25,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 8,
                        background:
                            index === 0
                                ? "rgba(240,106,24,.18)"
                                : "rgba(255,255,255,.06)",
                        fontSize: 8,
                    }}
                >
                    {index + 1}
                </div>

                <div
                    style={{
                        position: "relative",
                        width: 72,
                        height: 47,
                        flexShrink: 0,
                        overflow: "hidden",
                        borderRadius: 11,
                        background: "#5D5553",
                    }}
                >
                    {image && (
                        <img
                            src={image}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: hover ? "scale(1.09)" : "scale(1)",
                                transition: "transform .35s ease",
                            }}
                        />
                    )}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            background: hover
                                ? "rgba(0,0,0,.28)"
                                : "transparent",
                            opacity: hover ? 1 : 0,
                            transition: "all .2s ease",
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,.9)",
                                color: "#252223",
                            }}
                        >
                            <Icon name="play" size={14} />
                        </div>
                    </div>
                </div>

                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {video[0]}
                    </div>

                    <div
                        style={{
                            marginTop: 4,
                            color: "#A79F9C",
                            fontSize: 8,
                        }}
                    >
                        Creator Series
                    </div>
                </div>
            </div>

            <span className="phone-hide" style={valueStyle}>
                {video[1]}
            </span>

            <span className="phone-hide" style={valueStyle}>
                {video[2]}
            </span>

            <span
                className="tablet-hidden phone-hide"
                style={{
                    ...valueStyle,
                    color: index % 2 === 0 ? "#E5C322" : accent,
                }}
            >
                {video[3]}
            </span>

            <span className="tablet-hidden phone-hide" style={valueStyle}>
                {video[4]}
            </span>

            <div
                className="phone-only-value"
                style={{
                    textAlign: "right",
                    fontSize: 8,
                    color: "#CFC8C5",
                }}
            >
                <div>{video[1]}</div>

                <div
                    style={{
                        color: accent,
                        marginTop: 3,
                    }}
                >
                    {video[3]}
                </div>
            </div>
        </div>
    )
}

function Profile({ profileImage, compact }: any) {
    const [hover, setHover] = React.useState(false)

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: compact ? 0 : "9px 6px",
            }}
        >
            <div
                style={{
                    width: compact ? 32 : 38,
                    height: compact ? 32 : 38,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "linear-gradient(135deg,#D1A08A,#72534C)",
                    transform: hover ? "scale(1.07)" : "scale(1)",
                    transition: "transform .2s ease",
                }}
            >
                {profileImage && (
                    <img
                        src={profileImage}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )}
            </div>

            <div>
                <div
                    style={{
                        fontSize: 10,
                        fontWeight: 650,
                    }}
                >
                    Creator
                </div>

                <div
                    style={{
                        marginTop: 2,
                        color: "#8E8885",
                        fontSize: 8,
                    }}
                >
                    Analytics
                </div>
            </div>
        </div>
    )
}

function Glow({ orange }: any) {
    return (
        <>
            <div
                style={{
                    position: "absolute",
                    width: 450,
                    height: 450,
                    top: -180,
                    left: "20%",
                    borderRadius: "50%",
                    background: "rgba(155,123,147,.16)",
                    filter: "blur(120px)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    width: 420,
                    height: 420,
                    right: -160,
                    bottom: -100,
                    borderRadius: "50%",
                    background: orange,
                    opacity: 0.08,
                    filter: "blur(120px)",
                    pointerEvents: "none",
                }}
            />
        </>
    )
}

const valueStyle: React.CSSProperties = {
    color: "#DDD6D3",
    fontSize: 9,
}

function hexAlpha(hex: string, alpha: number) {
    if (!hex || !hex.startsWith("#")) {
        return `rgba(240,106,24,${alpha})`
    }

    let value = hex.slice(1)

    if (value.length === 3) {
        value = value
            .split("")
            .map((x) => x + x)
            .join("")
    }

    const r = parseInt(value.slice(0, 2), 16)
    const g = parseInt(value.slice(2, 4), 16)
    const b = parseInt(value.slice(4, 6), 16)

    return `rgba(${r},${g},${b},${alpha})`
}

addPropertyControls(EditorialAnalyticsDashboard, {
    heroImage: {
        type: ControlType.Image,
        title: "Hero Image",
    },

    profileImage: {
        type: ControlType.Image,
        title: "Profile Image",
    },

    productImage: {
        type: ControlType.Image,
        title: "Product Image",
    },

    video1Image: {
        type: ControlType.Image,
        title: "Video 1 Image",
    },

    video2Image: {
        type: ControlType.Image,
        title: "Video 2 Image",
    },

    video3Image: {
        type: ControlType.Image,
        title: "Video 3 Image",
    },

    video4Image: {
        type: ControlType.Image,
        title: "Video 4 Image",
    },

    accent: {
        type: ControlType.Color,
        title: "Lime",
        defaultValue: "#CDEFA4",
    },

    orange: {
        type: ControlType.Color,
        title: "Orange",
        defaultValue: "#F06A18",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#292728",
    },
})
