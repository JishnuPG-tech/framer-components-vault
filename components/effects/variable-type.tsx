// VariaTypeFX — Framer code component · un gros titre en police VARIABLE qui suit le curseur.
// Chaque lettre s'épaissit et s'élargit à mesure que la souris s'en approche, puis revient à
// son état de repos quand elle s'éloigne : une vague de graisse qui traverse le mot.
//
// Pourquoi ce composant : dans l'étude du catalogue (7 495 fiches), « text / typography » est
// la 2e catégorie en volume et l'une des mieux aimées. Les titres réactifs en police variable
// sont partout dans les portfolios de studios, et presque absents du marketplace : ce qui s'y
// vend, ce sont des machines à écrire et des fondus. Voir G:\TemplateFactory\market\ETUDE.md
//
// Portage React de la recette `variable-hero` de Webator, avec trois différences qui comptent :
//   • le suivi est lissé en exponentielle du temps écoulé (même ressenti à 60 et à 144 Hz),
//     là où la version vanille avançait d'un pas fixe par frame — donc deux fois plus vite
//     sur un écran 120 Hz ;
//   • la boucle s'arrête toute seule quand plus rien ne bouge (titre au repos = 0 % de CPU) ;
//   • AUCUNE police n'est chargée depuis l'extérieur : l'acheteur choisit la sienne dans le
//     panneau (Roboto Flex par défaut). Charger une font depuis un CDN est un motif de rejet.
//
// IMPORTANT : tout ce que voit l'ACHETEUR est en anglais (libellés du panneau, valeurs par
// défaut). Les commentaires restent en français, ils sont pour nous.
//
// DOM + rAF, zéro dépendance, zéro ressource externe.
// Conforme au contrôle G:\Framer3D\prototypes\preflight.mjs dès l'écriture.

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


// Axes de Roboto Flex : wght 100..1000, wdth 25..151. On borne les réglages à cette plage,
// qui couvre aussi Inter, Open Sans Variable et la plupart des variables de Google Fonts —
// une valeur hors axe est simplement ignorée par le navigateur, jamais fatale.
const WGHT_MIN = 100
const WGHT_MAX = 1000
const WDTH_MIN = 25
const WDTH_MAX = 151

// Pile de secours : si l'acheteur ne choisit rien, on tente d'abord des familles VARIABLES
// (Roboto Flex si son projet la charge, puis les variables présentes en système), et on
// termine par la police d'interface. Rien n'est téléchargé : ce sont des noms de familles.
const SECOURS = `"Segoe UI Variable Display", Bahnschrift, "Inter", ui-sans-serif, system-ui, sans-serif`

const borne = (v, min, max) => Math.max(min, Math.min(max, v))

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 340
 * @framerDisableUnlink
 */
export default function VariaTypeFX(props) {
    const {
        texte,
        rayon,
        graisseRepos,
        graisseMax,
        largeurRepos,
        largeurMax,
        souplesse,
        taille,
        interlettrage,
        alignement,
        couleur,
        police,
    } = props

    const wrapRef = React.useRef(null)
    const isStatic = useIsStaticRenderer()

    // Découpe en LIGNES (les retours à la ligne saisis sont respectés), puis en mots, puis
    // en lettres : le repli automatique se fait aux espaces, jamais au milieu d'un mot. Un
    // titre coupé en plein milieu ruine la mise en page de l'acheteur.
    const lignes = React.useMemo(() => {
        const t = String(texte == null ? "" : texte)
        return t
            .split(/\r?\n/)
            .map((l) => l.split(/([ \t]+)/).filter((m) => m.length))
    }, [texte])

    const fd =
        (police && police.fontFamily
            ? police.fontFamily + ", "
            : `"Roboto Flex", `) + SECOURS

    React.useEffect(() => {
        const wrap = wrapRef.current
        if (!wrap) return

        const lettres = Array.prototype.slice.call(
            wrap.querySelectorAll("[data-lettre]")
        )
        if (!lettres.length) return

        const reduit = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const fige = isStatic || reduit

        const R = Math.max(1, rayon)
        const gRepos = borne(graisseRepos, WGHT_MIN, WGHT_MAX)
        const gMax = borne(graisseMax, WGHT_MIN, WGHT_MAX)
        const lRepos = borne(largeurRepos, WDTH_MIN, WDTH_MAX)
        const lMax = borne(largeurMax, WDTH_MIN, WDTH_MAX)

        let mort = false
        let raf = 0
        let visible = false
        let amorce = false
        let calme = 0
        let dernier = 0

        const cible = { x: 0, y: 0, p: 0 } // p = présence du curseur (0 = parti, 1 = sur la page)
        const lisse = { x: 0, y: 0, p: 0 }
        const cx = new Float64Array(lettres.length)
        const cy = new Float64Array(lettres.length)
        const memo = new Int32Array(lettres.length).fill(-1)

        // La police répond-elle VRAIMENT aux axes variables ?
        // Piège mesuré : Chrome/Windows n'applique pas `font-variation-settings` aux polices
        // variables INSTALLÉES EN SYSTÈME — seules celles chargées en @font-face répondent.
        // Et rien ne garantit qu'un acheteur choisisse une police variable. Sans ce contrôle,
        // le composant écrirait consciencieusement des styles sans que rien ne bouge à
        // l'écran : le pire des cas, une fiche qui ment sans lever la moindre erreur.
        function axesActifs() {
            const l = lettres[0]
            if (!l) return false
            const avant = l.style.fontVariationSettings
            l.style.fontVariationSettings = `"wght" ${gRepos}, "wdth" ${lRepos}`
            const maigre = l.getBoundingClientRect().width
            l.style.fontVariationSettings = `"wght" ${gMax}, "wdth" ${lMax}`
            const gras = l.getBoundingClientRect().width
            l.style.fontVariationSettings = avant
            return Math.abs(gras - maigre) > 0.4
        }
        // Repli : on module l'échelle et l'espacement, ce que TOUTE police accepte. L'effet
        // est moins fin qu'une vraie graisse variable, mais il existe — et il est honnête.
        let variable = true
        function appliquerRepli(forcer) {
            const n = lettres.length
            for (let i = 0; i < n; i++) {
                const r = lettres[i].getBoundingClientRect()
                cx[i] = r.left + r.width / 2
                cy[i] = r.top + r.height / 2
            }
            let change = 0
            const ampleur = Math.min(0.5, Math.abs(gMax - gRepos) / 700)
            for (let i = 0; i < n; i++) {
                const d = Math.hypot(cx[i] - lisse.x, cy[i] - lisse.y)
                const t = Math.max(0, 1 - d / R)
                const e = t * t * (3 - 2 * t) * lisse.p
                const cle = Math.round(e * 1000)
                if (forcer || cle !== memo[i]) {
                    memo[i] = cle
                    lettres[i].style.transform =
                        e > 0.002
                            ? `scale(${(1 + e * ampleur).toFixed(3)})`
                            : ""
                    change++
                }
            }
            return change
        }

        // Un seul recalcul de mise en page par frame : on LIT toutes les positions, puis on
        // ÉCRIT tous les styles. Lire/écrire en alternance forcerait un reflow par lettre.
        function appliquerAxes(forcer) {
            const n = lettres.length
            for (let i = 0; i < n; i++) {
                const r = lettres[i].getBoundingClientRect()
                cx[i] = r.left + r.width / 2
                cy[i] = r.top + r.height / 2
            }
            let change = 0
            for (let i = 0; i < n; i++) {
                const d = Math.hypot(cx[i] - lisse.x, cy[i] - lisse.y)
                const t = Math.max(0, 1 - d / R)
                // adoucissement en S : la vague a un dos rond, pas un pic conique
                const e = t * t * (3 - 2 * t) * lisse.p
                const w = Math.round(gRepos + (gMax - gRepos) * e)
                const l = Math.round(lRepos + (lMax - lRepos) * e)
                // un seul entier par lettre pour mémoriser l'état : on n'écrit dans le style
                // que si la valeur ARRONDIE a bougé, sinon on repeint pour rien
                const cle = w * 1000 + l
                if (forcer || cle !== memo[i]) {
                    memo[i] = cle
                    lettres[i].style.fontVariationSettings =
                        `"wght" ${w}, "wdth" ${l}`
                    change++
                }
            }
            return change
        }

        // aiguillage décidé une fois, après le premier rendu : la police peut arriver tard
        function appliquer(forcer) {
            return variable ? appliquerAxes(forcer) : appliquerRepli(forcer)
        }

        function reposer() {
            // état représentatif du canvas de l'éditeur (et de prefers-reduced-motion) :
            // curseur virtuel au tiers du titre, la vague est lisible sans rien animer
            const r = wrap.getBoundingClientRect()
            lisse.x = r.left + r.width * 0.38
            lisse.y = r.top + r.height * 0.5
            lisse.p = 1
            appliquer(true)
        }

        function boucle(now) {
            if (mort) return
            const dt = Math.min((now - dernier) / 1000, 0.05)
            dernier = now

            // Lissage EXPONENTIEL du temps écoulé, pas un pas fixe par frame : la lettre met
            // le même temps à rattraper le curseur à 60 Hz et à 144 Hz. C'est le seul point
            // qui rend la promesse « souplesse » honnête d'un écran à l'autre.
            const k = 1 - Math.exp(-dt * souplesse)
            lisse.x += (cible.x - lisse.x) * k
            lisse.y += (cible.y - lisse.y) * k
            lisse.p += (cible.p - lisse.p) * k

            const bouge =
                Math.abs(cible.x - lisse.x) + Math.abs(cible.y - lisse.y) >
                    0.3 || Math.abs(cible.p - lisse.p) > 0.004
            const change = appliquer(false)

            if (bouge || change) calme = 0
            else calme++

            // Plus rien ne bouge : on rend la main au navigateur au lieu de le réveiller
            // 60 fois par seconde pour recalculer les mêmes valeurs. Le moindre mouvement
            // de souris, un scroll ou un redimensionnement relance la boucle.
            if (calme > 6) {
                raf = 0
                return
            }
            raf = requestAnimationFrame(boucle)
        }

        // Hors écran, la boucle est réellement ANNULÉE — pas seulement mise en sommeil.
        // Une boucle qui se réarme sans rien dessiner coûte quand même 60 réveils par
        // seconde : c'est exactement le motif de rejet du 05/08.
        function demarrer() {
            // trois gardes : composant démonté, rendu figé, boucle déjà en vol — et surtout
            // « pas visible », sinon un mouvement de souris relancerait un titre hors écran
            if (mort || fige || raf || !visible) return
            // horloge remise à l'heure : sinon le premier dt vaut le temps passé à dormir
            // et les lettres sautent d'un coup à leur valeur cible
            dernier = performance.now()
            calme = 0
            raf = requestAnimationFrame(boucle)
        }
        function arreter() {
            cancelAnimationFrame(raf)
            raf = 0
        }

        function onMove(e) {
            // premier contact : on pose le curseur lissé SUR la souris au lieu de le faire
            // traverser tout le titre depuis l'origine de la page
            if (!amorce) {
                lisse.x = e.clientX
                lisse.y = e.clientY
                amorce = true
            }
            cible.x = e.clientX
            cible.y = e.clientY
            cible.p = 1
            demarrer()
        }
        function onLeave() {
            // souris sortie de la page : tout revient au repos, en douceur
            cible.p = 0
            demarrer()
        }
        function onScroll() {
            // le curseur n'a pas bougé mais les lettres, si : il faut recalculer
            demarrer()
        }

        const ro = new ResizeObserver(() => {
            if (mort) return
            if (fige) reposer()
            else demarrer()
        })
        ro.observe(wrap)

        const io = new IntersectionObserver(
            (es) => {
                visible = es.some((e) => e.isIntersecting)
                if (visible) demarrer()
                else arreter()
            },
            { rootMargin: "120px" }
        )
        io.observe(wrap)

        variable = axesActifs()

        if (fige) {
            reposer()
        } else {
            appliquer(true) // état de repos posé avant le premier mouvement de souris
            window.addEventListener("pointermove", onMove, { passive: true })
            window.addEventListener("scroll", onScroll, { passive: true })
            document.addEventListener("pointerleave", onLeave)
        }

        // Les métriques changent quand la police demandée finit par arriver : on repose
        // l'état figé une fois qu'elle est là, sinon le canvas garde une vague décalée.
        if (
            document.fonts &&
            document.fonts.ready &&
            document.fonts.ready.then
        ) {
            document.fonts.ready.then(() => {
                if (mort) return
                // la police arrivée peut changer la réponse aux axes : on retranche
                variable = axesActifs()
                memo.fill(-1)
                if (fige) reposer()
                else demarrer()
            })
        }

        return () => {
            mort = true
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("scroll", onScroll)
            document.removeEventListener("pointerleave", onLeave)
        }
    }, [
        texte,
        rayon,
        graisseRepos,
        graisseMax,
        largeurRepos,
        largeurMax,
        souplesse,
        taille,
        interlettrage,
        alignement,
        fd,
        isStatic,
    ])

    const justif =
        alignement === "left"
            ? "flex-start"
            : alignement === "right"
              ? "flex-end"
              : "center"

    // font-weight sert UNIQUEMENT de secours : si la famille choisie n'est pas variable,
    // font-variation-settings n'a aucun effet et le titre garde une graisse correcte au
    // lieu de retomber à 400. Sur une police variable, l'axe wght passe devant.
    const grasSecours = borne(Math.round(graisseRepos / 100) * 100, 100, 900)

    return (
        <div
            ref={wrapRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: justif,
                overflow: "hidden",
            }}
        >
            <h1
                aria-label={String(texte == null ? "" : texte)}
                style={{
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: justif,
                    maxWidth: "100%",
                    fontFamily: fd,
                    fontSize: taille,
                    fontWeight: grasSecours,
                    lineHeight: 0.95,
                    letterSpacing: `${interlettrage}em`,
                    color: couleur,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    fontVariationSettings: `"wght" ${Math.round(graisseRepos)}, "wdth" ${Math.round(largeurRepos)}`,
                }}
            >
                {lignes.map((mots, li) => (
                    <span
                        key={li}
                        aria-hidden="true"
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: justif,
                            maxWidth: "100%",
                        }}
                    >
                        {mots.map((mot, mi) =>
                            /^[ \t]+$/.test(mot) ? (
                                <span key={mi} style={{ whiteSpace: "pre" }}>
                                    {mot}
                                </span>
                            ) : (
                                // le mot reste insécable : seules ses lettres bougent dedans
                                <span
                                    key={mi}
                                    style={{
                                        display: "inline-flex",
                                        whiteSpace: "pre",
                                    }}
                                >
                                    {Array.prototype.map.call(mot, (c, ci) => (
                                        <span
                                            key={ci}
                                            data-lettre=""
                                            style={{ display: "inline-block" }}
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </span>
                            )
                        )}
                    </span>
                ))}
            </h1>
        </div>
    )
}

VariaTypeFX.defaultProps = {
    texte: "VARIABLE",
    rayon: 260,
    graisseRepos: 200,
    graisseMax: 900,
    largeurRepos: 80,
    largeurMax: 140,
    souplesse: 8,
    taille: 140,
    interlettrage: 0,
    alignement: "centre",
    // crème, comme le reste de la gamme : un défaut sombre rendait le titre illisible
    // sur les fonds sombres où ce composant a toute sa place
    couleur: "#EDE8DF",
}

addPropertyControls(VariaTypeFX, {
    texte: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        description:
            "Line breaks happen between words. Letters never split mid-word.",
    },
    police: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        description:
            "Pick a VARIABLE font — Roboto Flex, Inter or Open Sans Variable all expose the weight and width axes. With a static font the component detects it and falls back to a scale ripple, so the title still responds to the cursor.",
    },
    taille: {
        type: ControlType.Number,
        min: 24,
        max: 400,
        step: 1,
        unit: "px",
        title: "Size",
    },
    couleur: { type: ControlType.Color, title: "Colour" },
    alignement: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "centre", "right"],
        optionTitles: ["Left", "Centre", "Right"],
        displaySegmentedControl: true,
    },
    interlettrage: {
        type: ControlType.Number,
        min: -0.1,
        max: 0.5,
        step: 0.005,
        unit: "em",
        title: "Letter spacing",
    },
    rayon: {
        type: ControlType.Number,
        min: 40,
        max: 900,
        step: 10,
        unit: "px",
        title: "Influence radius",
        description: "How far from the cursor a letter still reacts.",
    },
    graisseRepos: {
        type: ControlType.Number,
        min: WGHT_MIN,
        max: WGHT_MAX,
        step: 10,
        title: "Rest weight",
    },
    graisseMax: {
        type: ControlType.Number,
        min: WGHT_MIN,
        max: WGHT_MAX,
        step: 10,
        title: "Peak weight",
        description:
            "Weight reached by the letter sitting right under the cursor.",
    },
    largeurRepos: {
        type: ControlType.Number,
        min: WDTH_MIN,
        max: WDTH_MAX,
        step: 1,
        title: "Rest width",
    },
    largeurMax: {
        type: ControlType.Number,
        min: WDTH_MIN,
        max: WDTH_MAX,
        step: 1,
        title: "Peak width",
        description:
            "Width axis under the cursor. Set it equal to Rest width for a weight-only wave.",
    },
    souplesse: {
        type: ControlType.Number,
        min: 1,
        max: 24,
        step: 0.5,
        title: "Follow ease",
        description:
            "How tightly the wave tracks the cursor and settles back. Low is loose and floaty, high is immediate. Frame-rate independent: identical feel at 60 and 144 Hz.",
    },
})
