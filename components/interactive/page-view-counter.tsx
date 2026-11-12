/**
 * Page View Counter Component
 *
 * Tracks and displays page views using Supabase as the backend.
 * Automatically detects the current page pathname and increments the view count.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Create a table called 'page_views' with the following SQL:
 *
 *    CREATE TABLE page_views (
 *      id BIGSERIAL PRIMARY KEY,
 *      slug TEXT UNIQUE NOT NULL,
 *      views INTEGER DEFAULT 0,
 *      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 *    );
 *
 * 3. Enable Row Level Security (RLS) and add policies:
 *
 *    -- Allow public read access
 *    CREATE POLICY "Allow public read access" ON page_views
 *      FOR SELECT USING (true);
 *
 *    -- Allow public insert access
 *    CREATE POLICY "Allow public insert access" ON page_views
 *      FOR INSERT WITH CHECK (true);
 *
 *    -- Allow public update access
 *    CREATE POLICY "Allow public update access" ON page_views
 *      FOR UPDATE USING (true);
 *
 * 4. Get your Supabase URL and Anon Key from Project Settings > API
 * 5. Add them to the component's property controls in Framer
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

import { useEffect, useState, useRef, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring, useTransform } from "framer-motion"

interface PageViewCounterProps {
    supabaseUrl: string
    supabaseAnonKey: string
    prefix: string
    suffix: string
    showIcon: boolean
    icon: string
    iconImage: { src: string; srcSet?: string; alt?: string }
    iconSize: number
    iconBackground: string
    iconPadding: number
    textColor: string
    countFont: any
    font: any
    alignment: "left" | "center" | "right"
    gap: number
    background: string
    borderRadius: number
    padding: number
}

export default function PageViewCounter(props: PageViewCounterProps) {
    const isStatic = useIsStaticRenderer()

    const {
        supabaseUrl = "",
        supabaseAnonKey = "",
        prefix = "",
        suffix = " Views",
        showIcon = true,
        icon = "👁",
        iconImage = {
            src: "data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%3E%3Cpath%20d='M12%205C7%205%202.73%208.11%201%2012c1.73%203.89%206%207%2011%207s9.27-3.11%2011-7c-1.73-3.89-6-7-11-7Z'%20stroke='%23000'%20stroke-width='2'/%3E%3Ccircle%20cx='12'%20cy='12'%20r='3'%20fill='%23000'/%3E%3C/svg%3E",
            alt: "Eye icon",
        },
        iconSize = 20,
        iconBackground = "#FFFFFF",
        iconPadding = 6,
        textColor = "#000000",
        countFont,
        font,
        alignment = "left",
        gap = 12,
        background = "#2B2B2B",
        borderRadius = 18,
        padding = 14,
    } = props

    const [views, setViews] = useState<number>(() => (isStatic ? 1234 : 0))
    const [isLoading, setIsLoading] = useState(() => !isStatic)
    const [error, setError] = useState<string | null>(null)
    const hasIncrementedRef = useRef(false)

    // Validate configured Supabase URL to prevent misconfiguration
    const supabaseValidationError = useMemo(() => {
        if (!supabaseUrl) return null
        if (typeof window === "undefined") return null

        try {
            const u = new URL(supabaseUrl)
            const host = u.hostname.toLowerCase()
            const isSupabaseHosted =
                u.protocol === "https:" &&
                (host.endsWith(".supabase.co") || host.endsWith(".supabase.in"))

            if (!isSupabaseHosted) {
                return "Invalid Supabase URL. Expected a hosted Supabase project URL like https://xxxxx.supabase.co"
            }
        } catch {
            return "Invalid Supabase URL. Expected a hosted Supabase project URL like https://xxxxx.supabase.co"
        }

        return null
    }, [supabaseUrl])

    const normalizedSupabaseUrl = useMemo(() => {
        return supabaseUrl ? supabaseUrl.replace(/\/+$/, "") : ""
    }, [supabaseUrl])

    // Animated number using Framer Motion (disabled in static renderer)
    const springValue = useSpring(0,
        isStatic
            ? { duration: 0 }
            : {
                  duration: 800,
                  bounce: 0,
              }
    )

    const displayValue = useTransform(springValue, (latest) => {
        return formatNumber(Math.round(latest))
    })

    // Format number with commas
    function formatNumber(num: number): string {
        return num.toLocaleString("en-US")
    }

    // Get current page pathname
    function getCurrentSlug(): string {
        if (typeof window === "undefined") return "/"
        return window.location.pathname || "/"
    }

    // Increment page view count using Supabase REST API
    async function incrementPageView() {
        if (!supabaseUrl || !supabaseAnonKey) {
            startTransition(() => {
                setError(
                    "Please add your Supabase URL and Anon Key in the property controls"
                )
                setIsLoading(false)
            })
            return
        }

        if (supabaseValidationError) {
            startTransition(() => {
                setError(supabaseValidationError)
                setIsLoading(false)
            })
            return
        }

        // Prevent duplicate increments (React Strict Mode protection)
        if (hasIncrementedRef.current) return
        hasIncrementedRef.current = true

        try {
            const slug = getCurrentSlug()
            const apiUrl = `${normalizedSupabaseUrl}/rest/v1/page_views`
            const headers = {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
            }

            // First, try to get the current view count
            const fetchResponse = await fetch(
                `${apiUrl}?slug=eq.${encodeURIComponent(slug)}&select=views`,
                {
                    method: "GET",
                    headers,
                }
            )

            if (!fetchResponse.ok) {
                throw new Error(
                    `Failed to fetch views: ${fetchResponse.statusText}`
                )
            }

            const existingData = await fetchResponse.json()
            let newViews = 1

            if (existingData && existingData.length > 0) {
                // Record exists, get current value and increment
                const currentViews = existingData[0].views
                newViews = currentViews + 1

                // Set spring to current value first (no animation on initial load)
                springValue.set(currentViews)

                // Update the record using RPC or direct update
                const updateResponse = await fetch(
                    `${apiUrl}?slug=eq.${encodeURIComponent(slug)}`,
                    {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({
                            views: newViews,
                            updated_at: new Date().toISOString(),
                        }),
                    }
                )

                if (!updateResponse.ok) {
                    throw new Error(
                        `Failed to update views: ${updateResponse.statusText}`
                    )
                }
            } else {
                // Record doesn't exist, create it with views = 1
                const insertResponse = await fetch(apiUrl, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        slug,
                        views: 1,
                        updated_at: new Date().toISOString(),
                    }),
                })

                if (!insertResponse.ok) {
                    throw new Error(
                        `Failed to insert views: ${insertResponse.statusText}`
                    )
                }
            }

            // Animate to new value
            startTransition(() => {
                setViews(newViews)
                springValue.set(newViews)
                setIsLoading(false)
            })
        } catch (err) {
            console.error("Error incrementing page view:", err)
            startTransition(() => {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load page views"
                )
                setIsLoading(false)
            })
        }
    }

    // Run on mount (skip in static renderer)
    useEffect(() => {
        if (isStatic) return
        incrementPageView()
    }, [isStatic])

    // Render loading state
    if (isLoading) {
        return (
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: alignment,
                    gap: `${gap}px`,
                    background,
                    borderRadius: `${borderRadius}px`,
                    padding: `${padding}px`,
                    color: textColor,
                    ...font,
                    opacity: 0.5,
                    width: "max-content",
                    position: "relative",
                }}
            >
                {showIcon && (
                    <span
                        style={{
                            width: `${iconSize + iconPadding * 2}px`,
                            height: `${iconSize + iconPadding * 2}px`,
                            borderRadius: 999,
                            background: iconBackground,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 0 auto",
                        }}
                    >
                        {iconImage?.src ? (
                            <img
                                src={iconImage.src}
                                srcSet={iconImage.srcSet}
                                alt={iconImage.alt ?? ""}
                                style={{
                                    width: `${iconSize}px`,
                                    height: `${iconSize}px`,
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>{icon}</span>
                        )}
                    </span>
                )}
                <span style={{ whiteSpace: "nowrap", ...(countFont || {}) }}>Loading…</span>
            </div>
        )
    }

    // Render error state
    if (error) {
        return (
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: alignment,
                    gap: `${gap}px`,
                    background,
                    borderRadius: `${borderRadius}px`,
                    padding: `${padding}px`,
                    color: "#FF0000",
                    ...font,
                    width: "max-content",
                    position: "relative",
                }}
            >
                <span>⚠️ {error}</span>
            </div>
        )
    }

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: alignment,
                gap: `${gap}px`,
                background,
                borderRadius: `${borderRadius}px`,
                padding: `${padding}px`,
                color: textColor,
                ...font,
                width: "max-content",
                position: "relative",
            }}
        >
            {showIcon && (
                <span
                    style={{
                        width: `${iconSize + iconPadding * 2}px`,
                        height: `${iconSize + iconPadding * 2}px`,
                        borderRadius: 999,
                        background: iconBackground,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 auto",
                    }}
                >
                    {iconImage?.src ? (
                        <img
                            src={iconImage.src}
                            srcSet={iconImage.srcSet}
                            alt={iconImage.alt ?? ""}
                            style={{
                                width: `${iconSize}px`,
                                height: `${iconSize}px`,
                                objectFit: "contain",
                                display: "block",
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>{icon}</span>
                    )}
                </span>
            )}
            <span style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                {prefix ? <span style={{ ...(font || {}) }}>{prefix}</span> : null}
                {isStatic ? (
                    <span style={{ ...(countFont || {}) }}>{formatNumber(views)}</span>
                ) : (
                    <motion.span style={{ ...(countFont || {}) }}>{displayValue}</motion.span>
                )}
                {suffix ? <span style={{ ...(font || {}) }}>{suffix}</span> : null}
            </span>
        </div>
    )
}

addPropertyControls(PageViewCounter, {
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: "",
        placeholder: "https://xxxxx.supabase.co",
        description: "Your Supabase project URL",
    },
    supabaseAnonKey: {
        type: ControlType.String,
        title: "Supabase Anon Key",
        defaultValue: "",
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        description: "Your Supabase anonymous key",
        obscured: true,
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "e.g., Total: ",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: " Views",
        placeholder: "e.g., views",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    iconImage: {
        type: ControlType.ResponsiveImage,
        title: "Icon Image",
        hidden: ({ showIcon }) => !showIcon,
    },
    icon: {
        type: ControlType.String,
        title: "Fallback Icon",
        defaultValue: "👁",
        hidden: ({ showIcon }) => !showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 20,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
        hidden: ({ showIcon }) => !showIcon,
    },
    iconPadding: {
        type: ControlType.Number,
        title: "Icon Padding",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ showIcon }) => !showIcon,
    },
    iconBackground: {
        type: ControlType.Color,
        title: "Icon Bg",
        defaultValue: "#FFFFFF",
        hidden: ({ showIcon }) => !showIcon,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    countFont: {
        type: ControlType.Font,
        title: "Count Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    font: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#2B2B2B",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 18,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 14,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
})
