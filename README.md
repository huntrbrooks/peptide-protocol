# The Protocol

Australian research peptide catalogue site. Production host: **[theprotocolau.com](https://www.theprotocolau.com)** (Vercel project `peptide-protocol`).

Research materials only. Not for human consumption. Not a medicine, supplement, or cosmetic. Laboratory and in vitro use only.

## Stack

- Next.js (App Router) on Vercel
- TypeScript
- Tailwind CSS v4
- Convex cloud (orders / payment status)

## Production deploy

Hosting is already on Vercel (`peptide-protocol` → `https://www.theprotocolau.com`). Checkout needs **Convex cloud** and the shared **Freshnup MoonPay bridge**. Stripe and direct crypto remain alternate rails.

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
| `PAYMENT_BRIDGE_SECRET` | Strong HMAC secret; same value on the Freshnup Vercel project |
| `FRESHNUP_PAYMENT_URL` | `https://www.freshnup.global/pay` |
| `STRIPE_SECRET_KEY` | Stripe test secret (or a least-privilege restricted key where supported) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/webhooks/stripe` |
| `RESEND_API_KEY` | Resend server-side API key; never expose with a `NEXT_PUBLIC_` prefix |
| `RESEND_FROM_EMAIL` | Sender address on a verified Resend domain |
| `ORDERS_NOTIFY_EMAIL` | Merchant operations recipient (or use `RESEND_TO_OPS`) |
| `SHIPPING_FROM_*` | Real merchant name and postal return-address fields used on labels |
| `CRYPTO_ETH_ADDRESS` | Ethereum settlement wallet |
| `CRYPTO_USDT_ADDRESS` / `CRYPTO_BTC_ADDRESS` | Optional; unset currencies are hidden |
| `ETH_RPC_URL` | Optional Ethereum mainnet RPC; enables automatic ETH/USDT checks |
| `CRYPTO_USDT_CONTRACT` | Optional override; defaults to Ethereum mainnet USDT |
| `NEXT_PUBLIC_BANK_TRANSFER_ENABLED` | Keep `false` until PayID/bank instructions are operational |
| `OPENROUTER_API_KEY` | Stack Finder (optional) |

Deploy:

```bash
vercel --prod
# or push to the linked git production branch
```

### 3. Stripe Dashboard (you must do)

1. In test mode, register `https://www.theprotocolau.com/api/webhooks/stripe`.
2. Subscribe to `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`, and `payment_intent.canceled`.
3. Put the endpoint signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Enable desired payment methods in Stripe Dashboard. The PaymentIntent intentionally omits `payment_method_types` so Stripe can show eligible dynamic methods.
5. Add `www.theprotocolau.com` under **Payment method domains** for Apple Pay in production. Repeat for any additional production checkout domain.
6. Test with Stripe test keys and test cards before switching Vercel to live keys.

**Processing risk:** Stripe may classify or decline peptide-category businesses during underwriting, just as MoonPay or another card processor may. Approval is not guaranteed. MoonPay KYB still applies to the merchant account and disclosed business; cross-domain routing is technical and does not change those obligations.

## Setup

```bash
npm install
cp .env.example .env.local
# Add OpenRouter + Stripe test keys to .env.local (never commit real keys)

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

This secret gates payment mutations so only the Next.js Stripe/crypto routes can attach processor details or mark orders paid/failed. Use the same value in Next.js and Convex.

## Content

- Live copy: `src/content/` (`products.ts`, `categories.ts`, `pages.ts`, `site.ts`)
- Human index: `CONTENT.md`
- Prices are AUD catalogue values. Cart persists to `localStorage` and feeds the Stripe/crypto checkout.

## Payments

`/checkout` uses Freshnup-hosted MoonPay as the primary payment path. Embedded Stripe and direct self-custody crypto remain alternate tabs, and WhatsApp remains a help link.

Orders persist in **Convex**. The success page subscribes with `useQuery`, so webhook and chain-verification updates appear live.

### Paid-order email notifications

Stripe, verified crypto, and the Freshnup payment bridge all call the same paid-order email service after Convex records the first `paid` transition. Convex atomically claims the notification and stores `confirmationEmailSentAt`, preventing duplicate sends from repeated webhooks.

The customer receives an HTML confirmation with order lines, AUD total, shipping address, payment method, and research disclaimer. A formal receipt PDF and a 100 × 150 mm printable postal label PDF are attached; `ORDERS_NOTIFY_EMAIL` receives a hidden copy with both attachments.

Before enabling production sends:

1. Add and verify the exact `RESEND_FROM_EMAIL` domain in the [Resend Domains dashboard](https://resend.com/domains), including its SPF and DKIM DNS records.
2. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ORDERS_NOTIFY_EMAIL` (or `RESEND_TO_OPS`), and every `SHIPPING_FROM_*` variable on Vercel Production.
3. Replace the example return address in `.env.example` with the real dispatch address in Vercel; the example values are not suitable for live labels.
4. Redeploy after changing Vercel environment variables.

### Freshnup MoonPay bridge

1. `POST /api/checkout/freshnup-session` validates products and prices against the server catalogue, creates a pending Convex order, and signs a 45-minute HMAC token containing the order ID, AUD cents, email, and item summary.
2. The browser opens `https://www.freshnup.global/pay`, where Freshnup verifies the token and builds the signed MoonPay URL server-side.
3. MoonPay redirects the customer to `https://www.theprotocolau.com/checkout/success?orderId=…`.
4. MoonPay calls Freshnup's verified webhook. Freshnup then calls `POST /api/webhooks/payment-bridge` with `PAYMENT_BRIDGE_SECRET`; The Protocol updates the Convex order through the separately secret-gated Convex mutation.

Set the same `PAYMENT_BRIDGE_SECRET` on both Vercel projects. Keep
`ORDERS_WEBHOOK_SECRET` on The Protocol and its Convex deployment only.

In MoonPay, whitelist both `freshnup.global` and `www.freshnup.global`, and register
`https://www.freshnup.global/api/webhooks/moonpay`.

### Card flow

1. `POST /api/checkout/create-payment-intent` validates the cart against server catalogue prices, creates a pending Convex order, then creates an AUD Stripe PaymentIntent.
2. Stripe Payment Element confirms the payment on `/checkout`; eligible Apple Pay / Google Pay methods are determined by Stripe, device, browser, and Dashboard configuration.
3. `POST /api/webhooks/stripe` verifies the Stripe signature and marks the matching order paid on `payment_intent.succeeded`.
4. The browser return page is informational; it never marks an order paid.

### Crypto flow

1. `POST /api/checkout/create-crypto-order` obtains a CoinGecko AUD quote and adds a 2% volatility buffer.
2. Checkout displays the exact amount and configured merchant wallet. Unset BTC/USDT addresses are hidden.
3. The customer sends from their own wallet and submits the TXID to `POST /api/checkout/verify-crypto`.
4. BTC is checked through Blockstream. ETH and Ethereum USDT are checked through `ETH_RPC_URL` when configured (12 confirmations). If a verifier is unavailable or the transaction is not fully confirmed, the order moves to `pending_verification` for staff review instead of being falsely marked paid.
5. A TXID can only be attached to one order.

The default ETH wallet in `.env.example` is `0x22ca069363df8cf72c1d900e001c218e1fb62025`. Confirm ownership and network before production. USDT support is Ethereum ERC-20; do not send TRC-20 USDT to this rail.

### Local notes

- Keep `npx convex dev` running while developing so schema/functions sync.
- Do **not** run `npx convex deploy` unless shipping to production.
- Stripe webhooks cannot hit `http://localhost:3000`. Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy the temporary `whsec_…` into `.env.local`.
- Bridge checklist: matching `PAYMENT_BRIDGE_SECRET` on both sites → Freshnup MoonPay sandbox keys set → `npx convex dev` linked → `ORDERS_WEBHOOK_SECRET` mirrored with `npx convex env set`.

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
