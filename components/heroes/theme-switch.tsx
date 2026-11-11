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


interface ThemeSwitchProps {
    checked?: boolean
    onChange?: (checked: boolean) => void
    toggleSize: number
    scale?: number // The new scale property
    sunColor: string
    moonColor: string
    containerLight: string
    containerNight: string
    shadow: boolean
    defaultTheme: "Light" | "Dark" | "System"
    style?: React.CSSProperties
}

const changeTheme = (theme: "light" | "dark") => {
    const htmlElement = document.documentElement
    const bodyElement = document.body
    htmlElement.setAttribute("toggle-theme", theme)
    bodyElement.setAttribute("toggle-theme", theme)
    localStorage.setItem("theme", theme)
    const event = new Event("themeChange")
    window.dispatchEvent(event)
}

export default function ThemeSwitch(props: ThemeSwitchProps) {
    const {
        checked,
        onChange,
        toggleSize,
        scale = 1,
        sunColor,
        moonColor,
        containerLight,
        containerNight,
        shadow,
        defaultTheme = "Light",
        style = {},
    } = props

    const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
        "system"
    )
    const [, setIsInitialized] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const savedTheme = localStorage.getItem("theme")
        const defaultThemeProp = defaultTheme.toLowerCase()

        let newTheme: "light" | "dark" = "light"

        if (savedTheme) {
            newTheme = savedTheme as "light" | "dark"
        } else {
            if (defaultThemeProp === "light" || defaultThemeProp === "dark") {
                newTheme = defaultThemeProp
            } else {
                const mediaQuery = window.matchMedia(
                    "(prefers-color-scheme: dark)"
                )
                newTheme = mediaQuery.matches ? "dark" : "light"
            }
        }

        React.startTransition(() => setTheme(newTheme))
        changeTheme(newTheme)

        // Setup CSS rules dynamically
        const htmlElement = document.documentElement
        const bodyElement = document.body
        htmlElement.setAttribute("toggle-theme", newTheme)
        bodyElement.setAttribute("toggle-theme", newTheme)

        let lightThemeTokens: string[] = []
        let darkThemeTokens = ""

        for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i]
            try {
                const rules = (sheet as any).cssRules || []
                for (let k = 0; k < rules.length; k++) {
                    const rule = rules[k]
                    if (
                        "selectorText" in rule &&
                        rule.selectorText === "body"
                    ) {
                        const style = rule.style
                        for (let j = 0; j < style.length; j++) {
                            const propertyName = style[j]
                            if (propertyName.includes("--token")) {
                                const value =
                                    style.getPropertyValue(propertyName)
                                const combinedCssRule = `${propertyName}: ${value};`
                                lightThemeTokens.push(combinedCssRule)
                            }
                        }
                    } else if (
                        "conditionText" in rule &&
                        rule.conditionText === "(prefers-color-scheme: dark)"
                    ) {
                        const cssRules = (rule as any).cssRules || []
                        if (cssRules.length > 0) {
                            let mediaRulesString = cssRules[0].cssText
                            mediaRulesString = mediaRulesString
                                .replace("body", "")
                                .replace(/\s*{\s*/, "")
                                .replace(/\s*}\s*$/, "")
                            darkThemeTokens = mediaRulesString
                        }
                    }
                }
            } catch (e) {
                console.warn("Cannot access stylesheet")
            }
        }

        const styleElement = document.createElement("style")
        styleElement.id = "toggle-theme"
        const customCssRule = `body[toggle-theme="light"] {${lightThemeTokens.join(" ")}} body[toggle-theme="dark"]{${darkThemeTokens}} html[toggle-theme="light"] { color-scheme: light; } html[toggle-theme="dark"] { color-scheme: dark; }`
        styleElement.textContent = customCssRule
        document.head.appendChild(styleElement)

        React.startTransition(() => setIsInitialized(true))

        return () => {
            const existingStyleElement = document.getElementById("toggle-theme")
            if (existingStyleElement) {
                document.head.removeChild(existingStyleElement)
            }
            htmlElement.setAttribute("toggle-theme", "system")
            bodyElement.setAttribute("toggle-theme", "system")
        }
    }, [defaultTheme])

    const handleClick = () => {
        const newTheme = theme === "dark" ? "light" : "dark"
        React.startTransition(() => setTheme(newTheme))
        changeTheme(newTheme)
        if (onChange) onChange(newTheme === "dark")
    }

    const isLightMode = theme === "light"

    const cssVars: React.CSSProperties = {
        "--toggle-size": `${toggleSize}px`,
        "--container-width": "5.625em",
        "--container-height": "2.5em",
        "--container-radius": "6.25em",
        "--container-light-bg": containerLight,
        "--container-night-bg": containerNight,
        "--circle-container-diameter": "3.375em",
        "--sun-moon-diameter": "2.125em",
        "--sun-bg": sunColor,
        "--moon-bg": moonColor,
        "--spot-color": "#959DB1",
        "--circle-container-offset":
            "calc((var(--circle-container-diameter) - var(--container-height)) / 2 * -1)",
        "--stars-color": "#fff",
        "--clouds-color": "#F3FDFF",
        "--back-clouds-color": "#AACADF",
        "--transition": ".5s cubic-bezier(0, -0.02, 0.4, 1.25)",
        "--circle-transition": ".3s cubic-bezier(0, -0.02, 0.35, 1.17)",
        fontSize: `${toggleSize}px`,
    } as React.CSSProperties

    const cx = (...classes: (string | boolean | undefined)[]) =>
        classes.filter(Boolean).join(" ")

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (document.getElementById("theme-switch-component-styles")) return

        const styleEl = document.createElement("style")
        styleEl.id = "theme-switch-component-styles"
        styleEl.textContent = `
    .theme-switch, .theme-switch *, .theme-switch *::before, .theme-switch *::after {
      box-sizing: border-box;
      margin: 0; padding: 0;
      font-size: var(--toggle-size);
    }
    .theme-switch__container {
      width: var(--container-width);
      height: var(--container-height);
      background-color: var(--container-light-bg);
      border-radius: var(--container-radius);
      overflow: hidden;
      cursor: pointer;
      box-shadow: ${
          shadow
              ? "0em -0.062em 0.062em rgba(0,0,0,0.25), 0em 0.062em 0.125em rgba(255,255,255,0.94)"
              : "none"
      };
      transition: var(--transition);
      position: relative;
    }
    .theme-switch__container::before {
      content: "";
      position: absolute;
      z-index: 1;
      inset: 0;
      box-shadow:
        0em 0.05em 0.187em rgba(0,0,0,0.25) inset,
        0em 0.05em 0.187em rgba(0,0,0,0.25) inset;
      border-radius: var(--container-radius);
    }
    .theme-switch__checkbox { display:none; }
    .theme-switch__circle-container {
      width: var(--circle-container-diameter);
      height: var(--circle-container-diameter);
      background-color: rgba(255,255,255,0.1);
      position: absolute;
      left: var(--circle-container-offset);
      top: var(--circle-container-offset);
      border-radius: var(--container-radius);
      box-shadow:
        inset 0 0 0 3.375em rgba(255,255,255,0.1),
        0 0 0 0.625em rgba(255,255,255,0.1),
        0 0 0 1.25em rgba(255,255,255,0.1);
      display: flex;
      transition: var(--circle-transition);
      pointer-events: none;
    }
    .theme-switch__sun-moon-container {
      pointer-events: auto;
      position: relative;
      z-index: 2;
      width: var(--sun-moon-diameter);
      height: var(--sun-moon-diameter);
      margin: auto;
      border-radius: var(--container-radius);
      background-color: var(--sun-bg);
      box-shadow:
        0.062em 0.062em 0.062em 0em rgba(254,255,239,0.61) inset,
        0em -0.062em 0.062em 0em #a1872a inset;
      filter:
        drop-shadow(0.062em 0.125em 0.125em rgba(0,0,0,0.25))
        drop-shadow(0em 0.062em 0.125em rgba(0,0,0,0.25));
      overflow: hidden;
      transition: var(--transition);
    }
    .theme-switch__moon {
      transform: translateX(100%);
      width: 100%;
      height: 100%;
      background-color: var(--moon-bg);
      border-radius: inherit;
      box-shadow:
        0.062em 0.062em 0.062em 0em rgba(254,255,239,0.61) inset,
        0em -0.062em 0.062em 0em #969696 inset;
      transition: var(--transition);
      position: relative;
    }
    .theme-switch__spot {
      position: absolute;
      top: 0.75em;
      left: 0.312em;
      width: 0.75em;
      height: 0.75em;
      border-radius: var(--container-radius);
      background: var(--spot-color);
      box-shadow: 0em 0.0312em 0.062em rgba(0,0,0,0.25) inset;
    }
    .theme-switch__spot:nth-of-type(2) {
      width: 0.375em;
      height:0.375em;
      top:0.937em;
      left:1.375em;
    }
    .theme-switch__spot:nth-last-of-type(3) {
      width:0.25em;
      height:0.25em;
      top:0.312em;
      left:0.812em;
    }
    .theme-switch__clouds {
      width:1.25em;
      height:1.25em;
      background:var(--clouds-color);
      border-radius:var(--container-radius);
      position:absolute;
      bottom:-0.625em;
      left:0.312em;
      box-shadow:
        0.937em 0.312em var(--clouds-color),
        -0.312em -0.312em var(--back-clouds-color),
        1.437em 0.375em var(--clouds-color),
        0.5em -0.125em var(--back-clouds-color),
        2.187em 0 var(--clouds-color),
        1.25em -0.062em var(--back-clouds-color),
        2.937em 0.312em var(--clouds-color),
        2em -0.312em var(--back-clouds-color),
        3.625em -0.062em var(--clouds-color),
        2.625em 0em var(--back-clouds-color),
        4.5em -0.312em var(--clouds-color),
        3.375em -0.437em var(--back-clouds-color),
        4.625em -1.75em 0 0.437em var(--clouds-color),
        4em -0.625em var(--back-clouds-color),
        4.125em -2.125em 0 0.437em var(--back-clouds-color);
      transition:0.5s cubic-bezier(0,-0.02,0.4,1.25);
    }
    .theme-switch__stars-container {
      position:absolute;
      color:var(--stars-color);
      top:-100%;
      left:0.312em;
      width:2.75em;
      height:auto;
      transition:var(--transition);
    }
    .theme-switch__checkbox:checked + .theme-switch__container {
      background: var(--container-night-bg);
    }
    .theme-switch__checkbox:checked + .theme-switch__container .theme-switch__circle-container {
      left: calc(100% - var(--circle-container-offset) - var(--circle-container-diameter));
    }
    .theme-switch__checkbox:checked + .theme-switch__container .theme-switch__moon {
      transform: translate(0);
    }
    .theme-switch__checkbox:checked + .theme-switch__container .theme-switch__clouds {
      bottom: -4.062em;
    }
    .theme-switch__checkbox:checked + .theme-switch__container .theme-switch__stars-container {
      top:50%;
      transform:translateY(-50%);
    }
    .theme-switch__circle-container:hover {
      left:calc(var(--circle-container-offset) + 0.187em);
    }
    .theme-switch__checkbox:checked + .theme-switch__container .theme-switch__circle-container:hover {
      left:calc(100% - var(--circle-container-offset) - var(--circle-container-diameter) - 0.187em);
    }
    `
        document.head.appendChild(styleEl)
    }, [shadow])

    return (
        <label
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
            }}
            aria-label="Toggle theme"
        >
            <input
                type="checkbox"
                checked={isLightMode === false}
                className="theme-switch__checkbox theme-switch"
                onChange={handleClick}
                style={{ display: "none" }}
                role="switch"
                aria-checked={isLightMode === false}
            />
            <div
                className={cx("theme-switch__container", "theme-switch")}
                style={{ ...cssVars, transform: `scale(${scale})` }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) handleClick()
                }}
            >
                <div className="theme-switch__circle-container">
                    <div className="theme-switch__sun-moon-container">
                        <div className="theme-switch__moon">
                            <span className="theme-switch__spot" />
                            <span className="theme-switch__spot" />
                            <span className="theme-switch__spot" />
                        </div>
                    </div>
                </div>
                <span className="theme-switch__clouds" />
                <span className="theme-switch__stars-container">
                    <svg
                        width="44"
                        height="9"
                        viewBox="0 0 44 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle cx="2.5" cy="6.5" r="1.5" fill="#fff" />
                        <circle cx="8.5" cy="1.5" r="0.5" fill="#fff" />
                        <circle cx="16" cy="3" r="1" fill="#fff" />
                        <circle cx="22.5" cy="7.5" r="1.5" fill="#fff" />
                        <circle cx="29.5" cy="3.5" r="1" fill="#fff" />
                        <circle cx="36" cy="1" r="0.5" fill="#fff" />
                        <circle cx="41.5" cy="6.5" r="1" fill="#fff" />
                    </svg>
                </span>
            </div>
        </label>
    )
}

addPropertyControls(ThemeSwitch, {
    checked: {
        type: ControlType.Boolean,
        title: "Checked",
        defaultValue: false,
    },
    toggleSize: {
        type: ControlType.Number,
        title: "Toggle Size",
        defaultValue: 30,
        min: 18,
        max: 64,
        unit: "px",
        step: 1,
        displayStepper: true,
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
    sunColor: {
        type: ControlType.Color,
        title: "Sun Color",
        defaultValue: "#ECCA2F",
    },
    moonColor: {
        type: ControlType.Color,
        title: "Moon Color",
        defaultValue: "#C4C9D1",
    },
    containerLight: {
        type: ControlType.Color,
        title: "Light Bg",
        defaultValue: "#3D7EAE",
    },
    containerNight: {
        type: ControlType.Color,
        title: "Night Bg",
        defaultValue: "#1D1F2C",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    defaultTheme: {
        type: ControlType.Enum,
        title: "Default Theme",
        options: ["Light", "Dark", "System"],
        defaultValue: "Light",
    },
})
