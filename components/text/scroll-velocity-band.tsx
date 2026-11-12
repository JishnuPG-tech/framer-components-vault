// VeloMarqueeFX — Framer code component · un bandeau défilant qui obéit au scroll.
// Au repos il dérive doucement ; on descend, il accélère et se penche dans le sens de la
// marche ; on remonte, il repart en sens inverse et se penche de l'autre côté. Le retour au
// calme est amorti, pas net : c'est ce qui donne au bandeau son poids.
//
// Pourquoi ce composant : le marquee est le motif le plus copié du marketplace ET le plus
// interchangeable — presque toutes les fiches sont la même animation CSS `translateX(-50%)`
// en boucle. La réaction à la vélocité du scroll est ce qui sépare une fiche qui se vend
// d'une fiche de plus. Voir G:\TemplateFactory\market\ETUDE.md
//
// Reprend la recette `marquee-band` de Webator et la dépasse sur trois points :
//   • vitesse ET inclinaison pilotées par la vélocité de scroll, marche arrière comprise ;
//   • boucle sur la largeur MESURÉE d'un motif, pas sur -50 % : changer le texte, la police
//     ou la largeur du bloc ne provoque plus le saut classique à la fin du cycle ;
//   • le nombre de copies est calculé d'après la largeur réelle du bloc, donc jamais de trou
//     sur un écran large ni de copies inutiles sur mobile.
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


const COPIES_MAX = 40 // garde-fou : un texte très court sur un écran très large

// vélocité de scroll (px/s) qui suffit à saturer l'inclinaison et le coup d'accélérateur
const VITESSE_PLEINE = 1400

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 120
 * @framerDisableUnlink
 */
export default function VeloMarqueeFX(props) {
    const {
        texte,
        separateur,
        vitesse,
        sensibilite,
        inclinaison,
        sens,
        police,
        couleur,
        fond,
        filets,
        fondu,
    } = props

    const wrapRef = React.useRef(null)
    const pisteRef = React.useRef(null)
    const isStatic = useIsStaticRenderer()

    // Le nombre de copies est un ÉTAT (il repeuple le DOM) mais il ne doit jamais relancer
    // la boucle : elle est montée une fois, elle relit le motif quand on le lui dit.
    const [copies, setCopies] = React.useState(3)
    const copiesRef = React.useRef(3)
    copiesRef.current = copies

    const fd =
        (police && police.fontFamily) ||
        `"Inter", ui-sans-serif, system-ui, sans-serif`
    const fs = (police && police.fontSize) || 34
    const fw = (police && police.fontWeight) || 700
    const ls = (police && police.letterSpacing) || "0.02em"

    React.useEffect(() => {
        const wrap = wrapRef.current
        const piste = pisteRef.current
        if (!wrap || !piste) return

        const reduit = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const fige = isStatic || reduit
        const dir = sens === "right" ? -1 : 1

        let mort = false
        let raf = 0
        let visible = false
        let motif = 0 // largeur d'UN motif, en px — la seule longueur sur laquelle on boucle
        let x = 0
        let vLisse = 0
        let dernier = 0
        let yPrec = 0
        let rt = 0

        function positionScroll() {
            const doc = document.documentElement
            return window.scrollY || doc.scrollTop || 0
        }

        function poser() {
            const p = borne(vLisse / VITESSE_PLEINE, -1, 1)
            // le bandeau se penche DANS le sens de la marche : la pente suit le signe de la
            // vitesse effective, pas celui du scroll, sinon la marche arrière se penche à
            // l'envers et l'œil lit une erreur sans savoir laquelle
            const pente = -dir * p * inclinaison
            piste.style.transform = `translate3d(${(-x).toFixed(2)}px,0,0) skewX(${pente.toFixed(2)}deg)`
        }

        function mesurer() {
            const premier = piste.firstElementChild
            if (!premier) return
            // largeur SOUS-PIXEL : arrondir ici, c'est une couture d'un pixel qui revient à
            // chaque cycle. C'est exactement le défaut du marquee en pourcentage.
            const L = premier.getBoundingClientRect().width
            if (L > 1) {
                motif = L
                const besoin = Math.min(
                    COPIES_MAX,
                    Math.ceil(wrap.offsetWidth / L) + 2
                )
                if (besoin !== copiesRef.current) {
                    copiesRef.current = besoin
                    setCopies(besoin)
                }
                x = ((x % motif) + motif) % motif
                poser()
            }
        }

        function boucle(now) {
            if (mort) return
            const dt = Math.min((now - dernier) / 1000, 0.05)
            dernier = now

            // Vélocité de scroll lue dans la boucle plutôt que dans un écouteur : on obtient
            // des px/s vrais (donc identiques à 60 et à 144 Hz) et la valeur retombe d'elle-
            // même à zéro dès qu'on arrête de défiler, sans minuteur de relâchement.
            const y = positionScroll()
            const brut = dt > 0 ? (y - yPrec) / dt : 0
            yPrec = y
            // lissage exponentiel : montée franche, retour au calme amorti
            const k = 1 - Math.exp(-dt * 6)
            vLisse += (brut - vLisse) * k

            // Le coup d'accélérateur est BORNÉ à la même vélocité que la pente : sans ça, un
            // coup de molette sec (3 000 px/s, ce que produit un trackpad lancé) fait passer
            // le bandeau à quarante fois sa vitesse et le texte devient une bouillie. Sous le
            // seuil, la réponse reste strictement proportionnelle au scroll.
            const effective =
                dir *
                (vitesse +
                    borne(vLisse, -VITESSE_PLEINE, VITESSE_PLEINE) *
                        sensibilite)
            x += effective * dt
            if (motif > 1) x = ((x % motif) + motif) % motif
            poser()

            raf = requestAnimationFrame(boucle)
        }

        // Hors écran, la boucle est réellement ANNULÉE — pas seulement mise en sommeil.
        // Un bandeau vit rarement seul sur la page : sans ça, trois marquees dans un long
        // site font tourner trois boucles en permanence. Motif de rejet du 05/08.
        function demarrer() {
            if (mort || fige || raf || !visible) return
            // horloge ET position de scroll remises à l'heure : sans ça, le premier dt vaut
            // le temps passé hors écran et la vélocité vaut toute la hauteur parcourue —
            // le bandeau part en flèche au retour à l'écran
            dernier = performance.now()
            yPrec = positionScroll()
            vLisse = 0
            raf = requestAnimationFrame(boucle)
        }
        function arreter() {
            cancelAnimationFrame(raf)
            raf = 0
        }

        const ro = new ResizeObserver(() => {
            clearTimeout(rt)
            rt = setTimeout(() => {
                if (mort) return
                mesurer()
            }, 120)
        })
        ro.observe(wrap)

        const io = new IntersectionObserver(
            (es) => {
                visible = es.some((e) => e.isIntersecting)
                if (visible) demarrer()
                else arreter()
            },
            { rootMargin: "80px" }
        )
        io.observe(wrap)

        mesurer()
        if (fige) {
            // canvas de l'éditeur / reduced-motion : un état FIXE représentatif — le motif
            // décalé (on voit que ça défile) et une légère pente (on voit que ça réagit)
            x = motif * 0.28
            vLisse = VITESSE_PLEINE * 0.35
            poser()
        }

        // les métriques changent quand la police arrive : on remesure, sinon la boucle
        // tourne sur la largeur d'une police de secours et la couture se voit
        if (
            document.fonts &&
            document.fonts.ready &&
            document.fonts.ready.then
        ) {
            document.fonts.ready.then(() => {
                if (mort) return
                mesurer()
                if (fige) poser()
            })
        }

        return () => {
            mort = true
            cancelAnimationFrame(raf)
            clearTimeout(rt)
            ro.disconnect()
            io.disconnect()
        }
    }, [
        texte,
        separateur,
        vitesse,
        sensibilite,
        inclinaison,
        sens,
        fd,
        fs,
        fw,
        ls,
        isStatic,
    ])

    const masque =
        fondu > 0
            ? `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${(fondu * 100).toFixed(1)}%, rgba(0,0,0,1) ${(100 - fondu * 100).toFixed(1)}%, rgba(0,0,0,0) 100%)`
            : undefined

    const filet = filets ? `1px solid ${teinter(couleur, 0.28)}` : "none"

    const unMotif = (i) => (
        // au-delà de la première copie, le texte est décoratif : on l'ôte du lecteur
        // d'écran, sinon le slogan est annoncé autant de fois qu'il y a de copies
        <span
            key={i}
            aria-hidden={i === 0 ? undefined : "true"}
            style={{
                display: "inline-flex",
                alignItems: "center",
                flex: "none",
                whiteSpace: "pre",
            }}
        >
            <span>{texte}</span>
            <span style={{ padding: "0 0.55em", opacity: 0.62 }}>
                {separateur}
            </span>
        </span>
    )

    return (
        <div
            ref={wrapRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                background: fond,
                borderTop: filet,
                borderBottom: filet,
                boxSizing: "border-box",
            }}
        >
            {/* le fondu porte sur cette fenêtre, PAS sur le bandeau : sinon c'est le fond
                coloré qui s'efface aux extrémités et la bande semble mal découpée */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    maskImage: masque,
                    WebkitMaskImage: masque,
                }}
            >
                <div
                    ref={pisteRef}
                    style={{
                        display: "flex",
                        flex: "none",
                        width: "max-content",
                        alignItems: "center",
                        willChange: "transform",
                        fontFamily: fd,
                        fontSize: fs,
                        fontWeight: fw,
                        letterSpacing: ls,
                        lineHeight: 1.25,
                        color: couleur,
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                >
                    {Array.from({ length: copies }, (_, i) => unMotif(i))}
                </div>
            </div>
        </div>
    )
}

const borne = (v, min, max) => Math.max(min, Math.min(max, v))

// éclaircit/assombrit une couleur sans dépendre d'une librairie : on n'accepte que les
// formes que Framer produit (hex court, hex long, rgb/rgba), et on rend la couleur telle
// quelle si elle est exotique — mieux vaut un filet trop franc qu'un filet invisible
function teinter(couleur, alpha) {
    const m = /^#([0-9a-f]{3,8})$/i.exec(String(couleur).trim())
    if (m) {
        let s = m[1]
        if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
        const r = parseInt(s.slice(0, 2), 16)
        const g = parseInt(s.slice(2, 4), 16)
        const b = parseInt(s.slice(4, 6), 16)
        return `rgba(${r},${g},${b},${alpha})`
    }
    const rgb = /rgba?\(([^)]+)\)/i.exec(String(couleur))
    if (rgb) {
        const p = rgb[1].split(",").map((v) => parseFloat(v))
        return `rgba(${p[0] || 0},${p[1] || 0},${p[2] || 0},${alpha})`
    }
    return couleur
}

VeloMarqueeFX.defaultProps = {
    texte: "DESIGN THAT MOVES",
    separateur: "✦",
    vitesse: 70,
    sensibilite: 1.2,
    inclinaison: 8,
    sens: "left",
    couleur: "#0B0B12",
    fond: "#F2E9DC",
    filets: true,
    fondu: 0.06,
}

addPropertyControls(VeloMarqueeFX, {
    texte: { type: ControlType.String, title: "Text" },
    separateur: {
        type: ControlType.String,
        title: "Separator",
        description:
            "Sits between two repeats. A dot, a star, a dash — or a space for none.",
    },
    police: { type: ControlType.Font, title: "Font", controls: "extended" },
    couleur: { type: ControlType.Color, title: "Text colour" },
    fond: { type: ControlType.Color, title: "Background" },
    vitesse: {
        type: ControlType.Number,
        min: 0,
        max: 400,
        step: 5,
        unit: "px/s",
        title: "Base speed",
        description: "How fast the band drifts when the page is still.",
    },
    sensibilite: {
        type: ControlType.Number,
        min: 0,
        max: 6,
        step: 0.1,
        title: "Scroll response",
        description:
            "Scrolling down speeds the band up, scrolling up sends it backwards. The boost is capped, so a hard flick never turns the text into a smear. Set to 0 for a plain marquee.",
    },
    inclinaison: {
        type: ControlType.Number,
        min: 0,
        max: 24,
        step: 0.5,
        unit: "°",
        title: "Max lean",
        description: "How far the band tilts at full scroll speed.",
    },
    sens: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Leftwards", "Rightwards"],
        displaySegmentedControl: true,
    },
    filets: {
        type: ControlType.Boolean,
        title: "Rules",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fondu: {
        type: ControlType.Number,
        min: 0,
        max: 0.4,
        step: 0.01,
        title: "Edge fade",
        description: "Fades both ends of the band. 0 keeps hard edges.",
    },
})
