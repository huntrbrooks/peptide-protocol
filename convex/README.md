# Convex backend (orders)

Freshnup/MoonPay, Stripe, and direct-crypto checkout orders live here. Run `npx convex dev` from the `peptide/` directory to link a development deployment and regenerate `_generated/`.

Set `ORDERS_WEBHOOK_SECRET` in Convex to the same value used by The Protocol
Next.js app. `PAYMENT_BRIDGE_SECRET` is only shared between The Protocol and
Freshnup and does not need to be stored in Convex.

Do not run `npx convex deploy` unless shipping to production.
