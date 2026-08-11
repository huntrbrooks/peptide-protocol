# The Protocol

Australian research peptide catalogue site. Production host: **[theprotocolau.com](https://www.theprotocolau.com)** (Vercel project `peptide-protocol`). Content still references `peptideprotocolau.io` in places during brand transition.

Research materials only. Not for human consumption. Not a medicine, supplement, or cosmetic. Laboratory and in vitro use only.

## Stack

- Next.js (App Router) on Vercel
- TypeScript
- Tailwind CSS v4
- Convex cloud (orders / payment status)

## Production deploy

Hosting is already on Vercel (`peptide-protocol` → `https://www.theprotocolau.com`). Checkout needs **Convex cloud** + MoonPay. Until MoonPay **live** keys exist, keep `MOONPAY_ENVIRONMENT=sandbox` (test keys only — not real-money settlement).

### 1. Convex cloud (required for orders)

Local `.env.local` may still use anonymous Convex (`http://127.0.0.1:3210`). Production must use a cloud deployment:

```bash
# Interactive — complete browser/device login
npx convex login

# Create/link a cloud project (not anonymous), then deploy production:
npx convex deploy

# Set the same ORDERS_WEBHOOK_SECRET on the Convex **production** deployment
# that is set on Vercel Production (generate a strong secret once):
npx convex env set ORDERS_WEBHOOK_SECRET '<same-as-vercel-production>'

# Copy cloud URLs into Vercel Production (and Preview if used):
#   NEXT_PUBLIC_CONVEX_URL=https://….convex.cloud
#   CONVEX_DEPLOYMENT=prod:…   # optional for local tooling
```

Then redeploy Vercel so the Next.js build picks up `NEXT_PUBLIC_CONVEX_URL`.

### 2. Vercel env (Production)

Set on the `peptide-protocol` project (CLI: `vercel env add … production`):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.theprotocolau.com` |
| `NEXT_PUBLIC_CONVEX_URL` | From Convex cloud after deploy |
| `ORDERS_WEBHOOK_SECRET` | Same value as `npx convex env set` |
| `MOONPAY_API_KEY` / `MOONPAY_SECRET_KEY` / `MOONPAY_WEBHOOK_SECRET` | `pk_test_` / `sk_test_` / `wk_test_` until live keys |
| `MOONPAY_WALLET_ADDRESS` | Settlement wallet (e.g. `0x22ca…`) |
| `MOONPAY_DEFAULT_CURRENCY` | `usdc` |
| `MOONPAY_ENVIRONMENT` | `sandbox` until live keys + business verification |
| `OPENROUTER_API_KEY` | Stack Finder (optional) |

Deploy:

```bash
vercel --prod
# or push to the linked git production branch
```

### 3. MoonPay dashboard (you must do)

1. Register webhook: `https://www.theprotocolau.com/api/webhooks/moonpay`
2. For **real money**: complete business verification, switch to `pk_live_` / `sk_live_` / `wk_live_`, set `MOONPAY_ENVIRONMENT=production` on Vercel, re-register production webhook if needed.
3. Enable Apple Pay / Google Pay for production in MoonPay (region/account dependent).

Do **not** claim FAQ checkout is fully live until live MoonPay keys are configured.

## Setup

```bash
npm install
cp .env.example .env.local
# Add OpenRouter + MoonPay keys to .env.local (never commit them)

# Link Convex (creates CONVEX_DEPLOYMENT + NEXT_PUBLIC_CONVEX_URL in .env.local)
npx convex dev

# In another terminal (or keep convex dev running)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Convex webhook secret

After `npx convex dev` is linked, set the same secret in both places:

```bash
# Generate once, then:
# 1. Add ORDERS_WEBHOOK_SECRET=... to .env.local
# 2. Mirror into the Convex deployment:
npx convex env set ORDERS_WEBHOOK_SECRET '<same-value-as-.env.local>'
```

This secret gates `orders.updateStatusFromWebhook` so only the Next.js MoonPay webhook route can mark orders paid/failed.

## Content

- Live copy: `src/content/` (`products.ts`, `categories.ts`, `pages.ts`, `site.ts`)
- Human index: `CONTENT.md`
- Prices are AUD catalogue placeholders. Cart persists to `localStorage` and feeds the staged MoonPay checkout.

## MoonPay checkout (staged)

Apple Pay / Google Pay (and other MoonPay methods) buy crypto on the hosted on-ramp widget; crypto settles to `MOONPAY_WALLET_ADDRESS`. **The MoonPay webhook is the source of truth for “paid”** — do not trust the browser return URL alone.

Orders persist in **Convex**. The success page subscribes with `useQuery` so status updates live when the webhook marks an order paid.

### Account setup

1. Create a MoonPay account and open the [dashboard](https://dashboard.moonpay.com/).
2. Copy publishable (`MOONPAY_API_KEY`) and secret (`MOONPAY_SECRET_KEY`) keys for sandbox, then live when ready.
3. Set `MOONPAY_WALLET_ADDRESS` to the merchant wallet that should receive settlement crypto. Confirm the chain matches `MOONPAY_DEFAULT_CURRENCY` (default `usdc`).
4. Set `MOONPAY_ENVIRONMENT` to `sandbox` or `production`.
5. Set `NEXT_PUBLIC_SITE_URL` to your public origin (e.g. `https://peptideprotocolau.io`).
6. Register the webhook URL in MoonPay Developers settings:
   - `{NEXT_PUBLIC_SITE_URL}/api/webhooks/moonpay`
7. Copy the webhook signing key into `MOONPAY_WEBHOOK_SECRET`.
8. Enable Apple Pay / Google Pay in the MoonPay dashboard where available for your account and regions (availability is MoonPay-controlled; AUD base currency is passed as `baseCurrencyCode=aud`).
9. Complete Convex setup above (`npx convex dev` + `ORDERS_WEBHOOK_SECRET`).

### Env vars

See `.env.example`:

- Convex: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `ORDERS_WEBHOOK_SECRET` (also set via `npx convex env set`)
- MoonPay: `MOONPAY_API_KEY`, `MOONPAY_SECRET_KEY`, `MOONPAY_WEBHOOK_SECRET`, `MOONPAY_WALLET_ADDRESS`, `MOONPAY_DEFAULT_CURRENCY`, `MOONPAY_ENVIRONMENT`, `NEXT_PUBLIC_SITE_URL`

### Flow

1. `/checkout` → `POST /api/checkout/session` creates a pending Convex order and returns a signed MoonPay URL (`externalTransactionId` = Convex order id).
2. Customer pays on MoonPay; browser returns to `/checkout/success?orderId=…`.
3. MoonPay calls `POST /api/webhooks/moonpay` (signature verified) → Convex `orders.updateStatusFromWebhook` marks paid/failed.
4. Success page updates reactively via `useQuery(api.orders.get)`.

### Local notes

- Keep `npx convex dev` running while developing so schema/functions sync.
- Do **not** run `npx convex deploy` unless shipping to production.
- FAQ still describes checkout as staged until credentials and wallet are live.
- MoonPay webhooks cannot hit `http://localhost:3000`. For local paid-status testing, expose the app with a tunnel (e.g. [ngrok](https://ngrok.com/) or Cloudflare Tunnel) and register `{tunnel-origin}/api/webhooks/moonpay` in the MoonPay dashboard (sandbox). Keep `NEXT_PUBLIC_SITE_URL` as the tunnel origin while testing redirects + webhooks.
- Checklist before a sandbox checkout works: MoonPay keys in `.env.local` → `MOONPAY_WALLET_ADDRESS` set → `npx convex dev` linked → `ORDERS_WEBHOOK_SECRET` mirrored with `npx convex env set` → webhook URL reachable from the internet.

## Image generation

Assets are generated with OpenRouter model `openai/gpt-image-2`:

```bash
npm run generate:images
```

Options:

```bash
node --env-file=.env.local scripts/generate-images.mjs --only=hero
node --env-file=.env.local scripts/generate-images.mjs --only=products --force
```

Images write to `public/images/`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local Next.js development |
| `npx convex dev` | Sync Convex schema/functions + fill Convex env |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run generate:images` | OpenRouter image generation |

## Compliance

Every product page and the site footer include the research-use disclaimer. See `/disclaimer` for the full statement.
