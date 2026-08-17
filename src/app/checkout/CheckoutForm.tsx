"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { formatPrice, getProductBySlug } from "@/content/products";
import { site } from "@/content/site";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  subscribeCart,
} from "@/lib/cart/storage";
import type { CartLine } from "@/lib/cart/types";
import { whatsappOrderUrl } from "@/lib/orders/whatsapp";
import type { CryptoCurrency } from "@/lib/orders/types";
import { StripePaymentForm } from "./StripePaymentForm";

type PaymentTab = "moonpay" | "crypto" | "card" | "bank";

type LineView = {
  slug: string;
  name: string;
  quantity: number;
  unitPriceAud: number;
  lineTotalAud: number;
};

type CryptoOption = {
  currency: CryptoCurrency;
  chain: "ethereum" | "bitcoin";
  label: string;
};

type CryptoOrder = {
  orderId: string;
  currency: CryptoCurrency;
  chain: string;
  expectedAmount: number;
  walletAddress: string;
  bufferPercent: number;
};

function buildLines(items: CartLine[]): LineView[] {
  return items.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    if (!product) return [];
    return [
      {
        slug: product.slug,
        name: product.name,
        quantity: item.quantity,
        unitPriceAud: product.priceAud,
        lineTotalAud:
          Math.round(product.priceAud * item.quantity * 100) / 100,
      },
    ];
  });
}

const inputClass =
  "w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

export function CheckoutForm({ bankEnabled }: { bankEnabled: boolean }) {
  const cart = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const lines = useMemo(() => buildLines(cart.items), [cart.items]);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotalAud, 0);
  const chatHref = whatsappOrderUrl(
    lines.map((line) => ({ name: line.name, quantity: line.quantity })),
  );
  const [tab, setTab] = useState<PaymentTab>("moonpay");
  const [details, setDetails] = useState({
    email: "",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postcode: "",
    country: "AU",
  });
  const [researchAck, setResearchAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardSession, setCardSession] = useState<{
    orderId: string;
    clientSecret: string;
  } | null>(null);
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
  const [currency, setCurrency] = useState<CryptoCurrency>("eth");
  const [cryptoOrder, setCryptoOrder] = useState<CryptoOrder | null>(null);
  const [txid, setTxid] = useState("");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const checkoutStarted = Boolean(cardSession || cryptoOrder);

  useEffect(() => {
    void fetch("/api/checkout/crypto-options")
      .then(async (response) => {
        const payload = (await response.json()) as {
          options?: CryptoOption[];
        };
        const options = payload.options ?? [];
        setCryptoOptions(options);
        if (options[0]) setCurrency(options[0].currency);
      })
      .catch(() => setCryptoOptions([]));
  }, []);

  function checkoutBody() {
    return {
      email: details.email,
      researchAck,
      shipping: {
        fullName: details.fullName,
        line1: details.line1,
        line2: details.line2 || undefined,
        city: details.city,
        state: details.state,
        postcode: details.postcode,
        country: details.country,
      },
      items: lines.map(({ slug, quantity }) => ({ slug, quantity })),
    };
  }

  function validateDetails(): string | null {
    if (lines.length === 0) return "Your cart is empty.";
    if (!details.email.includes("@")) return "Enter a valid email address.";
    if (
      !details.fullName ||
      !details.line1 ||
      !details.city ||
      !details.state ||
      !details.postcode
    ) {
      return "Complete all required shipping fields.";
    }
    if (!researchAck) return "Accept the research-use acknowledgement.";
    return null;
  }

  async function startFreshnupPayment() {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/freshnup-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutBody()),
      });
      const payload = (await response.json()) as {
        payUrl?: string;
        error?: string;
      };
      if (!response.ok || !payload.payUrl) {
        throw new Error(payload.error ?? "Unable to start secure payment.");
      }
      window.location.assign(payload.payUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start secure payment.",
      );
      setBusy(false);
    }
  }

  async function startCardPayment() {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutBody()),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        orderId?: string;
        clientSecret?: string;
        error?: string;
      };
      if (!response.ok || !payload.orderId || !payload.clientSecret) {
        throw new Error(payload.error ?? "Unable to start card payment.");
      }
      setCardSession({
        orderId: payload.orderId,
        clientSecret: payload.clientSecret,
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to start card payment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function startCryptoPayment() {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/create-crypto-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...checkoutBody(), currency }),
      });
      const payload = (await response.json()) as CryptoOrder & {
        error?: string;
      };
      if (!response.ok || !payload.orderId) {
        throw new Error(payload.error ?? "Unable to create crypto order.");
      }
      setCryptoOrder(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create crypto order.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitTxid() {
    if (!cryptoOrder || !txid.trim()) {
      setError("Enter the transaction ID after sending payment.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/verify-crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: cryptoOrder.orderId,
          txid: txid.trim(),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit transaction.");
      }
      setVerificationMessage(
        payload.message ?? "Transaction submitted for verification.",
      );
      window.setTimeout(() => {
        window.location.assign(
          `/checkout/success?orderId=${encodeURIComponent(cryptoOrder.orderId)}`,
        );
      }, 1200);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to submit transaction.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-6">
        <section className="border border-line bg-paper p-6">
          <h2 className="font-display text-2xl text-ink">Contact and shipping</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-muted sm:col-span-2">
              Email
              <input
                type="email"
                autoComplete="email"
                value={details.email}
                onChange={(event) =>
                  setDetails({ ...details, email: event.target.value })
                }
                className={inputClass}
                required
                disabled={checkoutStarted}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted sm:col-span-2">
              Full name
              <input
                autoComplete="name"
                value={details.fullName}
                onChange={(event) =>
                  setDetails({ ...details, fullName: event.target.value })
                }
                className={inputClass}
                required
                disabled={checkoutStarted}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted sm:col-span-2">
              Address
              <input
                autoComplete="address-line1"
                value={details.line1}
                onChange={(event) =>
                  setDetails({ ...details, line1: event.target.value })
                }
                className={inputClass}
                required
                disabled={checkoutStarted}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted sm:col-span-2">
              Address line 2 (optional)
              <input
                autoComplete="address-line2"
                value={details.line2}
                onChange={(event) =>
                  setDetails({ ...details, line2: event.target.value })
                }
                className={inputClass}
                disabled={checkoutStarted}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              Suburb / city
              <input
                autoComplete="address-level2"
                value={details.city}
                onChange={(event) =>
                  setDetails({ ...details, city: event.target.value })
                }
                className={inputClass}
                required
                disabled={checkoutStarted}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              State
              <input
                autoComplete="address-level1"
                value={details.state}
                onChange={(event) =>
                  setDetails({ ...details, state: event.target.value })
                }
                className={inputClass}
                required
                disabled={checkoutStarted}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              Postcode
              <input
                autoComplete="postal-code"
                value={details.postcode}
                onChange={(event) =>
                  setDetails({ ...details, postcode: event.target.value })
                }
                className={inputClass}
                required
                disabled={checkoutStarted}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              Country
              <input
                autoComplete="country"
                value={details.country}
                onChange={(event) =>
                  setDetails({ ...details, country: event.target.value })
                }
                className={inputClass}
                required
                disabled={checkoutStarted}
              />
            </label>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-muted">
            <input
              type="checkbox"
              checked={researchAck}
              onChange={(event) => setResearchAck(event.target.checked)}
              className="mt-1"
              disabled={checkoutStarted}
            />
            <span>
              I confirm this order is for laboratory and in vitro research only,
              and accept the research-use terms.
            </span>
          </label>
        </section>

        <section className="border border-line bg-paper p-6">
          <h2 className="font-display text-2xl text-ink">Payment</h2>
          <div className="mt-5 grid grid-cols-2 border border-line text-sm sm:grid-cols-4">
            {(["moonpay", "crypto", "card", "bank"] as const).map((method) => {
              const disabled =
                (method === "bank" && !bankEnabled) ||
                (checkoutStarted && tab !== method);
              return (
                <button
                  key={method}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setTab(method);
                    setError(null);
                  }}
                  className={`px-3 py-3 capitalize transition ${
                    tab === method
                      ? "bg-ink text-paper"
                      : "bg-paper text-muted hover:text-ink"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {method === "moonpay"
                    ? "Secure pay"
                    : method === "card"
                      ? "Stripe"
                      : method}
                </button>
              );
            })}
          </div>

          {tab === "moonpay" ? (
            <div className="mt-5">
              <p className="text-sm leading-relaxed text-muted">
                Continue to Fresh&apos;n Up for secure MoonPay checkout. Your
                order total remains in AUD and payment confirmation returns
                here automatically.
              </p>
              <button
                type="button"
                onClick={() => void startFreshnupPayment()}
                disabled={busy || lines.length === 0}
                className="btn-primary mt-5 rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
              >
                {busy ? "Preparing…" : "Pay securely"}
              </button>
            </div>
          ) : null}

          {tab === "card" ? (
            cardSession ? (
              <StripePaymentForm {...cardSession} />
            ) : (
              <div className="mt-5">
                <p className="text-sm leading-relaxed text-muted">
                  Alternate card checkout in AUD through Stripe.
                </p>
                <button
                  type="button"
                  onClick={() => void startCardPayment()}
                  disabled={busy || lines.length === 0}
                  className="btn-primary mt-5 rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
                >
                  {busy ? "Preparing…" : "Continue to secure payment"}
                </button>
              </div>
            )
          ) : null}

          {tab === "crypto" ? (
            <div className="mt-5">
              {!cryptoOrder ? (
                <>
                  <label className="grid gap-1.5 text-sm text-muted">
                    Cryptocurrency
                    <select
                      value={currency}
                      onChange={(event) =>
                        setCurrency(event.target.value as CryptoCurrency)
                      }
                      className={inputClass}
                      disabled={cryptoOptions.length === 0}
                    >
                      {cryptoOptions.map((option) => (
                        <option key={option.currency} value={option.currency}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    The live AUD quote includes a 2% volatility buffer. Only
                    configured merchant wallets are shown.
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCryptoPayment()}
                    disabled={busy || cryptoOptions.length === 0}
                    className="btn-primary mt-5 rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
                  >
                    {busy ? "Getting quote…" : "Get payment details"}
                  </button>
                  {cryptoOptions.length === 0 ? (
                    <p className="mt-3 text-sm text-red-700">
                      Crypto checkout is not configured.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="grid gap-4 text-sm">
                  <p className="text-muted">
                    Send exactly{" "}
                    <strong className="text-ink">
                      {cryptoOrder.expectedAmount}{" "}
                      {cryptoOrder.currency.toUpperCase()}
                    </strong>{" "}
                    on {cryptoOrder.chain}.
                  </p>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">
                      Merchant wallet
                    </p>
                    <p className="mt-1 break-all border border-line bg-mist/30 p-3 font-mono text-xs text-ink">
                      {cryptoOrder.walletAddress}
                    </p>
                  </div>
                  <label className="grid gap-1.5 text-sm text-muted">
                    Transaction ID (TXID)
                    <input
                      value={txid}
                      onChange={(event) => setTxid(event.target.value)}
                      className={inputClass}
                      placeholder="Paste after sending"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void submitTxid()}
                    disabled={busy}
                    className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
                  >
                    {busy ? "Checking transaction…" : "Submit transaction"}
                  </button>
                  <p className="text-xs leading-relaxed text-muted">
                    Verification usually confirms in minutes. If automatic chain
                    verification is unavailable, the order remains pending for
                    staff review.
                  </p>
                  {verificationMessage ? (
                    <p className="text-sm text-ink">{verificationMessage}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {tab === "bank" && bankEnabled ? (
            <div className="mt-5 text-sm leading-relaxed text-muted">
              PayID/bank transfer is in assisted rollout. Contact support for
              bank details and include your order contents.
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <p className="text-sm text-muted">
          Need help ordering?{" "}
          <a
            href={chatHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            Chat with us on WhatsApp
          </a>
          , or email{" "}
          <a href={`mailto:${site.email}`} className="text-accent underline">
            {site.email}
          </a>
          .
        </p>
      </div>

      <aside className="h-fit border border-line bg-paper p-6">
        <h2 className="font-display text-2xl text-ink">Order summary</h2>
        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Cart is empty.{" "}
            <Link href="/shop" className="text-accent underline">
              Browse the catalogue
            </Link>{" "}
            first.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {lines.map((line) => (
              <li
                key={line.slug}
                className="flex items-start justify-between gap-4 border-b border-line/70 pb-3"
              >
                <span>
                  {line.name}
                  <span className="block text-xs">Qty {line.quantity}</span>
                </span>
                <span className="shrink-0 text-ink">
                  {formatPrice(line.lineTotalAud)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-between text-sm text-ink">
          <span>Subtotal (AUD)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {site.researchDisclaimer}
        </p>
      </aside>
    </div>
  );
}
