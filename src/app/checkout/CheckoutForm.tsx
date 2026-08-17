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
import type { CryptoChain, CryptoCurrency } from "@/lib/orders/types";

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
  chain: CryptoChain;
  label: string;
  walletAddress: string;
};

type CryptoOrder = {
  orderId: string;
  currency: CryptoCurrency;
  chain: string;
  expectedAmount: number;
  walletAddress: string;
  bufferPercent: number;
  proofToken: string;
};

type BankOrder = {
  orderId: string;
  amountAud: number;
  proofToken: string;
  bank: BankDetails;
};

type BankDetails = {
  accountName: string;
  bsb: string;
  accountNumber: string;
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

export function CheckoutForm() {
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
  const [tab, setTab] = useState<PaymentTab>("card");
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
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
  const [cryptoChain, setCryptoChain] = useState<CryptoChain>("solana");
  const [cryptoOrder, setCryptoOrder] = useState<CryptoOrder | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [bankOrder, setBankOrder] = useState<BankOrder | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const checkoutStarted = Boolean(cryptoOrder || bankOrder);

  useEffect(() => {
    void fetch("/api/checkout/payment-options")
      .then(async (response) => {
        const payload = (await response.json()) as {
          options?: CryptoOption[];
          crypto?: CryptoOption[];
          bank?: BankDetails;
        };
        const options = payload.crypto ?? payload.options ?? [];
        setCryptoOptions(options);
        setBankDetails(payload.bank ?? null);
        if (options[0]) setCryptoChain(options[0].chain);
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
        body: JSON.stringify({ ...checkoutBody(), paymentMethod: "stripe" }),
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
        body: JSON.stringify({ ...checkoutBody(), chain: cryptoChain }),
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

  async function startBankPayment() {
    const validationError = validateDetails();
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/create-bank-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutBody()),
      });
      const payload = (await response.json()) as BankOrder & { error?: string };
      if (!response.ok || !payload.orderId || !payload.proofToken) {
        throw new Error(payload.error ?? "Unable to create bank order.");
      }
      setBankOrder(payload);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create bank order.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitPaymentProof() {
    const order = tab === "crypto" ? cryptoOrder : bankOrder;
    if (!order || !proofFile) {
      setError("Upload a screenshot of the successful transfer.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(proofFile.type)) {
      setError("Upload a PNG, JPEG, or WebP screenshot.");
      return;
    }
    if (proofFile.size > 8 * 1024 * 1024) {
      setError("Upload a screenshot under 8 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const uploadResponse = await fetch(
        "/api/checkout/payment-proof-upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.orderId,
            proofToken: order.proofToken,
            contentType: proofFile.type,
          }),
        },
      );
      const uploadPayload = (await uploadResponse.json()) as {
        uploadUrl?: string;
        error?: string;
      };
      if (!uploadResponse.ok || !uploadPayload.uploadUrl) {
        throw new Error(uploadPayload.error ?? "Unable to upload payment proof.");
      }
      const storageResponse = await fetch(uploadPayload.uploadUrl, {
        method: "POST",
        headers: { "Content-Type": proofFile.type },
        body: proofFile,
      });
      const storagePayload = (await storageResponse.json()) as {
        storageId?: string;
      };
      if (!storageResponse.ok || !storagePayload.storageId) {
        throw new Error("Unable to store payment proof.");
      }
      const verifyResponse = await fetch(
        "/api/checkout/verify-payment-proof",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.orderId,
            proofToken: order.proofToken,
            storageId: storagePayload.storageId,
          }),
        },
      );
      const verifyPayload = (await verifyResponse.json()) as {
        error?: string;
        message?: string;
        status?: string;
      };
      if (!verifyResponse.ok) {
        throw new Error(verifyPayload.error ?? "Unable to verify payment proof.");
      }
      setVerificationMessage(
        verifyPayload.message ?? "Payment proof received.",
      );
      window.setTimeout(() => {
        window.location.assign(
          `/checkout/success?orderId=${encodeURIComponent(order.orderId)}`,
        );
      }, 1400);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to verify payment proof.",
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
                method === "moonpay" ||
                (method === "bank" && !bankDetails) ||
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
                    ? "🔒 MoonPay — Coming soon"
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
                MoonPay is temporarily unavailable while its payment flow is
                validated.
              </p>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="mt-5 cursor-not-allowed rounded-sm border border-line bg-mist/40 px-5 py-3 text-sm text-muted"
              >
                <span aria-hidden="true">🔒</span> Coming soon
              </button>
            </div>
          ) : null}

          {tab === "card" ? (
            <div className="mt-5">
              <p className="text-sm leading-relaxed text-muted">
                Continue to Fresh&apos;n Up for secure Stripe card checkout in
                AUD. Payment confirmation returns here automatically.
              </p>
              <button
                type="button"
                onClick={() => void startFreshnupPayment()}
                disabled={busy || lines.length === 0}
                className="btn-primary mt-5 rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
              >
                {busy ? "Preparing…" : "Pay securely with Stripe"}
              </button>
            </div>
          ) : null}

          {tab === "crypto" ? (
            <div className="mt-5">
              {!cryptoOrder ? (
                <>
                  <label className="grid gap-1.5 text-sm text-muted">
                    USDC network
                    <select
                      value={cryptoChain}
                      onChange={(event) =>
                        setCryptoChain(event.target.value as CryptoChain)
                      }
                      className={inputClass}
                      disabled={cryptoOptions.length === 0}
                    >
                      {cryptoOptions.map((option) => (
                        <option key={option.chain} value={option.chain}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    USDC only. The live AUD conversion includes a 2% quote
                    buffer. Choose the exact network shown.
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
                      {cryptoOrder.expectedAmount} USDC
                    </strong>{" "}
                    on {cryptoOrder.chain}. Sending another token or network
                    can permanently lose funds.
                  </p>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">
                      Merchant wallet
                    </p>
                    <p className="mt-1 break-all border border-line bg-mist/30 p-3 font-mono text-xs text-ink">
                      {cryptoOrder.walletAddress}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard.writeText(
                          cryptoOrder.walletAddress,
                        )
                      }
                      className="mt-2 text-xs text-accent underline"
                    >
                      Copy address
                    </button>
                  </div>
                  <label className="grid gap-1.5 text-sm text-muted">
                    Successful transfer screenshot
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) =>
                        setProofFile(event.target.files?.[0] ?? null)
                      }
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void submitPaymentProof()}
                    disabled={busy || !proofFile}
                    className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
                  >
                    {busy ? "Verifying payment…" : "Upload and verify payment"}
                  </button>
                  <p className="text-xs leading-relaxed text-muted">
                    The screenshot is read for payment details, then the
                    transaction is independently confirmed on-chain. Only a
                    confirmed matching transfer completes the order.
                  </p>
                  {verificationMessage ? (
                    <p className="text-sm text-ink">{verificationMessage}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {tab === "bank" && bankDetails ? (
            <div className="mt-5 text-sm leading-relaxed text-muted">
              {!bankOrder ? (
                <>
                  <p>
                    Create the order to receive the transfer reference and
                    upload a successful-payment screenshot.
                  </p>
                  <button
                    type="button"
                    onClick={() => void startBankPayment()}
                    disabled={busy || lines.length === 0}
                    className="btn-primary mt-5 rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
                  >
                    {busy ? "Preparing…" : "Get bank transfer details"}
                  </button>
                </>
              ) : (
                <div className="grid gap-4">
                  <p>
                    Send exactly{" "}
                    <strong className="text-ink">
                      {formatPrice(bankOrder.amountAud)}
                    </strong>{" "}
                    and use order {bankOrder.orderId} as the reference.
                  </p>
                  <dl className="grid gap-2 border border-line bg-mist/30 p-4">
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Account name</dt>
                      <dd className="text-ink">{bankOrder.bank.accountName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">BSB</dt>
                      <dd className="font-mono text-ink">{bankOrder.bank.bsb}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Account number</dt>
                      <dd className="font-mono text-ink">
                        {bankOrder.bank.accountNumber}
                      </dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        `${bankOrder.bank.bsb} ${bankOrder.bank.accountNumber}`,
                      )
                    }
                    className="w-fit text-xs text-accent underline"
                  >
                    Copy bank details
                  </button>
                  <label className="grid gap-1.5">
                    Successful transfer screenshot
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) =>
                        setProofFile(event.target.files?.[0] ?? null)
                      }
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void submitPaymentProof()}
                    disabled={busy || !proofFile}
                    className="btn-primary rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
                  >
                    {busy ? "Checking receipt…" : "Upload payment receipt"}
                  </button>
                  <p className="text-xs">
                    Matching receipts are saved as pending review. Bank orders
                    are not auto-completed until settlement is confirmed.
                  </p>
                  {verificationMessage ? (
                    <p className="text-sm text-ink">{verificationMessage}</p>
                  ) : null}
                </div>
              )}
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
