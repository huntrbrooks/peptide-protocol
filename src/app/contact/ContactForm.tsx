"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { site } from "@/content/site";

export function ContactForm() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <MailtoFallback />;
  }
  return <ContactFormLive />;
}

function MailtoFallback() {
  return (
    <div className="border border-line bg-paper p-6">
      <p className="text-sm text-muted">
        Email{" "}
        <a href={`mailto:${site.email}`} className="text-accent underline">
          {site.email}
        </a>
        . For COA requests, include the product name and order number.
      </p>
    </div>
  );
}

function ContactFormLive() {
  const submit = useMutation(api.contact.submit);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submit({ name, email, message });
      setSent(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to send your message. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-line bg-paper p-6" role="status">
        <h2 className="font-display text-xl text-ink">Message sent</h2>
        <p className="mt-2 text-sm text-muted">
          Thanks — we aim to reply within one business day. Batch file
          retrieval may take a little longer.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="grid gap-4 border border-line bg-paper p-6"
    >
      <label className="grid gap-2 text-sm">
        <span className="text-ink">Name</span>
        <input
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-ink">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-ink">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={4000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
          placeholder="Include order number or product name if relevant."
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="btn-primary justify-self-start rounded-sm bg-ink px-5 py-3 text-sm text-paper hover:bg-accent disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-muted">
        Sent straight to our support team. Prefer email? Write to{" "}
        <a href={`mailto:${site.email}`} className="text-accent underline">
          {site.email}
        </a>
        . For COA requests, include the product name and order number.
      </p>
    </form>
  );
}
