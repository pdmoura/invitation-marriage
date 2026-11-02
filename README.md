# 💍 Pedro & Sara — 17.07.2027 · Formosa, GO

Wedding website with:

- **Envelope intro**: each guest's personal link (`…/c/<code>`) opens with a sealed envelope addressed to them. One tap breaks the wax seal, the flap lifts, the invitation slides out, and the site appears.
- **Three languages per guest**: Portuguese, English or Spanish, chosen per invite in the admin. Dates, buttons and gifts all follow it. A small PT · EN · ES switch in the footer lets guests change it.
- **One-tap RSVP**: the invite shows the exact number of people you reserved (e.g. *Joana e família — 4*). Guests only tap **Confirmar presença** or **Não poderei ir**.
- **Gifts as contributions** (you're moving to Mexico, so no physical gifts). Per invite, choose:
  - **Lista de presentes**: 11 light-hearted gifts with photos plus "valor livre". Tapping **Presentear** opens one window with the gift, name and **Pix** or **card** right away, with no cart.
  - **Só contribuição**: a single card explaining the move to Mexico, with one button. It opens the same window with suggested amounts (R$ 100 … R$ 1.000), Pix or card, then the thank-you page.
- **Couple's admin panel** at `/admin`: guests, language and gift style per invite, who opened, who confirmed, and money received.
- **Smooth, subtle motion**: Lenis smooth scrolling on desktop (native on phones), gentle reveals, image wipes, light parallax, a word-by-word statement. All of it is off for people who prefer reduced motion.

![Envelope](docs/screenshots/01-envelope.png)

More in [`docs/screenshots/`](docs/screenshots); design references in [`docs/inspiration.md`](docs/inspiration.md).

## Run locally

```bash
npm install
cp .env.example .env   # set ADMIN_PASSWORD and PIX_KEY at least
npm run dev            # site: http://localhost:3000 · admin: http://localhost:3000/admin
```

```bash
npm test
```

Without `DATABASE_URL`, data goes to a local SQLite file (`data/wedding.db`, git-ignored). `SEED_DEMO=true` creates demo invites (`/c/joana`, `/c/tiojoao`, `/c/john`, `/c/garcia`). Use it for previews only.

## How the couple uses it

1. Open `/admin` and log in with `ADMIN_PASSWORD`.
2. Add an invite: name as it should appear (*Joana e família*), exact number of people, WhatsApp, **language** (🇧🇷 / 🇺🇸 / 🇪🇸) and **gifts** (🎁 list or 💛 contribution only).
   Or **Importar lista**: one per line, `Nome; pessoas; telefone; idioma; presentes` (e.g. `John and Mary; 2; +1 555 123 4567; en; simples`).
3. Click **Enviar no WhatsApp** for each invite. It opens WhatsApp with a ready message, in the guest's language, containing their personal link.
4. Follow along:
   - **Presença confirmada**: confirmed people vs. invited people.
   - **Convites**: who opened their link, who hasn't answered (filters: *Confirmados / Aguardando / Não vão / Não abriram*).
   - **Arrecadado**: money received (card + Pix + other), and per invite.
   - **Pix a conferir**: guests who tapped "Já fiz o Pix". Check your bank app, then **Confirmar recebimento**.
5. **Presentes** tab: every gift with name and message. **Registrar presente** adds gifts given outside the site.
6. **Exportar CSV** for the venue, buffet or seating.

## Personalize

| What | Where |
|---|---|
| Names, date, venues, dress code, WhatsApp, RSVP deadline | `public/config.js` (venue names/addresses are still placeholders) |
| All texts in PT / EN / ES | `public/i18n.js` |
| Gifts: titles, descriptions (3 languages), prices | `data/gifts.json`; photo = `public/img/gifts/<id>.jpg` |
| Site photos | `public/img/site/*.jpg`. Replace `hero.jpg` with your own couple photo (landscape, ~2000px wide) |
| Colors and fonts | CSS variables at the top of `public/styles.css` |

Photos are free [Unsplash](https://unsplash.com/license) images stored in the repo, so the site doesn't depend on any external image service.

## Payments

- **Prices are computed on the server** from `data/gifts.json`, so nobody can change an amount in the browser.
- **Pix**: static BR Code with the exact total and a `PRESENTE…` reference. Static Pix has no automatic confirmation, so it shows as *Conferir no banco* until you confirm it.
- **Card**: Stripe Checkout in BRL, in the guest's language. Recorded automatically via the webhook (`/api/stripe/webhook`) and when the guest reaches the thank-you page.
- Every gift made from a personal link is attached to that invite.

### Stripe setup

1. Create an account at [stripe.com](https://stripe.com) (a Brazilian account settles in BRL to a Brazilian bank).
2. Developers → API keys → put the **secret key** in `STRIPE_SECRET_KEY` (`sk_test_…` to test with card `4242 4242 4242 4242`).
3. Developers → Webhooks → endpoint `https://<your-site>/api/stripe/webhook` with events `checkout.session.completed` and `checkout.session.async_payment_succeeded`; put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Optional: `STRIPE_ENABLE_PIX=true` (Pix inside Stripe) and `STRIPE_CARD_INSTALLMENTS=true` (parcelamento).

## Deploy (Render + Supabase, both free tiers)

Render's free web services don't keep files between deploys, so production data must live in Postgres:

1. **Supabase**: create a project → Project Settings → Database → copy the *Session pooler* connection string → `DATABASE_URL`. Tables are created automatically on first start.
2. **Render**: New → Blueprint → this repo (`render.yaml`), then fill `PUBLIC_URL`, `ADMIN_PASSWORD`, `DATABASE_URL`, `PIX_KEY` and the Stripe keys.

Requires Node 22.13+.
