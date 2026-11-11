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


function mixColor(
    color: string,
    target: "#ffffff" | "#000000",
    amount: number
) {
    const percentage = Math.round(amount * 100)

    return `color-mix(
        in srgb,
        ${color} ${100 - percentage}%,
        ${target} ${percentage}%
    )`
}

type FourOhFourSignProps = {
    homeUrl: string
    background: string
    sound: boolean

    housingColor: string
    displayColor: string
    homeColor: string
}

export default function FourOhFourSign(props: FourOhFourSignProps) {
    const isStatic = useIsStaticRenderer()

    const {
        homeUrl = "/",
        background = "#e9e7df",
        sound = true,

        housingColor = "#d8d3c5",
        displayColor = "#527b9f",
        homeColor = "#117653",
    } = props

    const [repairStage, setRepairStage] = React.useState(0)
    const [repairing, setRepairing] = React.useState(false)

    const [repairAttempt, setRepairAttempt] = React.useState(0)

    const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([])

    const later = (callback: () => void, delay: number) => {
        const timer = setTimeout(callback, delay)
        timersRef.current.push(timer)
        return timer
    }

    React.useEffect(() => {
        return () => {
            timersRef.current.forEach(clearTimeout)
            timersRef.current = []
        }
    }, [])

    const [wobbling, setWobbling] = React.useState(false)

    const [idleFlicker, setIdleFlicker] = React.useState(0)

    const [homeHovered, setHomeHovered] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)

    const fixed = repairStage === 5

    React.useEffect(() => {
        if (isStatic || fixed || repairing) return

        let flickerTimer: ReturnType<typeof setTimeout>
        let offTimer: ReturnType<typeof setTimeout>

        const scheduleFlicker = () => {
            const delay = 2000 + Math.random() * 3000

            flickerTimer = setTimeout(() => {
                const type = Math.random() > 0.5 ? 1 : 2

                setIdleFlicker(type)

                offTimer = setTimeout(
                    () => {
                        setIdleFlicker(0)
                        scheduleFlicker()
                    },
                    60 + Math.random() * 100
                )
            }, delay)
        }

        scheduleFlicker()

        return () => {
            clearTimeout(flickerTimer)
            clearTimeout(offTimer)
        }
    }, [isStatic, fixed, repairing])

    const playImpactSound = () => {
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext

        const ctx = new AudioContextClass()
        const now = ctx.currentTime

        const oscillator = ctx.createOscillator()
        const bodyGain = ctx.createGain()

        oscillator.type = "sine"

        oscillator.frequency.setValueAtTime(135, now)
        oscillator.frequency.exponentialRampToValueAtTime(62, now + 0.085)

        bodyGain.gain.setValueAtTime(0.0001, now)
        bodyGain.gain.exponentialRampToValueAtTime(0.18, now + 0.003)
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

        oscillator.connect(bodyGain)
        bodyGain.connect(ctx.destination)

        oscillator.start(now)
        oscillator.stop(now + 0.13)

        const bufferLength = Math.floor(ctx.sampleRate * 0.035)

        const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate)

        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferLength; i++) {
            const decay = 1 - i / bufferLength

            data[i] = (Math.random() * 2 - 1) * decay * decay
        }

        const noise = ctx.createBufferSource()
        noise.buffer = buffer

        const filter = ctx.createBiquadFilter()
        filter.type = "bandpass"
        filter.frequency.value = 900
        filter.Q.value = 0.7

        const noiseGain = ctx.createGain()

        noiseGain.gain.setValueAtTime(0.11, now)
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)

        noise.connect(filter)
        filter.connect(noiseGain)
        noiseGain.connect(ctx.destination)

        noise.start(now)

        setTimeout(() => {
            ctx.close()
        }, 180)
    }

    const playFailedRepairSound = () => {
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext

        const ctx = new AudioContextClass()
        const now = ctx.currentTime

        const oscillator = ctx.createOscillator()
        const buzzGain = ctx.createGain()

        oscillator.type = "sawtooth"

        oscillator.frequency.setValueAtTime(92, now)
        oscillator.frequency.setValueAtTime(108, now + 0.05)
        oscillator.frequency.setValueAtTime(86, now + 0.1)
        oscillator.frequency.setValueAtTime(104, now + 0.16)

        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.value = 520

        buzzGain.gain.setValueAtTime(0.0001, now)
        buzzGain.gain.exponentialRampToValueAtTime(0.035, now + 0.015)

        buzzGain.gain.setValueAtTime(0.018, now + 0.12)

        buzzGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)

        oscillator.connect(filter)
        filter.connect(buzzGain)
        buzzGain.connect(ctx.destination)

        oscillator.start(now)
        oscillator.stop(now + 0.3)

        const tick = ctx.createOscillator()
        const tickGain = ctx.createGain()

        tick.type = "square"
        tick.frequency.value = 1350

        tickGain.gain.setValueAtTime(0.025, now + 0.31)

        tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.335)

        tick.connect(tickGain)
        tickGain.connect(ctx.destination)

        tick.start(now + 0.31)
        tick.stop(now + 0.34)

        setTimeout(() => {
            ctx.close()
        }, 420)
    }

    const playSuccessRepairSound = () => {
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext

        const ctx = new AudioContextClass()
        const now = ctx.currentTime

        const buzz = ctx.createOscillator()
        const buzzGain = ctx.createGain()
        const filter = ctx.createBiquadFilter()

        buzz.type = "sawtooth"

        buzz.frequency.setValueAtTime(88, now)
        buzz.frequency.setValueAtTime(102, now + 0.06)
        buzz.frequency.setValueAtTime(96, now + 0.13)
        buzz.frequency.setValueAtTime(100, now + 0.2)

        filter.type = "lowpass"
        filter.frequency.value = 480

        buzzGain.gain.setValueAtTime(0.0001, now)

        buzzGain.gain.exponentialRampToValueAtTime(0.025, now + 0.02)

        buzzGain.gain.setValueAtTime(0.022, now + 0.2)

        buzzGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)

        buzz.connect(filter)
        filter.connect(buzzGain)
        buzzGain.connect(ctx.destination)

        buzz.start(now)
        buzz.stop(now + 0.33)

        const click = ctx.createOscillator()
        const clickGain = ctx.createGain()

        click.type = "square"
        click.frequency.value = 920

        clickGain.gain.setValueAtTime(0.018, now + 0.31)

        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.345)

        click.connect(clickGain)
        clickGain.connect(ctx.destination)

        click.start(now + 0.31)
        click.stop(now + 0.35)

        setTimeout(() => {
            ctx.close()
        }, 430)
    }

    const playBulbTickSound = () => {
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext

        const ctx = new AudioContextClass()
        const now = ctx.currentTime

        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()

        oscillator.type = "square"
        oscillator.frequency.setValueAtTime(1250, now)
        oscillator.frequency.exponentialRampToValueAtTime(780, now + 0.025)

        gain.gain.setValueAtTime(0.018, now)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045)

        oscillator.connect(gain)
        gain.connect(ctx.destination)

        oscillator.start(now)
        oscillator.stop(now + 0.05)

        setTimeout(() => {
            ctx.close()
        }, 100)
    }

    const handleHit = (event: React.PointerEvent<HTMLDivElement>) => {
        if (sound && !isStatic) {
            playImpactSound()
        }

        const rect = event.currentTarget.getBoundingClientRect()

        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2

        const y = (event.clientY - rect.top) / rect.height

        setHitX(x)
        setHitY(y)

        if (!wobbling) {
            setWobbling(true)

            setHitStage(1)

            later(() => setHitStage(2), 38)
            later(() => setHitStage(3), 145)
            later(() => setHitStage(4), 255)

            later(() => {
                setHitStage(0)
                setWobbling(false)
            }, 390)
        }

        if (repairAttempt === 0 && !repairing) {
            setRepairing(true)

            setBulbsFixed(0)
            setStubbornFixed(false)
            setStubbornStage(0)

            if (sound && !isStatic) {
                later(() => {
                    playFailedRepairSound()
                }, 170)
            }

            bulbRepairOrder.forEach((_, step) => {
                const delay = 120 + step * 75 + Math.random() * 90

                later(() => {
                    setBulbsFixed(step + 1)
                }, delay)
            })

            const stubbornDelay = 2800 + Math.random() * 1800

            later(() => setStubbornStage(1), stubbornDelay)
            later(() => setStubbornStage(2), stubbornDelay + 180)
            later(() => setStubbornStage(1), stubbornDelay + 420)
            later(() => setStubbornStage(2), stubbornDelay + 650)
            later(() => setStubbornStage(1), stubbornDelay + 820)
            later(() => setStubbornStage(2), stubbornDelay + 960)
            later(() => setStubbornStage(1), stubbornDelay + 1080)

            later(() => {
                setStubbornStage(3)
                setStubbornFixed(true)

                if (sound && !isStatic) {
                    playBulbTickSound()
                }
            }, stubbornDelay + 1380)

            setRepairStage(1)

            later(() => setRepairStage(2), 100)
            later(() => setRepairStage(1), 180)
            later(() => setRepairStage(3), 270)
            later(() => setRepairStage(1), 350)
            later(() => setRepairStage(4), 440)
            later(() => setRepairStage(1), 520)

            later(() => {
                setRepairStage(0)
                setRepairAttempt(1)
                setRepairing(false)
            }, 650)
        }

        if (repairAttempt === 1 && !repairing) {
            setRepairing(true)

            if (sound && !isStatic) {
                later(() => {
                    playSuccessRepairSound()
                }, 40)
            }

            setRepairStage(1)

            later(() => setRepairStage(3), 90)
            later(() => setRepairStage(1), 160)
            later(() => setRepairStage(4), 240)

            later(() => {
                setRepairStage(5)
                setRepairAttempt(2)
                setRepairing(false)
            }, 360)
        }
    }

    const [bulbsFixed, setBulbsFixed] = React.useState(0)

    const [stubbornFixed, setStubbornFixed] = React.useState(false)

    const [stubbornStage, setStubbornStage] = React.useState(0)

    const [hitStage, setHitStage] = React.useState(0)

    const [hitX, setHitX] = React.useState(0)
    const [hitY, setHitY] = React.useState(0)

    const stubbornBulb = 11

    const bulbRepairOrder = [0, 3, 7, 1, 10, 5, 6, 12, 2, 9, 4, 13, 8, 11]

    const getZeroPath = () => {
        switch (repairStage) {
            case 0:
                if (idleFlicker === 1) {
                    return `
            M 11 69 H 35
            M 3 55 V 28
        `
                }

                if (idleFlicker === 2) {
                    return `
            M 11 69 H 35
            M 11 3 H 30
        `
                }

                return "M 11 69 H 35"

            case 1:
                return ""

            case 2:
                return "M 3 55 V 20"

            case 3:
                return "M 11 3 H 35 Q 43 3 43 11 V 48"

            case 4:
            case 5:
                return `
                M 11 3
                H 35
                Q 43 3 43 11
                V 61
                Q 43 69 35 69
                H 11
                Q 3 69 3 61
                V 11
                Q 3 3 11 3
            `

            default:
                return ""
        }
    }

    const getBulbState = (index: number): React.CSSProperties => {
        const repairedBulbs = bulbRepairOrder.slice(0, bulbsFixed)

        const isRepaired = repairedBulbs.includes(index)

        if (index === stubbornBulb) {
            if (stubbornFixed || stubbornStage === 3) {
                return styles.bulbOn
            }

            if (stubbornStage === 1) {
                return styles.bulbOff
            }

            if (isRepaired) {
                return styles.bulbWeak
            }

            return styles.bulbOff
        }

        if (!isRepaired) {
            return styles.bulbOff
        }

        return styles.bulbOn
    }

    const getConnectionShadow = () => {
        if (hitStage === 0) {
            return `
            linear-gradient(
                90deg,
                transparent 0%,
                rgba(55, 48, 38, 0.12) 18%,
                rgba(55, 48, 38, 0.18) 50%,
                rgba(55, 48, 38, 0.12) 82%,
                transparent 100%
            )
        `
        }

        if (hitStage === 1) {
            return `
            linear-gradient(
                90deg,
                transparent 0%,
                rgba(50, 43, 34, 0.18) 15%,
                rgba(45, 38, 30, 0.28) 50%,
                rgba(50, 43, 34, 0.18) 85%,
                transparent 100%
            )
        `
        }

        if (hitX > 0) {
            return `
            linear-gradient(
                90deg,
                transparent 0%,
                rgba(55, 48, 38, 0.07) 20%,
                rgba(55, 48, 38, 0.12) 50%,
                rgba(45, 38, 30, 0.30) 88%,
                transparent 100%
            )
        `
        }

        if (hitX < 0) {
            return `
            linear-gradient(
                90deg,
                transparent 0%,
                rgba(45, 38, 30, 0.30) 12%,
                rgba(55, 48, 38, 0.12) 50%,
                rgba(55, 48, 38, 0.07) 80%,
                transparent 100%
            )
        `
        }

        return `
        linear-gradient(
            90deg,
            transparent,
            rgba(55, 48, 38, 0.18),
            transparent
        )
    `
    }

    const getHitTransform = () => {
        const leverage = Math.max(0.15, 1 - hitY)

        const sideImpact = hitX

        const centerImpact = 1 - Math.min(1, Math.abs(hitX))

        switch (hitStage) {
            case 1:
                return `
        perspective(900px)

        translateZ(-3px)

        scaleX(1.002)
        scaleY(0.997)

        rotateX(
            ${centerImpact * 0.45 * leverage}deg
        )

        rotateZ(
            ${-sideImpact * 0.25 * leverage}deg
        )
    `

            case 2:
                return `
        perspective(900px)

        translateZ(0px)

        scaleX(1)
        scaleY(1)

        rotateZ(
            ${-sideImpact * 2.6 * leverage}deg
        )

        rotateY(
            ${sideImpact * 2.0 * leverage}deg
        )

        rotateX(
            ${centerImpact * 1.8 * leverage}deg
        )
    `

            case 3:
                return `
        perspective(900px)

        rotateZ(
            ${sideImpact * 0.9 * leverage}deg
        )

        rotateY(
            ${-sideImpact * 0.7 * leverage}deg
        )

        rotateX(
            ${-centerImpact * 0.55 * leverage}deg
        )
    `

            case 4:
                return `
        perspective(900px)

        rotateZ(
            ${-sideImpact * 0.22 * leverage}deg
        )

        rotateY(
            ${sideImpact * 0.16 * leverage}deg
        )

        rotateX(
            ${centerImpact * 0.12 * leverage}deg
        )
    `

            default:
                return "none"
        }
    }

    const FourTube = () => (
        <svg
            width="46"
            height="72"
            viewBox="0 0 46 72"
            style={{ overflow: "visible" }}
        >
            <path
                d="
                M 3 3
                V 34
                Q 3 38 7 38
                H 43

                M 43 3
                V 69
            "
                fill="none"
                stroke="#f4eed0"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    filter: "drop-shadow(0 0 5px rgba(255,245,190,0.58))",
                }}
            />
        </svg>
    )

    return (
        <div
            style={{
                ...styles.scene,
                background,
            }}
        >
            <div
                style={{
                    ...styles.sign,

                    background: `
    linear-gradient(
        90deg,
        ${mixColor(housingColor, "#000000", 0.04)} 0%,
        ${mixColor(housingColor, "#ffffff", 0.08)} 16%,
        ${housingColor} 76%,
        ${mixColor(housingColor, "#000000", 0.08)} 100%
    )
`,

                    cursor: hovered ? "crosshair" : "pointer",

                    transformOrigin: "50% 100%",

                    transform: getHitTransform(),

                    transition:
                        hitStage === 1
                            ? "transform 35ms cubic-bezier(.2,.8,.3,1)"
                            : hitStage === 2
                              ? "transform 105ms cubic-bezier(.16,.8,.25,1)"
                              : "transform 110ms ease-out",
                }}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
                onPointerDown={handleHit}
            >
                <div style={styles.topBulbs}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} style={styles.bulb}>
                            <div
                                style={{
                                    ...styles.bulbCore,
                                    ...getBulbState(i),
                                }}
                            />
                            <div style={styles.bulbGlint} />
                        </div>
                    ))}
                </div>

                <div style={styles.rightBulbs}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} style={styles.sideBulb}>
                            <div
                                style={{
                                    ...styles.sideBulbCore,
                                    ...getBulbState(i + 6),
                                }}
                            />
                            <div style={styles.sideBulbGlint} />
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        ...styles.display,

                        background: `
            radial-gradient(
                ellipse at 48% 42%,
                ${mixColor(displayColor, "#ffffff", 0.12)} 0%,
                ${displayColor} 42%,
                ${mixColor(displayColor, "#000000", 0.1)} 76%,
                ${mixColor(displayColor, "#000000", 0.2)} 100%
            )
        `,
                    }}
                >
                    <div style={styles.backlightUnevenness} />
                    <div style={styles.acrylicReflection} />

                    <div style={styles.number}>
                        <div style={styles.four}>
                            <FourTube />
                        </div>

                        <div style={styles.zero}>
                            <svg
                                width="46"
                                height="72"
                                viewBox="0 0 46 72"
                                style={{ overflow: "visible" }}
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="40"
                                    height="66"
                                    rx="8"
                                    fill="none"
                                    stroke="rgba(245,239,205,0.08)"
                                    strokeWidth="6"
                                />

                                <path
                                    d={getZeroPath()}
                                    fill="none"
                                    stroke={
                                        hovered && !fixed
                                            ? "#fff4c8"
                                            : "#f4eed0"
                                    }
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        filter:
                                            hovered && !fixed
                                                ? "drop-shadow(0 0 8px rgba(255,245,190,0.8))"
                                                : "drop-shadow(0 0 5px rgba(255,245,190,0.58))",

                                        transition:
                                            "stroke 180ms ease, filter 180ms ease",
                                    }}
                                />
                            </svg>
                        </div>

                        <div style={styles.four}>
                            <FourTube />
                        </div>
                    </div>

                    <div style={styles.message}>PAGE NOT FOUND</div>
                </div>

                <a
                    href={homeUrl}
                    style={{
                        ...styles.homeSign,

                        background: `
    linear-gradient(
        180deg,
        ${mixColor(homeColor, "#ffffff", 0.1)} 0%,
        ${homeColor} 52%,
        ${mixColor(homeColor, "#000000", 0.12)} 100%
    )
`,

                        filter: fixed
                            ? homeHovered
                                ? "brightness(1.08)"
                                : "brightness(1)"
                            : homeHovered
                              ? "brightness(0.82)"
                              : "brightness(0.7)",
                    }}
                    onPointerEnter={() => setHomeHovered(true)}
                    onPointerLeave={() => setHomeHovered(false)}
                    onPointerDown={(event) => {
                        event.stopPropagation()
                    }}
                    onClick={(event) => {
                        event.stopPropagation()
                    }}
                >
                    <span style={styles.homeArrow}>←</span>
                    <span>HOME</span>
                </a>

                <div style={styles.body}>
                    <div style={styles.housingAge} />
                    <div style={styles.ageStreaks} />

                    <div style={styles.nameplate}>
                        <div style={styles.nameplateModel}>MODEL 404</div>

                        <div style={styles.nameplateLine}>
                            ERROR DISPLAY UNIT
                        </div>

                        <div style={styles.nameplateLine}>
                            TYPE 04-04 / AC 100V
                        </div>

                        <div style={styles.nameplateLine}>
                            SERIAL NO. 404-001
                        </div>
                    </div>

                    <div style={styles.serviceSlot} />
                </div>
            </div>

            <div
                style={{
                    ...styles.connectionShadow,
                    background: getConnectionShadow(),
                }}
            />

            <div
                style={{
                    ...styles.base,

                    background: `
    linear-gradient(
        180deg,
        ${mixColor(housingColor, "#ffffff", 0.1)} 0%,
        ${mixColor(housingColor, "#000000", 0.04)} 100%
    )
`,
                }}
            >
                <div style={styles.baseTopEdge} />

                <div style={styles.baseWear} />
                <div style={styles.cornerChip} />

                <div style={styles.baseBottomEdge} />
            </div>
        </div>
    )
}

addPropertyControls(FourOhFourSign, {
    homeUrl: {
        type: ControlType.String,
        title: "Home URL",
        defaultValue: "/",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#e9e7df",
    },

    housingColor: {
        type: ControlType.Color,
        title: "Housing",
        defaultValue: "#d8d3c5",
    },

    displayColor: {
        type: ControlType.Color,
        title: "Display",
        defaultValue: "#527b9f",
    },

    homeColor: {
        type: ControlType.Color,
        title: "Home Sign",
        defaultValue: "#117653",
    },

    sound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})

const styles: Record<string, React.CSSProperties> = {
    scene: {
        width: "100%",
        height: "100%",
        minHeight: "600px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",

        paddingTop: "24px",
        boxSizing: "border-box",

        background: "#e9e7df",
    },

    sign: {
        position: "relative",
        width: "320px",
        boxSizing: "border-box",

        background:
            "linear-gradient(90deg, #d2cdbf 0%, #e2ddd0 16%, #ddd8ca 76%, #c9c3b5 100%)",

        borderRadius: "22px 22px 10px 10px",

        padding: "22px 16px 0px",

        boxShadow: `
    0 18px 35px rgba(0,0,0,0.14),

    inset 0 2px 2px rgba(255,255,255,0.58),

    inset 2px 0 3px rgba(88,72,48,0.055),
    inset -2px 0 3px rgba(88,72,48,0.07),

    inset 0 -2px 3px rgba(78,65,45,0.07)
`,

        border: "2px solid #aaa596",
    },

    bulb: {
        position: "relative",

        width: "18px",
        height: "18px",

        borderRadius: "50% 50% 42% 42%",

        background: `
        radial-gradient(
            circle at 34% 26%,
            rgba(255,255,255,0.72) 0%,
            rgba(255,255,255,0.25) 28%,
            rgba(210,205,185,0.16) 65%,
            rgba(120,115,100,0.18) 100%
        )
    `,

        border: "1px solid rgba(120,115,100,0.32)",

        boxShadow: `
        inset -2px -3px 4px rgba(80,75,65,0.10),
        0 2px 3px rgba(50,45,35,0.16)
    `,
    },

    bulbCore: {
        position: "absolute",

        left: "50%",
        top: "50%",

        width: "9px",
        height: "9px",

        transform: "translate(-50%, -42%)",

        borderRadius: "50%",

        pointerEvents: "none",

        transition:
            "opacity 80ms ease, background 80ms ease, box-shadow 80ms ease",
    },

    bulbGlint: {
        position: "absolute",

        left: "4px",
        top: "3px",

        width: "4px",
        height: "3px",

        borderRadius: "50%",

        background: "rgba(255,255,255,0.72)",

        transform: "rotate(-25deg)",

        pointerEvents: "none",
    },

    sideBulb: {
        position: "relative",

        width: "13px",
        height: "18px",

        borderRadius: "0 50% 50% 0",

        background: `
        linear-gradient(
            90deg,
            rgba(180,175,155,0.18) 0%,
            rgba(255,255,255,0.34) 45%,
            rgba(215,208,185,0.18) 100%
        )
    `,

        border: "1px solid rgba(120,115,100,0.28)",

        boxShadow: "1px 2px 3px rgba(50,45,35,0.14)",
    },

    sideBulbCore: {
        position: "absolute",

        left: "2px",
        top: "50%",

        width: "7px",
        height: "10px",

        transform: "translateY(-50%)",

        borderRadius: "0 50% 50% 0",

        pointerEvents: "none",

        transition:
            "opacity 80ms ease, background 80ms ease, box-shadow 80ms ease",
    },

    sideBulbGlint: {
        position: "absolute",

        right: "2px",
        top: "4px",

        width: "2px",
        height: "6px",

        borderRadius: "50%",

        background: "rgba(255,255,255,0.58)",

        pointerEvents: "none",
    },

    topBulbs: {
        position: "absolute",
        left: "18px",
        right: "18px",
        top: "-17px",

        display: "flex",
        justifyContent: "space-around",

        zIndex: 0,
    },

    rightBulbs: {
        position: "absolute",
        right: "-15px",
        top: "30px",
        bottom: "18px",

        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",

        zIndex: 0,
    },

    bulbOff: {
        opacity: 0.16,

        background: "#b8ad88",

        boxShadow: "none",
    },

    bulbWeak: {
        opacity: 0.68,

        background: "#f2df9e",

        boxShadow: `
        0 0 4px rgba(255,230,145,0.45),
        0 0 8px rgba(255,220,120,0.16)
    `,
    },

    bulbOn: {
        opacity: 1,

        background: "#fff4c5",

        boxShadow: `
        0 0 5px rgba(255,240,175,0.78),
        0 0 11px rgba(255,225,130,0.38),
        0 0 18px rgba(255,215,105,0.14)
    `,
    },

    display: {
        position: "relative",
        overflow: "hidden",

        background: `
        radial-gradient(
            ellipse at 48% 42%,
            #16885f 0%,
            #0f7d57 42%,
            #08704e 76%,
            #075f44 100%
        )
    `,

        borderRadius: "8px",

        border: "5px solid #c9c4b7",

        boxShadow: `
        inset 0 8px 18px rgba(0,0,0,0.20),
        inset 8px 0 14px rgba(0,0,0,0.08),
        inset -8px 0 14px rgba(0,0,0,0.10),
        0 1px 0 rgba(255,255,255,0.5)
    `,
    },

    backlightUnevenness: {
        position: "absolute",
        inset: 0,

        pointerEvents: "none",

        background: `
        radial-gradient(
            circle at 22% 35%,
            rgba(255,240,180,0.035) 0%,
            transparent 25%
        ),
        radial-gradient(
            circle at 76% 68%,
            rgba(0,40,25,0.07) 0%,
            transparent 28%
        )
    `,

        zIndex: 0,
    },

    acrylicReflection: {
        position: "absolute",
        inset: 0,

        pointerEvents: "none",

        background: `
        linear-gradient(
            118deg,
            rgba(255,255,255,0.10) 0%,
            rgba(255,255,255,0.035) 18%,
            transparent 31%,
            transparent 68%,
            rgba(255,255,255,0.025) 78%,
            transparent 100%
        )
    `,

        opacity: 0.65,
    },

    number: {
        height: "190px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "25px",
        color: "#fff8df",
        fontFamily: "monospace",
        fontSize: "74px",
        fontWeight: 700,
        letterSpacing: "-4px",
        textShadow: "0 0 14px rgba(255,245,190,0.45)",
        position: "relative",
        zIndex: 1,
    },

    four: {
        position: "relative",
        width: "46px",
        height: "72px",
    },

    zero: {
        position: "relative",
        width: "46px",
        height: "72px",
    },

    message: {
        padding: "12px",
        borderTop: "2px solid rgba(255,255,255,0.25)",
        color: "#f4eedc",
        fontFamily: "monospace",
        fontSize: "12px",
        letterSpacing: "2px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
    },

    homeSign: {
        position: "relative",

        marginTop: "12px",
        height: "48px",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "9px",

        boxSizing: "border-box",

        color: "#eee9d6",
        textDecoration: "none",

        fontFamily: "monospace",
        fontSize: "13px",
        letterSpacing: "2px",

        background:
            "linear-gradient(180deg, #607fa0 0%, #516f91 52%, #486685 100%)",

        border: "3px solid #c6c0b2",
        borderRadius: "3px",

        boxShadow: `
        inset 0 4px 8px rgba(20, 35, 55, 0.22),
        inset 0 -1px 0 rgba(255,255,255,0.16),
        0 1px 1px rgba(255,255,255,0.35)
    `,

        cursor: "pointer",

        transition: "filter 120ms ease, transform 80ms ease",
    },

    homeArrow: {
        display: "inline-block",

        fontSize: "16px",
        lineHeight: 1,

        transform: "translateY(-1px)",
    },

    body: {
        position: "relative",
        height: "150px",
        width: "100%",

        marginTop: "14px",

        background: "transparent",
    },

    housingAge: {
        position: "absolute",
        inset: "-14px -16px 0 -16px",

        pointerEvents: "none",

        background: `
        radial-gradient(
            ellipse at 3% 8%,
            rgba(132, 107, 65, 0.08) 0%,
            transparent 18%
        ),

        radial-gradient(
            ellipse at 97% 12%,
            rgba(119, 98, 61, 0.065) 0%,
            transparent 17%
        ),

        linear-gradient(
            90deg,
            rgba(92, 75, 48, 0.045) 0%,
            transparent 8%,
            transparent 91%,
            rgba(88, 72, 47, 0.055) 100%
        ),

        linear-gradient(
            180deg,
            transparent 72%,
            rgba(98, 80, 53, 0.045) 100%
        )
    `,

        borderRadius: "0 0 9px 9px",

        opacity: 0.85,
    },

    ageStreaks: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",

        background: `
        linear-gradient(
            90deg,
            transparent 7%,
            rgba(92, 78, 55, 0.035) 9%,
            transparent 12%,
            transparent 31%,
            rgba(90, 76, 54, 0.025) 34%,
            transparent 38%,
            transparent 67%,
            rgba(95, 80, 55, 0.035) 70%,
            transparent 74%
        )
    `,

        opacity: 0.8,
    },

    serviceSlot: {
        position: "absolute",
        left: "12px",
        bottom: "38px",

        width: "13px",
        height: "6px",

        borderRadius: "2px",

        background: "#77776e",
        border: "1px solid rgba(40,40,35,0.45)",

        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
    },

    connectionShadow: {
        position: "relative",

        width: "292px",
        height: "7px",

        marginTop: "-4px",
        marginBottom: "-3px",

        borderRadius: "50%",

        zIndex: 3,

        pointerEvents: "none",

        filter: "blur(1.2px)",

        transition: "background 80ms ease, opacity 80ms ease",
    },

    base: {
        position: "relative",
        height: "72px",
        width: "340px",
        marginTop: "0px",

        background: "linear-gradient(180deg, #d8d3c5 0%, #c8c1b1 100%)",

        clipPath: "polygon(6% 0%, 94% 0%, 98% 92%, 96% 100%, 4% 100%, 2% 92%)",

        borderRadius: "0 0 12px 12px",

        boxShadow:
            "0 22px 28px rgba(0,0,0,0.16), inset 0 -4px 7px rgba(70,60,40,0.12)",
    },

    groundShadow: {
        position: "absolute",
        width: "300px",
        height: "24px",
        bottom: "-10px",
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "50%",
        background: "rgba(55, 48, 38, 0.10)",
        filter: "blur(12px)",
        pointerEvents: "none",
    },

    baseTopEdge: {
        position: "absolute",
        left: "6%",
        right: "6%",
        top: "0px",
        height: "3px",

        background:
            "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02))",

        pointerEvents: "none",
    },

    baseBottomEdge: {
        position: "absolute",
        left: "4%",
        right: "4%",
        bottom: "0px",
        height: "5px",

        background:
            "linear-gradient(180deg, rgba(70,60,45,0.02), rgba(70,60,45,0.16))",

        borderRadius: "0 0 10px 10px",

        pointerEvents: "none",
    },

    baseWear: {
        position: "absolute",

        left: "10px",
        right: "10px",
        bottom: "1px",

        height: "8px",

        pointerEvents: "none",

        background: `
        linear-gradient(
            90deg,
            transparent 0%,

     rgba(67,61,50,0.24) 3%,
rgba(67,61,50,0.10) 8%,
            transparent 13%,

            transparent 19%,
            rgba(74,67,54,0.20) 22%,
            transparent 25%,

            transparent 68%,
            rgba(68,62,51,0.18) 70%,
            transparent 73%,

            transparent 86%,
            rgba(65,59,49,0.36) 90%,
            rgba(65,59,49,0.20) 95%,
            transparent 100%
        )
    `,

        clipPath:
            "polygon(0 40%, 5% 18%, 9% 52%, 14% 30%, 20% 66%, 27% 42%, 35% 75%, 44% 50%, 54% 72%, 64% 40%, 73% 68%, 81% 34%, 90% 55%, 100% 25%, 100% 100%, 0 100%)",

        opacity: 0.75,
    },

    cornerChip: {
        position: "absolute",

        left: "13px",
        bottom: "4px",

        width: "17px",
        height: "7px",

        background: `
        radial-gradient(
            ellipse at 35% 55%,
            rgba(57,52,44,0.58) 0%,
            rgba(77,69,55,0.42) 38%,
            rgba(177,166,140,0.25) 62%,
            transparent 72%
        )
    `,

        transform: "rotate(-8deg)",

        pointerEvents: "none",
    },

    nameplate: {
        position: "absolute",

        right: "-10px",
        bottom: "26px",

        width: "118px",

        fontFamily: "monospace",
        color: "rgba(68, 64, 55, 0.68)",

        letterSpacing: "0.7px",
        lineHeight: 1.55,
        textAlign: "left",

        pointerEvents: "none",
    },

    nameplateModel: {
        fontSize: "9px",
        fontWeight: 500,
        letterSpacing: "1px",

        marginBottom: "3px",
        color: "rgba(74, 69, 58, 0.68)",

        WebkitMaskImage: `
        linear-gradient(
            90deg,
            #000 0%,
            #000 8%,
            transparent 9%,
            #000 11%,
            #000 27%,
            transparent 28%,
            #000 30%,
            #000 54%,
            rgba(0,0,0,0.35) 56%,
            #000 59%,
            #000 78%,
            transparent 79%,
            #000 82%,
            #000 100%
        )
    `,

        WebkitMaskComposite: "source-in",

        maskImage: `
        linear-gradient(
            90deg,
            #000 0%,
            #000 8%,
            transparent 9%,
            #000 11%,
            #000 27%,
            transparent 28%,
            #000 30%,
            #000 54%,
            rgba(0,0,0,0.35) 56%,
            #000 59%,
            #000 78%,
            transparent 79%,
            #000 82%,
            #000 100%
        )
    `,
    },

    nameplateLine: {
        fontSize: "6px",
        fontWeight: 400,
        letterSpacing: "0.8px",
        color: "rgba(74, 69, 58, 0.68)",

        whiteSpace: "nowrap",

        opacity: 0.58,

        WebkitMaskImage: `
        linear-gradient(
            90deg,
            #000 0%,
            #000 18%,
            rgba(0,0,0,0.45) 20%,
            #000 23%,
            #000 61%,
            rgba(0,0,0,0.55) 63%,
            #000 66%,
            #000 100%
        )
    `,
    },
}
