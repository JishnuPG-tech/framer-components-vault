import React from "react"

//MOTION
import {
    m,
    useSpring,
    useInView,
    LazyMotion,
    domAnimation,
    useTransform,
    useMotionValue,
    useReducedMotion,
    useMotionTemplate,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { Circle } from "lucide-react"

//TYPING
type FlexBoxAlignProps =
    | `center`
    | `flex-start`
    | `flex-end`
    | `space-between`
    | `space-evenly`

//TYPING
interface LevitatingCardProps {
    light_setting: {
        color: string
        type: "fixed" | "follow cursor"
        spread?: number
        angle?: { x: number; y: number }
    }
    custom_card: React.ReactNode[]
    card_setting: {
        card_color: string
        custom_logo_style: {
            inset_x: number
            inset_y: number
            scale: number
        }
        card_name: string
        card_scale: number
        card_type: "Visa" | "Mastercard" | "Custom"
        holder_name: string
    }

    animation_config: {
        motion_sensitivity: {
            x: number
            y: number
        }
        when_out_of_view: boolean
        reset_to_initial: {
            reset: boolean
            on: "Envoirment Click" | "Card Click" | "Envoirment Leave"
        }
        hover_envoirment: "window" | "self"
        properties_animation: {
            scale: boolean
            drift: boolean
            rotation: boolean
            background: boolean
        }
    }

    physics_config: {
        stiffness: number
        damping: number
        type: "spring" | "tween"
    }
}

const flex_box_alignment = (
    align?: FlexBoxAlignProps,
    justify?: FlexBoxAlignProps
) => ({
    display: "flex",
    alignItems: align || `center`,
    justifyContent: justify || `center`,
})

const card_structure_style: React.CSSProperties = {
    //POSITION
    position: `relative`,

    //SIZE
    width: "280px",
    aspectRatio: "1/0.63",

    //UI
    borderRadius: 12,

    //TYPOGRAPHY
    fontFamily: `"Inter Display", "One Sauce One", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    fontWeight: 400,
    fontSize: `1.1em`,
    color: `#f5f5f5`,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",

    //UX
    userSelect: `none`,

    //PERFORMANCE
    transform: "translateZ(0)",
    willChange: "transform",
    backfaceVisibility: "hidden",

    //DISPLAY
    boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.05),
        0 8px 24px rgba(0, 0, 0, 0.10)
        `,
}
const content_container_style: React.CSSProperties = {
    ...flex_box_alignment(`flex-start`, `space-between`),
    padding: `12px 12px`,
    flexDirection: `column`,
    zIndex: 1,
    width: "100%",
    height: "100%",
    position: `absolute`,
    overflow: `hidden`,
}
const card_content_styles: React.CSSProperties = {
    ...flex_box_alignment(`flex-end`, `space-between`),
    minHeight: `fit-content`,
    width: `100%`,
}
const background_layers_container: React.CSSProperties = {
    position: `absolute`,
    width: "100%",
    height: "100%",
    inset: 0,
    zIndex: -1,
    borderRadius: `inherit`,
    willChange: "background-position, transform",
}
const background_layers: React.CSSProperties = {
    //SIZING
    width: "100%",
    height: "100%",

    //POSITIO
    position: `absolute`,
    inset: 0,

    //UI
    borderRadius: `inherit`,
    willChange: `background-position`,
    backgroundSize: "250% 250%",
    transform: "translateZ(0)",
}
const holder_info_style: React.CSSProperties = {
    ...flex_box_alignment(`flex-start`, `center`),
    flexDirection: `column`,
    gap: 0,
    height: "100%",
    color: `#a3a3a3`,
    userSelect: `none`,
}
const card_circle_style: React.CSSProperties = {
    position: `absolute`,
    left: `100%`,
    top: -40,
    transform: `scale(15) translateX(-2px)`,
    transformOrigin: `center`,
}
const card_header_style: React.CSSProperties = {
    width: "100%",
    height: `max-content`,
    lineHeight: 0,
}
const SIM_card_style: React.CSSProperties = {
    position: `relative`,
    height: `27px`,
    aspectRatio: "1.3/1",
    borderRadius: 4,
    overflow: `hidden`,
}
const card_text_style: React.CSSProperties = {
    display: "inline-block",
    insetBlock: 1.2,

    backgroundImage: `
        linear-gradient(
            110deg,
            #ffffff 0%,
            #cfd6dd 10%,
            #ffffff 20%,
            #8f9aa6 35%,
            #ffffff 50%,
            #b9c2cc 65%,
            #ffffff 80%,
            #9aa6b2 100%
        )
    `,

    filter: "contrast(1.05) saturate(0.9)",
    textShadow: `
        0px 1px 0px rgba(255,255,255,0.12),
        0px -0.8px 0px rgba(0,0,0,0.35)
    `,
    backgroundSize: "300% 100%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",

    color: "transparent",
    WebkitTextFillColor: "transparent",
}

const Aurora_3D_CardComponent = React.memo(
    ({
        type,
        custom_logo_style,
        custome_element,
    }: {
        type: LevitatingCardProps["card_setting"]["card_type"]
        custom_logo_style: LevitatingCardProps["card_setting"]["custom_logo_style"]
        custome_element?: LevitatingCardProps["custom_card"]
    }) => {
        const custom_node = custome_element?.[0]
        const card_type_SRC = React.useMemo<string>(() => {
            switch (type) {
                case "Mastercard":
                    return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/1280px-Mastercard_2019_logo.svg.png"

                case "Visa":
                    return "https://dl.svgcdn.com/svg/logos/visa.svg"

                default:
                    return "https://dl.svgcdn.com/svg/logos/visa.svg"
            }
        }, [type])

        return (
            <m.div
                style={{
                    width:
                        type == "Mastercard"
                            ? 35
                            : type == "Visa"
                              ? 47
                              : `max-content`,
                    height: 32,
                    zIndex: 1,
                    ...(type == "Custom"
                        ? {
                              position: `absolute`,
                              insetInline: custom_node
                                  ? -custom_logo_style.inset_x
                                  : -110,
                              insetBlock: custom_node
                                  ? -custom_logo_style.inset_y
                                  : -15,
                              scale: custom_logo_style.scale,
                          }
                        : {}),
                }}
            >
                {type == "Custom" ? (
                    <>
                        {custom_node || (
                            <small style={{ fontWeight: 300 }}>
                                select a custome logo
                            </small>
                        )}
                    </>
                ) : (
                    <img
                        src={card_type_SRC}
                        alt={`${type} Logo`}
                        style={{
                            filter:
                                type == "Mastercard"
                                    ? "none"
                                    : "brightness(0) invert(1)",
                            width: "100%",
                            height: "auto",
                        }}
                    />
                )}
            </m.div>
        )
    }
)
const SIM_card_Pattern = React.memo(() => (
    <svg
        style={{
            position: `absolute`,
            right: 8,
            transform: "rotate(90deg) scale(1.75) translateX(1px)",
        }}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#c9d0d8"
        strokeWidth=".8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M8 2v4" />
        <path d="M12 2v4" />
        <path d="M16 2v4" />
        <path d="M16 4h2a2 2 0 0 1 2 2v2" />
        <path d="M20 12v2" />
        <path d="M20 18v2a2 2 0 0 1-2 2h-1" />
        <path d="M13 22h-2" />
        <path d="M7 22H6a2 2 0 0 1-2-2v-2" />
        <path d="M4 14v-2" />
        <path d="M4 8V6a2 2 0 0 1 2-2h2" />
        <path d="M8 10h6" />
        <path d="M8 14h8" />
        <path d="M8 18h5" />
    </svg>
))

export default function Aurora_3D_Card(Props: LevitatingCardProps) {
    const [credit_card_info, update_credit_card_info] = React.useState<any>()

    const card_ref = React.useRef<HTMLDivElement>(null)
    const logo_ref = React.useRef<HTMLDivElement>(null)

    //MOTION STATE VALUE
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    //EASING
    const spring_easing = React.useMemo(
        () => ({
            stiffness: Props.physics_config.stiffness,
            damping: Props.physics_config.damping,
            type: Props.physics_config.type,
        }),
        [
            Props.physics_config.stiffness,
            Props.physics_config.damping,
            Props.physics_config.type,
        ]
    )

    //TRANSFORMATION
    const rotateX = useTransform(
        y,
        [-0.5, 0.5],
        [
            Props.animation_config.motion_sensitivity.y,
            -Props.animation_config.motion_sensitivity.y,
        ]
    )
    const rotateZ = useTransform(x, [-0.5, 0.5], [-2, 2])

    const rotateY = useTransform(
        x,
        [-0.5, 0.5],
        [
            -Props.animation_config.motion_sensitivity.x,
            Props.animation_config.motion_sensitivity.x,
        ]
    )

    const text_bg = useTransform(x, [-0.5, 0.5], [`0% 0%`, "100% 0%"])
    const drift_x = useTransform(x, [-0.5, 0.5], [-3, 3])
    const drift_y = useTransform(y, [-0.5, 0.5], [-3, 3])

    const bg_posX = useTransform(x, [-0.5, 0.5], [0, 100])
    const bg_posY = useTransform(y, [-0.5, 0.5], [0, 100])
    const intensity = useTransform([x, y], ([xv, yv]: number[]) => {
        const dx = xv - 0.35
        const dy = yv - 0.35
        const dist = Math.sqrt(dx * dx + dy * dy)
        return Math.max(0.45, Math.exp(-dist * 0.7))
    })

    //IN VIEW
    const in_view = useInView(card_ref)
    const animate = Props.animation_config.properties_animation
    const bg_angle = useTransform([x, y], ([xv, yv]: number[]) => {
        const lx = Props.light_setting?.angle?.x ?? 0
        const ly = Props.light_setting?.angle?.y ?? 0

        const px = xv * Props.animation_config.motion_sensitivity.x
        const py = yv * Props.animation_config.motion_sensitivity.y

        const dx = lx - px
        const dy = ly - py

        return (Math.atan2(dy, dx) * 180) / Math.PI
    })
    const lg_type = Props.light_setting.type

    //REDUCER MOTION
    const reduced_motion_pref = useReducedMotion()

    //TRANSFORMATION EASING
    const rx = useSpring(rotateX, spring_easing)
    const ry = useSpring(rotateY, spring_easing)
    const rz = useSpring(rotateZ, spring_easing)

    const dx = useSpring(drift_x, spring_easing)
    const dy = useSpring(drift_y, spring_easing)

    //CALLBACK — MOUSE
    const handleMouseMove = React.useCallback(
        (e: MouseEvent) => {
            if (!card_ref.current) return

            const rect = card_ref.current.getBoundingClientRect()

            const x_val = (e.clientX - rect.left) / rect.width - 0.5
            const y_val = (e.clientY - rect.top) / rect.height - 0.5

            x.set(x_val)
            y.set(y_val)
        },
        [x, y]
    )

    //CALLBACK — TOUCH
    const handleTouchMove = React.useCallback(
        (e: TouchEvent) => {
            if (e.touches.length === 0) return

            const touch = e.touches[0]

            // Track finger across the full window — same behaviour as
            // mousemove on window, so the card reacts to the whole screen
            const x_val = touch.clientX / window.innerWidth - 0.5
            const y_val = touch.clientY / window.innerHeight - 0.5

            x.set(x_val)
            y.set(y_val)
        },
        [x, y]
    )

    // Reset on touch end — spring physics returns card to neutral fluidly
    const handleTouchEnd = React.useCallback(() => {
        x.set(0)
        y.set(0)
    }, [x, y])

    //USE EFFECT
    React.useEffect(() => {
        const card_element = card_ref?.current

        const hover_target =
            Props.animation_config.hover_envoirment == "window"
                ? window
                : card_element || window

        if (!reduced_motion_pref) {
            hover_target.addEventListener("mousemove", handleMouseMove)

            // Touch listeners on window so the finger is tracked across
            // the entire screen, matching the mouse-on-window behaviour
            window.addEventListener("touchmove", handleTouchMove, {
                passive: true,
            })
            window.addEventListener("touchend", handleTouchEnd, {
                passive: true,
            })
            window.addEventListener("touchcancel", handleTouchEnd, {
                passive: true,
            })
        }

        const clean_up_arr = []

        if (
            Props.animation_config.reset_to_initial.reset &&
            !reduced_motion_pref
        ) {
            const reset_on = Props.animation_config.reset_to_initial.on
            const reset_xy = () => [x, y].forEach((dim) => dim.set(0))

            switch (reset_on) {
                case "Card Click":
                    card_ref.current?.addEventListener("click", reset_xy)
                    clean_up_arr.push(() =>
                        card_ref.current?.removeEventListener("click", reset_xy)
                    )
                    break
                case "Envoirment Click":
                    hover_target.addEventListener("click", reset_xy)
                    clean_up_arr.push(() =>
                        hover_target.removeEventListener("click", reset_xy)
                    )
                    break
                case "Envoirment Leave":
                    hover_target.addEventListener("mouseleave", reset_xy)
                    clean_up_arr.push(() =>
                        hover_target.removeEventListener("mouseleave", reset_xy)
                    )
                    break
            }
        }

        return () => {
            if (!reduced_motion_pref) {
                hover_target.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("touchmove", handleTouchMove)
                window.removeEventListener("touchend", handleTouchEnd)
                window.removeEventListener("touchcancel", handleTouchEnd)
            }
            clean_up_arr.forEach((event) => event())
        }
    }, [
        Props.animation_config.hover_envoirment,
        Props.animation_config.reset_to_initial,
        handleMouseMove,
        handleTouchMove,
        handleTouchEnd,
    ])

    React.useEffect(() => {
        const generateSimpleMastercard = () => {
            const prefix = String(Math.floor(Math.random() * 5) + 51)

            const rest = Array.from({ length: 14 }, () =>
                Math.floor(Math.random() * 10)
            ).join("")

            update_credit_card_info((prefix + rest).slice(0, 16))
        }

        generateSimpleMastercard()
    }, [])

    //MEMO
    const animate_out_view = React.useMemo(
        () => Props.animation_config.when_out_of_view || in_view,
        [Props.animation_config.when_out_of_view, in_view]
    )
    const text_fill_motion = React.useMemo(
        () => ({
            initial: { backgroundPosition: "200% 0%" },
            animate: { backgroundPosition: in_view ? "0% 0%" : "200% 0%" },
            transition: {
                duration: 2,
                ease: "easeInOut",
            },
        }),
        [in_view]
    )

    //MOTION TEMPLATES
    //OUTTLINE
    const fixed_outline = useMotionTemplate`
        linear-gradient(
            ${bg_angle}deg,
            rgba(255,255,255,0.00) 0%,
            rgba(220,225,230,0.10) 18%,
            rgba(255,255,255,0.55) 48%,
            rgba(170,180,190,0.22) 72%,
            rgba(235,240,245,0.06) 88%,
            rgba(255,255,255,0.00) 100%
        )
    `
    const dynamic_outline = useMotionTemplate`
        radial-gradient(
            circle ${(Props.light_setting?.spread || 350) * 2.4}px at ${bg_posX}% ${bg_posY}%,

            rgba(255,255,255,0.45) 0%,
            rgba(255,255,255,0.28) 18%,

            rgba(235,240,245,0.18) 32%,
            rgba(210,220,230,0.10) 48%,

            rgba(180,190,200,0.14) 62%,

            rgba(255,255,255,0.22) 70%,
            rgba(255,255,255,0.08) 82%,

            rgba(150,160,170,0.05) 100%
        )
    `
    //BG
    const fixed_gradient = useMotionTemplate`
         linear-gradient(
            ${bg_angle}deg,
            ${Props.light_setting?.color ?? "#10169f"},
            ${Props.card_setting?.card_color ?? "#0b0b0b"}
        )
    `

    const dynamic_gradient = useMotionTemplate`
        radial-gradient(
            circle at ${bg_posX}% ${bg_posY}%,
            ${Props.light_setting?.color ?? "#10169f"} 0%,
            ${Props.card_setting.card_color} ${(Props.light_setting?.spread || 180) / 2}%
        )
    `
    const bg_post = useMotionTemplate`${bg_posX}% ${bg_posY}%`

    const bg_imgs = lg_type == "fixed" ? fixed_gradient : dynamic_gradient
    const outline = lg_type == "fixed" ? fixed_outline : dynamic_outline

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                ref={card_ref}
                tabIndex={0}
                role="img"
                aria-label="Levitating credit card"
                style={{
                    ...card_structure_style,
                    rotateX: animate_out_view && animate.rotation ? rx : 0,
                    rotateY: animate_out_view && animate.rotation ? ry : 0,
                    rotateZ: animate_out_view && animate.rotation ? rz : 0,
                    x: animate_out_view && animate.drift ? dx : 0,
                    y: animate_out_view && animate.drift ? dy : 0,
                    scale: Props.card_setting.card_scale,
                    transformStyle: "preserve-3d",
                    transformPerspective: 900,
                }}
            >
                <m.div style={background_layers_container}>
                    <m.div
                        style={{
                            ...background_layers,
                            zIndex: 1,
                            backgroundImage: bg_imgs,
                            backgroundPosition: Props.animation_config
                                .properties_animation.background
                                ? bg_post
                                : "50% 50%",
                            transformOrigin: `100% 100%`,
                        }}
                    />
                    <m.div
                        style={{
                            ...background_layers,
                            transform: `scale(1.01, 1.012)`,
                            borderRadius: 12 + 1.01,
                            zIndex: -1,
                            transformOrigin: "center center",
                            backgroundImage: outline,
                            backgroundPosition: bg_post,
                        }}
                    />
                </m.div>
                <m.div style={content_container_style}>
                    <Circle strokeWidth={0.04} style={card_circle_style} />
                    <m.div style={card_header_style}>
                        <m.h3
                            {...text_fill_motion}
                            style={{
                                ...card_text_style,
                                lineHeight: "normal",
                                backgroundPosition: text_bg,
                                fontSize: "1.3em",
                                fontWeight: 420,
                            }}
                        >
                            {Props.card_setting.card_name}
                        </m.h3>
                    </m.div>
                    <m.div
                        style={{
                            ...SIM_card_style,
                            backgroundImage: `linear-gradient(
                                135deg,
                                #f5f7fa 0%,
                                #e4e7ec 20%,
                                #cfd6dd 40%,
                                #f9fbfd 55%,
                                #bfc6ce 75%,
                                #eef1f5 100%
                                )`,
                            backgroundSize: `250% 250%`,
                            backgroundPosition: bg_post,
                        }}
                    >
                        <SIM_card_Pattern />
                    </m.div>
                    <m.div style={card_content_styles}>
                        <m.span style={holder_info_style}>
                            <m.p
                                {...text_fill_motion}
                                style={{
                                    ...card_text_style,
                                    backgroundPosition: text_bg,
                                }}
                            >
                                {credit_card_info}
                            </m.p>
                            <m.small
                                {...text_fill_motion}
                                style={{
                                    ...card_text_style,
                                    backgroundPosition: text_bg,
                                }}
                            >
                                12/29
                            </m.small>
                            <m.small
                                {...text_fill_motion}
                                style={{
                                    ...card_text_style,
                                    backgroundPosition: text_bg,
                                    fontSize: "0.8em",
                                }}
                            >
                                {Props.card_setting.holder_name}
                            </m.small>
                        </m.span>
                        <m.div
                            ref={logo_ref}
                            style={{
                                opacity: intensity,
                                position: `relative`,
                            }}
                        >
                            <Aurora_3D_CardComponent
                                key={`CardLogoElement`}
                                custom_logo_style={
                                    Props.card_setting.custom_logo_style
                                }
                                type={Props.card_setting.card_type}
                                custome_element={Props.custom_card}
                            />
                        </m.div>
                    </m.div>
                </m.div>
            </m.div>
        </LazyMotion>
    )
}

const create_controller = {
    string: (defaultValue?: string, title?: string) => ({
        type: ControlType.String,
        defaultValue,
        title,
    }),
    number: (defaultValue?: number, title?: string, max?, min?, step?) => ({
        type: ControlType.Number,
        defaultValue,
        title,
        max,
        min,
        step,
    }),
    boolean: (defaultValue?: boolean, title?: string) => ({
        type: ControlType.Boolean,
        defaultValue,
        title,
    }),
    slot: () => ({
        type: ControlType.Slot,
        max: 1,
    }),
    color: (defaultValue?: string, title?: string) => ({
        type: ControlType.Color,
        defaultValue,
        title,
    }),
    options: (
        options?: any[],
        defaultValue?: any,
        title?: string,
        optionTitles?: string[],
        hidden?: (props: { [key: string]: any }) => boolean
    ) => ({
        type: ControlType.Enum,
        defaultValue,
        title,
        options,
        optionTitles,
        hidden,
    }),
}

const LevitatingCardControl = {
    light_setting: {
        type: ControlType.Object,
        controls: {
            color: create_controller.color(`#10169f`),
            type: create_controller.options(
                ["fixed", "follow cursor"],
                "fixed"
            ),
            spread: {
                ...create_controller.number(180, "Spread", 300, 50, 10),
                hidden: (prop) => prop.type != "follow cursor",
            },
            angle: {
                type: ControlType.Object,
                hidden: (props) => props.type == "follow cursor",
                controls: {
                    x: create_controller.number(50),
                    y: create_controller.number(50),
                },
            },
        },
    },
    custom_card: {
        ...create_controller.slot(),
        hidden: ({ card_setting }) => card_setting.card_type != "Custom",
    },
    card_setting: {
        type: ControlType.Object,
        controls: {
            card_color: create_controller.color(`#0b0b0b`),
            custom_logo_style: {
                type: ControlType.Object,
                hidden: (props) => props.card_type != "Custom",
                controls: {
                    inset_x: create_controller.number(4),
                    inset_y: create_controller.number(4),
                    scale: create_controller.number(1),
                },
            },
            card_scale: create_controller.number(1, `Card scale`, 5, 0.7, 0.1),
            card_name: create_controller.string(`World`),
            card_type: create_controller.options(
                ["Visa", "Mastercard", "Custom"],
                `Visa`
            ),
            holder_name: create_controller.string(`JOHN DOE`),
        },
    },

    animation_config: {
        type: ControlType.Object,
        controls: {
            motion_sensitivity: {
                type: ControlType.Object,
                controls: {
                    x: create_controller.number(10),
                    y: create_controller.number(15),
                },
            },
            when_out_of_view: create_controller.boolean(true),
            reset_to_initial: {
                type: ControlType.Object,
                controls: {
                    reset: create_controller.boolean(false),
                    on: create_controller.options(
                        ["Envoirment Click", "Card Click", "Envoirment Leave"],
                        "Card Click",
                        "reset on",
                        null,
                        ({ reset }) => !reset
                    ),
                },
            },
            hover_envoirment: create_controller.options(
                ["window", "self"],
                "window"
            ),
            properties_animation: {
                type: ControlType.Object,
                controls: {
                    scale: create_controller.boolean(true),
                    drift: create_controller.boolean(true),
                    rotation: create_controller.boolean(true),
                    background: create_controller.boolean(true),
                },
            },
        },
    },
    physics_config: {
        type: ControlType.Object,
        controls: {
            stiffness: create_controller.number(60, "Stiffness"),
            damping: create_controller.number(22, "Damping"),
            type: create_controller.options(["spring", "tween"], "spring"),
        },
    },
}
addPropertyControls(Aurora_3D_Card, LevitatingCardControl)
