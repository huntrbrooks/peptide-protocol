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
| `PAYMENT_ETHEREUM_USDC_ADDRESS` / `PAYMENT_SOLANA_USDC_ADDRESS` | Merchant USDC receive addresses; server-only |
| `ETH_RPC_URL` / `SOLANA_RPC_URL` | Mainnet RPCs required for automatic USDC confirmation |
| `ETHEREUM_USDC_CONTRACT` / `SOLANA_USDC_MINT` | Optional mainnet USDC identifier overrides |
| `BANK_ACCOUNT_NAME` / `BANK_BSB` / `BANK_ACCOUNT_NUMBER` | Bank transfer destination; server-only |
| `OPENROUTER_API_KEY` | Required for payment screenshot verification |
| `OPENROUTER_VISION_MODEL` | Optional; defaults to `anthropic/claude-sonnet-5` |

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

`/checkout` sends Stripe card checkout through the Freshnup hosted payment bridge. Direct USDC and bank transfer use persisted screenshot proof; MoonPay remains visible but disabled as **Coming soon**.

Orders persist in **Convex**. The success page subscribes with `useQuery`, so webhook and chain-verification updates appear live.

### Paid-order email notifications

Stripe, verified crypto, and the Freshnup payment bridge all call the same paid-order email service after Convex records the first `paid` transition. Convex atomically claims the notification and stores `confirmationEmailSentAt`, preventing duplicate sends from repeated webhooks.

The customer receives an HTML confirmation with order lines, AUD total, shipping address, payment method, and research disclaimer. A formal receipt PDF and a 100 × 150 mm printable postal label PDF are attached; `ORDERS_NOTIFY_EMAIL` receives a hidden copy with both attachments.

Before enabling production sends:

1. Add and verify the exact `RESEND_FROM_EMAIL` domain in the [Resend Domains dashboard](https://resend.com/domains), including its SPF and DKIM DNS records.
2. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ORDERS_NOTIFY_EMAIL` (or `RESEND_TO_OPS`), and every `SHIPPING_FROM_*` variable on Vercel Production.
3. Replace the example return address in `.env.example` with the real dispatch address in Vercel; the example values are not suitable for live labels.
4. Redeploy after changing Vercel environment variables.

### Freshnup payment bridge

1. `POST /api/checkout/freshnup-session` validates products and prices against the server catalogue, creates a pending Convex order, and signs a 45-minute HMAC token containing the order ID, AUD cents, email, and item summary.
2. The browser opens `https://www.freshnup.global/pay?paymentMethod=stripe`, where Freshnup verifies the token and starts hosted Stripe checkout with its existing `STRIPE_*` environment.
3. Freshnup returns the customer to `https://www.theprotocolau.com/checkout/success?orderId=…`.
4. Freshnup calls `POST /api/webhooks/payment-bridge` with `PAYMENT_BRIDGE_SECRET`, `paymentMethod: "stripe"`, and the verified processor result. The Protocol updates the Convex order through the separately secret-gated mutation.

Set the same `PAYMENT_BRIDGE_SECRET` on both Vercel projects. Keep
`ORDERS_WEBHOOK_SECRET` on The Protocol and its Convex deployment only.

In MoonPay, whitelist both `freshnup.global` and `www.freshnup.global`, and register
`https://www.freshnup.global/api/webhooks/moonpay`.

### Card flow

1. `POST /api/checkout/freshnup-session` validates the cart, creates a pending Stripe order, and signs the method, order, amount, email, and line summary.
2. Freshnup verifies the token and creates the hosted Stripe checkout using its configured Stripe account.
3. Only a verified bridge callback marks the matching order paid. The browser return page is informational and never marks an order paid.

### Crypto flow

1. `POST /api/checkout/create-crypto-order` obtains a USDC/AUD CoinGecko quote and adds a 2% quote buffer.
2. Checkout displays the exact USDC amount, selected network, and merchant receive address.
3. The customer uploads a PNG/JPEG/WebP receipt directly to Convex storage using an order-bound HMAC proof token.
4. OpenRouter vision extracts the amount, token, destination, transaction hash, reference, timestamp, and receipt plausibility.
5. Ethereum ERC-20 logs or finalized Solana token balances independently verify destination and amount. Only confirmed matching crypto is marked paid; unavailable/unconfirmed checks remain `pending_review`.
6. A transaction hash can only be attached to one order. Bank receipts use the same upload and AI extraction path but always remain `pending_review` because settlement cannot be proven publicly.

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
