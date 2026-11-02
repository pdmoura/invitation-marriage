# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Guests** of Pedro & Sara's wedding, mostly Brazilian family and friends, plus some English- and Spanish-speaking guests. Most open the site on an Android phone from a WhatsApp message. Many are not tech-savvy.
- **The couple (Pedro & Sara)**, who manage invites and follow RSVPs and money in the admin panel.

## Product Purpose

A personal wedding invitation for 17 July 2027 in Formosa, Goiás (Brazil). Each guest gets their own link. It opens like a real envelope and shows the date, the places and a one-tap RSVP for exactly the people the couple invited. It also collects cash gifts by Pix or card, because the couple moves to Mexico right after the wedding and can't carry physical gifts. Success: guests confirm in seconds, find the date and location immediately, and gift without friction.

## Positioning

An invitation addressed to one household, not a public wedding website. The link knows who the guest is, how many seats they have, which language they read and whether they see a gift list or a simple contribution card.

## Operating Context

- Links are sent one by one from the admin via WhatsApp, in the guest's language (PT, EN or ES).
- RSVP is all-or-nothing for the reserved seats; guests cannot add people.
- Gifts are money: static Pix QR (confirmed manually by the couple in their bank) or Stripe card checkout. Humorous gift items exist only as a friendlier way to give.
- Dry season in the cerrado in July; ceremony 16h, reception 18h (venues still to be confirmed).

## Capabilities and Constraints

- Node/Express server, vanilla HTML/CSS/JS front end, SQLite locally / Postgres in production, deployed on Render.
- Per-invite language (pt/en/es) and gift mode (items | simple) set in the admin.
- Prices are always computed server-side.
- Undecided: venue names and addresses, real couple photos, story texts (placeholders until the couple provides them).

## Brand Commitments

- Envelope-opening intro on each personal link, held open with a "tap again" hint before the invitation appears (explicit request).
- Three quick actions near the top, like a printed invitation: confirm attendance, gift list, location (explicit request, from the couple's reference).
- Light humor in gift texts, never jokes about the couple lacking money; the Mexico move is the honest reason for cash gifts.
- Must look premium and modern on Android phones first; no empty screens, no slow scroll between sections.

## Evidence on Hand

- No photos of the couple yet: stock photographs (Unsplash licence) stand in and must be replaced (`public/img/site/`).
- No testimonials, guest counts or other claims may be invented.

## Product Principles

1. One guest, one invitation: everything on the page is addressed to the person holding the link.
2. Confirming or gifting takes one tap and no learning.
3. The date, the place and the actions are visible within the first screen.
4. Feels like real stationery in the hand, not a website template.

## Accessibility & Inclusion

Large tap targets and readable type for older relatives on phones; three languages; reduced-motion respected.
