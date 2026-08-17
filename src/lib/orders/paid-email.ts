import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { claimPaidEmail, completePaidEmail } from "./convex";
import {
  createReceiptPdf,
  createShippingLabelPdf,
  type ShippingFromAddress,
} from "./order-documents";
import type { PaymentMethod } from "./types";

type PaidEmailResult = {
  sent: boolean;
  skipped: boolean;
};

const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for paid-order email notifications`);
  }
  return value;
}

function getShippingFromAddress(): ShippingFromAddress {
  return {
    name: requireEnv("SHIPPING_FROM_NAME"),
    line1: requireEnv("SHIPPING_FROM_LINE1"),
    city: requireEnv("SHIPPING_FROM_CITY"),
    state: requireEnv("SHIPPING_FROM_STATE"),
    postcode: requireEnv("SHIPPING_FROM_POSTCODE"),
    country: requireEnv("SHIPPING_FROM_COUNTRY"),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paymentMethodLabel(method: PaymentMethod | null): string {
  switch (method) {
    case "stripe":
      return "Card (Stripe)";
    case "moonpay":
      return "MoonPay";
    case "crypto":
      return "Cryptocurrency";
    case "bank":
      return "Bank transfer";
    case "whatsapp":
      return "Manual order";
    default:
      return "Not recorded";
  }
}

function formatAddressLines(shipping: {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}): string[] {
  return [
    shipping.fullName,
    shipping.line1,
    ...(shipping.line2 ? [shipping.line2] : []),
    `${shipping.city} ${shipping.state} ${shipping.postcode}`,
    shipping.country,
  ];
}

function fromHeader(email: string): string {
  return email.includes("<") ? email : `The Protocol <${email}>`;
}

export async function sendOrderPaidEmails(
  orderId: string,
): Promise<PaidEmailResult> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const operationsEmail =
    process.env.ORDERS_NOTIFY_EMAIL?.trim() ||
    requireEnv("RESEND_TO_OPS");
  const shippingFrom = getShippingFromAddress();
  const claimToken = randomUUID();
  const order = await claimPaidEmail({ orderId, claimToken });
  if (!order) {
    return { sent: false, skipped: true };
  }

  let acceptedByResend = false;
  try {
    const normalizedOrder = {
      id: String(order._id),
      shipping: order.shipping,
      lines: order.lines,
      subtotalAud: order.subtotalAud,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
    };
    const [receiptPdf, shippingLabelPdf] = await Promise.all([
      createReceiptPdf(normalizedOrder),
      createShippingLabelPdf(normalizedOrder, shippingFrom),
    ]);
    const paidDate = new Date(order.paidAt).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Australia/Sydney",
    });
    const addressLines = formatAddressLines(order.shipping);
    const itemRows = order.lines
      .map(
        (line) => `
          <tr>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb">${escapeHtml(line.name)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${line.quantity}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${AUD.format(line.lineTotalAud)}</td>
          </tr>`,
      )
      .join("");
    const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Order confirmation</title></head>
  <body style="margin:0;background:#f5f5f3;color:#171717;font-family:Arial,sans-serif">
    <div style="max-width:680px;margin:0 auto;padding:32px 18px">
      <div style="background:#ffffff;border:1px solid #deded8;padding:32px">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:1.5px">THE PROTOCOL</p>
        <h1 style="margin:0 0 24px;font-size:28px">Payment confirmed</h1>
        <p>Thank you. Your order has been paid and is being prepared for dispatch.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(String(order._id))}<br>
        <strong>Paid:</strong> ${escapeHtml(paidDate)}<br>
        <strong>Payment method:</strong> ${escapeHtml(paymentMethodLabel(order.paymentMethod))}</p>
        <h2 style="margin-top:30px;font-size:18px">Order details</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="padding:8px;text-align:left;border-bottom:2px solid #171717">Item</th>
              <th style="padding:8px;text-align:center;border-bottom:2px solid #171717">Qty</th>
              <th style="padding:8px;text-align:right;border-bottom:2px solid #171717">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:14px 8px;text-align:right"><strong>Total paid (AUD)</strong></td>
              <td style="padding:14px 8px;text-align:right"><strong>${AUD.format(order.subtotalAud)}</strong></td>
            </tr>
          </tfoot>
        </table>
        <h2 style="margin-top:30px;font-size:18px">Shipping address</h2>
        <p>${addressLines.map(escapeHtml).join("<br>")}</p>
        <p style="margin-top:30px;font-size:13px;color:#555">Your formal receipt and printable postal label are attached as PDF files.</p>
        <p style="font-size:12px;color:#666">Research materials only. Not for human consumption.</p>
      </div>
    </div>
  </body>
</html>`;
    const text = [
      "THE PROTOCOL — PAYMENT CONFIRMED",
      "",
      `Order ID: ${order._id}`,
      `Paid: ${paidDate}`,
      `Payment method: ${paymentMethodLabel(order.paymentMethod)}`,
      "",
      "ORDER DETAILS",
      ...order.lines.map(
        (line) =>
          `${line.quantity} × ${line.name} — ${AUD.format(line.lineTotalAud)}`,
      ),
      `Total paid (AUD): ${AUD.format(order.subtotalAud)}`,
      "",
      "SHIPPING ADDRESS",
      ...addressLines,
      "",
      "Your receipt and printable postal label are attached as PDF files.",
      "Research materials only. Not for human consumption.",
    ].join("\n");

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from: fromHeader(fromEmail),
        to: [order.email],
        ...(operationsEmail.toLowerCase() !== order.email.toLowerCase()
          ? { bcc: [operationsEmail] }
          : {}),
        subject: `Payment confirmed — order ${order._id}`,
        html,
        text,
        attachments: [
          {
            filename: `the-protocol-receipt-${order._id}.pdf`,
            content: Buffer.from(receiptPdf),
          },
          {
            filename: `shipping-label-${order._id}.pdf`,
            content: Buffer.from(shippingLabelPdf),
          },
        ],
        tags: [
          { name: "email_type", value: "order_paid" },
          { name: "order_id", value: String(order._id) },
        ],
      },
      { idempotencyKey: `order-paid/${order._id}` },
    );
    if (error) {
      throw new Error(`Resend rejected the paid-order email: ${error.message}`);
    }
    if (!data?.id) {
      throw new Error("Resend accepted no email ID");
    }
    acceptedByResend = true;
    await completePaidEmail({
      orderId: String(order._id),
      claimToken,
      sent: true,
    });
    return { sent: true, skipped: false };
  } catch (error) {
    if (!acceptedByResend) {
      await completePaidEmail({ orderId, claimToken, sent: false });
    }
    throw error;
  }
}
