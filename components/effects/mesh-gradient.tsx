// MeshDriftFX — Framer code component · un fond de gradient qui respire, avec son grain.
// Quatre nappes de couleur dérivent lentement l'une sur l'autre et un grain argentique
// vient casser le dégradé. C'est le fond de hero par défaut de tous les sites de 2026.
//
// Pourquoi ce composant : « background / gradient » est la catégorie la plus fournie du
// catalogue ET celle qui continue de vendre — mais l'écrasante majorité des fiches sont des
// dégradés CSS statiques. Un vrai mesh animé avec grain, réglable, n'a presque pas d'offre.
// Voir G:\TemplateFactory\market\ETUDE.md
//
// Canvas2D + flou GPU, zéro dépendance, zéro ressource externe. Le grain est généré une fois
// en trois tuiles cyclées : coût constant, quelle que soit la taille du bloc.
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


const TUILE = 128
const TUILES = 3

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 * @framerDisableUnlink
 */
export default function MeshDriftFX(props) {
    const {
        couleurs,
        fond,
        nombre,
        ampleur,
        vitesse,
        flou,
        grain,
        tailleGrain,
        vignette,
        contraste,
        reactionSouris,
    } = props

    const wrapRef = React.useRef(null)
    const nappesRef = React.useRef(null)
    const grainRef = React.useRef(null)
    const isStatic = useIsStaticRenderer()

    const palette = React.useMemo(() => {
        const c = (couleurs || []).filter(Boolean)
        return c.length ? c : ["#6EE7F2", "#A78BFA", "#F472B6", "#FBBF24"]
    }, [couleurs])

    React.useEffect(() => {
        const wrap = wrapRef.current
        const cn = nappesRef.current
        const cg = grainRef.current
        if (!wrap || !cn) return

        const ctx = cn.getContext("2d", { alpha: false })
        const gtx = cg ? cg.getContext("2d") : null
        const reduit = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const fige = isStatic || reduit

        let raf = 0
        let mort = false
        let visible = true
        let w = 0,
            h = 0
        let temps = fige ? 3.4 : 0 // en rendu figé on s'arrête sur une composition déjà installée
        let images = []
        let trame = 0

        const brut = { x: 0.5, y: 0.5 }
        const lisse = { x: 0.5, y: 0.5 }

        const N = Math.max(2, Math.min(8, nombre))
        // phases dérivées de l'indice : la composition est reproductible, pas tirée au sort.
        // deux instances côte à côte avec les mêmes réglages donnent donc la même image.
        const nappes = Array.from({ length: N }, (_, i) => {
            // chaque nappe a son propre quartier, réparti sur un anneau : sans ça elles se
            // superposent toutes au centre et le mélange vire au blanc
            const t = (i / N) * Math.PI * 2 + 0.6
            return {
                couleur: palette[i % palette.length],
                bx: 0.5 + Math.cos(t) * 0.3,
                by: 0.5 + Math.sin(t) * 0.28,
                ax: 0.13 + 0.06 * ((i * 5) % 3),
                ay: 0.11 + 0.05 * ((i * 7) % 3),
                fx: 0.11 + 0.043 * i,
                fy: 0.087 + 0.037 * ((i + 2) % 5),
                px: i * 1.9,
                py: i * 2.7 + 0.8,
                r: 0.4 + 0.055 * ((i * 3) % 4),
            }
        })

        function dimensionner() {
            w = wrap.offsetWidth
            h = wrap.offsetHeight
            // le canvas des nappes est volontairement basse définition : il est flouté
            // derrière, personne ne verra la différence et le coût s'effondre
            const q = Math.max(1, Math.min(w, h) / 260)
            cn.width = Math.max(2, Math.round(w / q))
            cn.height = Math.max(2, Math.round(h / q))
            if (cg) {
                const dpr = Math.min(window.devicePixelRatio || 1, 2)
                cg.width = Math.max(1, Math.round(w * dpr))
                cg.height = Math.max(1, Math.round(h * dpr))
                if (gtx) gtx.setTransform(dpr, 0, 0, dpr, 0, 0)
            }
        }

        // trois tuiles de bruit générées une fois pour toutes, puis cyclées : le grain
        // scintille comme de l'argentique sans qu'on recalcule un seul pixel par frame
        function fabriquerGrain() {
            images = []
            if (!gtx) return
            for (let k = 0; k < TUILES; k++) {
                const t = document.createElement("canvas")
                t.width = TUILE
                t.height = TUILE
                const tx = t.getContext("2d")
                const d = tx.createImageData(TUILE, TUILE)
                for (let i = 0; i < d.data.length; i += 4) {
                    const v = (Math.random() * 255) | 0
                    d.data[i] = v
                    d.data[i + 1] = v
                    d.data[i + 2] = v
                    d.data[i + 3] = 255
                }
                tx.putImageData(d, 0, 0)
                images.push(gtx.createPattern(t, "repeat"))
            }
        }

        function dessinerNappes() {
            const W = cn.width,
                H = cn.height
            ctx.fillStyle = fond
            ctx.fillRect(0, 0, W, H)

            const dx = (lisse.x - 0.5) * reactionSouris
            const dy = (lisse.y - 0.5) * reactionSouris

            // peinture par recouvrement, pas par addition : deux nappes qui se croisent se
            // fondent l'une dans l'autre au lieu de saturer en blanc
            for (let i = 0; i < nappes.length; i++) {
                const n = nappes[i]
                // deux sinusoïdes de fréquences premières entre elles : la trajectoire ne
                // se referme jamais sur elle-même, donc l'œil ne repère pas de boucle
                const x =
                    (n.bx +
                        Math.sin(temps * n.fx + n.px) * n.ax * ampleur +
                        dx) *
                    W
                const y =
                    (n.by +
                        Math.cos(temps * n.fy + n.py) * n.ay * ampleur +
                        dy) *
                    H
                const r = Math.max(W, H) * n.r * ampleur
                const g = ctx.createRadialGradient(x, y, 0, x, y, r)
                g.addColorStop(0, teinter(n.couleur, 0.95))
                g.addColorStop(0.42, teinter(n.couleur, 0.55))
                g.addColorStop(1, teinter(n.couleur, 0))
                ctx.fillStyle = g
                ctx.fillRect(0, 0, W, H)
            }
        }

        function dessinerGrain() {
            if (!gtx || !images.length) return
            gtx.clearRect(0, 0, w, h)
            gtx.globalAlpha = grain
            gtx.fillStyle = images[trame % images.length]
            const s = Math.max(0.4, tailleGrain)
            gtx.save()
            gtx.scale(s, s)
            gtx.fillRect(0, 0, w / s + TUILE, h / s + TUILE)
            gtx.restore()
            gtx.globalAlpha = 1
        }

        function onMove(e) {
            const r = wrap.getBoundingClientRect()
            brut.x = (e.clientX - r.left) / Math.max(1, r.width)
            brut.y = (e.clientY - r.top) / Math.max(1, r.height)
        }
        function onLeave() {
            brut.x = 0.5
            brut.y = 0.5
        }

        let compte = 0
        let dernier = performance.now()
        function boucle(now) {
            if (mort) return
            raf = requestAnimationFrame(boucle)
            if (!visible) return
            const dt = Math.min((now - dernier) / 1000, 0.05)
            dernier = now
            temps += dt * vitesse

            const k = 1 - Math.exp(-dt * 3.2)
            lisse.x += (brut.x - lisse.x) * k
            lisse.y += (brut.y - lisse.y) * k

            dessinerNappes()
            // le grain n'a pas besoin de 60 images par seconde : à 15 Hz il « croustille »
            // davantage, et on économise trois quarts du travail
            compte++
            if (grain > 0 && compte % 4 === 0) {
                trame++
                dessinerGrain()
            }
        }

        let rt = 0
        const ro = new ResizeObserver(() => {
            clearTimeout(rt)
            rt = setTimeout(() => {
                if (mort) return
                dimensionner()
                fabriquerGrain()
                dessinerNappes()
                dessinerGrain()
            }, 140)
        })
        ro.observe(wrap)

        const io = new IntersectionObserver(
            (es) => {
                visible = es.some((e) => e.isIntersecting)
            },
            { rootMargin: "100px" }
        )
        io.observe(wrap)

        dimensionner()
        fabriquerGrain()
        dessinerNappes()
        dessinerGrain()

        if (!fige) {
            if (reactionSouris > 0) {
                wrap.addEventListener("pointermove", onMove, { passive: true })
                wrap.addEventListener("pointerleave", onLeave, {
                    passive: true,
                })
            }
            raf = requestAnimationFrame(boucle)
        }

        return () => {
            mort = true
            cancelAnimationFrame(raf)
            clearTimeout(rt)
            ro.disconnect()
            io.disconnect()
            wrap.removeEventListener("pointermove", onMove)
            wrap.removeEventListener("pointerleave", onLeave)
        }
    }, [
        palette,
        fond,
        nombre,
        ampleur,
        vitesse,
        grain,
        tailleGrain,
        reactionSouris,
        isStatic,
    ])

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: fond,
            }}
        >
            <canvas
                ref={nappesRef}
                style={{
                    position: "absolute",
                    // débordement volontaire : le flou mange les bords, on les sort du cadre
                    inset: `-${Math.round(flou * 0.9)}px`,
                    width: `calc(100% + ${Math.round(flou * 1.8)}px)`,
                    height: `calc(100% + ${Math.round(flou * 1.8)}px)`,
                    filter: `blur(${flou}px) contrast(${contraste}) saturate(1.15)`,
                    display: "block",
                }}
            />
            <canvas
                ref={grainRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    mixBlendMode: "overlay",
                    pointerEvents: "none",
                    display: "block",
                }}
            />
            {vignette > 0 ? (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: `radial-gradient(120% 100% at 50% 45%, rgba(0,0,0,0) 42%, rgba(0,0,0,${vignette}) 100%)`,
                    }}
                />
            ) : null}
        </div>
    )
}

// éclaircit ou assombrit une couleur sans dépendre d'une librairie : on passe par le
// canvas du navigateur, seul analyseur de couleur CSS toujours d'accord avec le rendu
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
        const p = rgb[1].split(",").map((x) => parseFloat(x))
        return `rgba(${p[0] || 0},${p[1] || 0},${p[2] || 0},${alpha})`
    }
    return couleur
}

MeshDriftFX.defaultProps = {
    couleurs: ["#6EE7F2", "#A78BFA", "#F472B6", "#3B82F6"],
    fond: "#05050A",
    nombre: 4,
    ampleur: 1,
    vitesse: 1,
    flou: 62,
    grain: 0.16,
    tailleGrain: 1,
    vignette: 0.35,
    contraste: 1.1,
    reactionSouris: 0.12,
}

addPropertyControls(MeshDriftFX, {
    couleurs: {
        type: ControlType.Array,
        title: "Couleurs",
        control: { type: ControlType.Color, title: "Nappe" },
    },
    fond: { type: ControlType.Color, title: "Fond" },
    nombre: {
        type: ControlType.Number,
        min: 2,
        max: 8,
        step: 1,
        title: "Nappes",
    },
    ampleur: {
        type: ControlType.Number,
        min: 0.4,
        max: 1.8,
        step: 0.05,
        title: "Ampleur",
    },
    vitesse: {
        type: ControlType.Number,
        min: 0,
        max: 3,
        step: 0.05,
        title: "Vitesse",
    },
    flou: {
        type: ControlType.Number,
        min: 10,
        max: 160,
        step: 2,
        unit: "px",
        title: "Fondu",
    },
    contraste: {
        type: ControlType.Number,
        min: 0.6,
        max: 2,
        step: 0.05,
        title: "Contraste",
    },
    grain: {
        type: ControlType.Number,
        min: 0,
        max: 0.6,
        step: 0.01,
        title: "Grain",
    },
    tailleGrain: {
        type: ControlType.Number,
        min: 0.5,
        max: 3,
        step: 0.1,
        title: "Taille du grain",
        hidden: (p) => !p.grain,
    },
    vignette: {
        type: ControlType.Number,
        min: 0,
        max: 0.9,
        step: 0.05,
        title: "Vignettage",
    },
    reactionSouris: {
        type: ControlType.Number,
        min: 0,
        max: 0.5,
        step: 0.01,
        title: "Réaction au curseur",
        description:
            "Les nappes suivent doucement la souris. 0 pour un fond totalement autonome.",
    },
})
