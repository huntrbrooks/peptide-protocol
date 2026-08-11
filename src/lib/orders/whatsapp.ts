/**
 * Temporary WhatsApp ordering path while MoonPay checkout is staged.
 * Reverse: restore CheckoutForm MoonPay UI and FAQ copy; leave this module unused.
 */

export const WHATSAPP_ORDER = {
  /** E.164 digits only (AU mobile 0475… → 61475…) */
  e164Digits: "61475614574",
  displayNumber: "+61 475 614 574",
  businessName: "The Protocol",
  qrImageSrc: "/images/brand/whatsapp-order-qr.png",
} as const;

export type WhatsAppOrderLine = {
  name: string;
  quantity: number;
};

/** Base chat URL without a prefilled message. */
export function whatsappChatUrl(): string {
  return `https://wa.me/${WHATSAPP_ORDER.e164Digits}`;
}

/** Build a wa.me URL with an optional prefilled cart message. */
export function whatsappOrderUrl(lines: WhatsAppOrderLine[]): string {
  const text = buildWhatsAppOrderMessage(lines);
  return `${whatsappChatUrl()}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppOrderMessage(lines: WhatsAppOrderLine[]): string {
  const header = [
    `Hi ${WHATSAPP_ORDER.businessName} — I'd like to place a research materials order.`,
    "",
  ];

  if (lines.length === 0) {
    return [
      ...header,
      "I don't have items in my cart yet — happy to discuss the catalogue.",
      "",
      "Research use only; not for human consumption.",
    ].join("\n");
  }

  const itemLines = lines.map(
    (line) => `• ${line.name} × ${line.quantity}`,
  );

  return [
    ...header,
    "Items:",
    ...itemLines,
    "",
    "Please confirm availability, total (AUD), and shipping next steps.",
    "",
    "Research use only; not for human consumption.",
  ].join("\n");
}
