# Design — Pedro & Sara invitation

The page is the printed invitation. Every section is another piece of the same stationery:
envelope → invitation card → letter → day cards → gift tags → reply card → back of the card.
Direction "page-is-the-object" (design-taste-frontend, seed 1324903938).

## Tokens (public/styles.css `:root`)

| Role | Value |
|---|---|
| Ground (page) | `--ground #a6b3bc` slate |
| Paper (cards) | `--paper #eeeeea`, `--paper-2 #e1e2dd` |
| Ink / muted | `--ink #1c1c1c`, `--muted #38424a` |
| Accent (actions, the close) | `--accent #2c3620` olive on `--accent-ink #e3e2da` |
| Fields | `--sage #b7c8be`, `--blush #d6c4b8`, `--slate-light #c9d2d8` |
| Ipê (stamp only) | `--ipe #e2b33c` |

Type: **Bebas Neue** (names, numbers, section titles, uppercase) and **EB Garamond** (every sentence).
Five steps only: `--step-small`, `--step-body`, `--step-lead`, `--step-head`, `--step-names`.

## Rules

- Square corners everywhere; the only circles are the three hero actions, seats and the wax seal.
- Edges are real paper edges: the olive/paper **ribbon** (SVG tile), **scallops** (SVG tile), dotted perforations (`5px dotted`).
- No gradients, hairlines, glass or shadows at rest (only the dialog and the floating envelope carry a shadow).
- Buttons: flat, square, one fill — `btn--accent` (olive), `btn--ink`, `btn--ghost` (paper-2), `btn--text`.
- Icons: one authored SVG sprite in `index.html` (`#i-*`), stroke 1.5, drawn for this page.
- Margins: `--m` (20–32px); section rhythm `--section` (96–168px).
- Fields change per section: slate hero → sage letter → slate day → blush gifts → olive reply → slate back.

## Motion

- Signature: the hero photograph crossfades every 5.6 s with a slow drift.
- Envelope: tap to open (seal, flap, letter rises), held open with a hand hint, second tap enters.
- Day cards fold into spines while the section is pinned (desktop only, 2 screens).
- Entrances: 24px rise + fade, staggered 70–80 ms. Everything respects `prefers-reduced-motion`.

## Admin

The admin panel is an Operate surface and keeps its own stylesheet (`admin-base.css` + `admin.css`).
