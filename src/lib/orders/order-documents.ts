import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { OrderLine, OrderShipping, PaymentMethod } from "./types";

export type ShippingFromAddress = {
  name: string;
  line1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

export type PaidOrderDocument = {
  id: string;
  shipping: OrderShipping;
  lines: OrderLine[];
  subtotalAud: number;
  paymentMethod: PaymentMethod | null;
  paidAt: number;
};

const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

function safePdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
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

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
): void {
  page.drawText(safePdfText(text), {
    x,
    y,
    size,
    font,
    color: rgb(0.08, 0.08, 0.08),
  });
}

function addressLines(address: OrderShipping): string[] {
  return [
    address.fullName,
    address.line1,
    ...(address.line2 ? [address.line2] : []),
    `${address.city} ${address.state} ${address.postcode}`,
    address.country,
  ];
}

export async function createReceiptPdf(
  order: PaidOrderDocument,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const margin = 52;
  let y = 782;

  drawText(page, bold, "THE PROTOCOL", margin, y, 22);
  drawText(page, bold, "PAYMENT RECEIPT", 390, y, 14);
  y -= 42;

  drawText(page, regular, `Order: ${order.id}`, margin, y, 10);
  drawText(
    page,
    regular,
    `Paid: ${new Date(order.paidAt).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Australia/Sydney",
    })}`,
    margin,
    y - 17,
    10,
  );
  drawText(
    page,
    regular,
    `Payment method: ${paymentMethodLabel(order.paymentMethod)}`,
    margin,
    y - 34,
    10,
  );

  drawText(page, bold, "RECEIPT TO", 350, y, 10);
  addressLines(order.shipping).forEach((line, index) => {
    drawText(page, regular, line, 350, y - 17 - index * 15, 9);
  });

  y -= 130;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 543, y },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 24;
  drawText(page, bold, "ITEM", margin, y, 10);
  drawText(page, bold, "QTY", 390, y, 10);
  drawText(page, bold, "AMOUNT", 462, y, 10);
  y -= 17;

  for (const line of order.lines) {
    drawText(page, regular, line.name.slice(0, 55), margin, y, 10);
    drawText(page, regular, String(line.quantity), 396, y, 10);
    drawText(page, regular, AUD.format(line.lineTotalAud), 462, y, 10);
    y -= 22;
  }

  y -= 4;
  page.drawLine({
    start: { x: 350, y },
    end: { x: 543, y },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 26;
  drawText(page, bold, "TOTAL PAID (AUD)", 350, y, 11);
  drawText(page, bold, AUD.format(order.subtotalAud), 462, y, 11);

  drawText(
    page,
    regular,
    "Research materials only. Not for human consumption.",
    margin,
    72,
    9,
  );
  drawText(
    page,
    regular,
    "This receipt confirms payment and is not a tax invoice.",
    margin,
    55,
    8,
  );

  document.setTitle(`The Protocol receipt ${order.id}`);
  document.setAuthor("The Protocol");
  return await document.save();
}

export async function createShippingLabelPdf(
  order: PaidOrderDocument,
  from: ShippingFromAddress,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const millimetre = 72 / 25.4;
  const width = 100 * millimetre;
  const height = 150 * millimetre;
  const page = document.addPage([width, height]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const margin = 13;

  page.drawRectangle({
    x: 5,
    y: 5,
    width: width - 10,
    height: height - 10,
    borderWidth: 1.5,
    borderColor: rgb(0, 0, 0),
  });

  let y = height - 25;
  drawText(page, bold, "FROM / RETURN ADDRESS", margin, y, 8);
  y -= 14;
  [
    from.name,
    from.line1,
    `${from.city} ${from.state} ${from.postcode}`,
    from.country,
  ].forEach((line) => {
    drawText(page, regular, line, margin, y, 8);
    y -= 12;
  });

  y -= 5;
  page.drawLine({
    start: { x: 8, y },
    end: { x: width - 8, y },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  y -= 28;
  drawText(page, bold, "SHIP TO", margin, y, 13);
  y -= 27;

  addressLines(order.shipping).forEach((line, index) => {
    drawText(page, index === 0 ? bold : regular, line, margin, y, index === 0 ? 14 : 12);
    y -= index === 0 ? 23 : 19;
  });

  page.drawRectangle({
    x: 10,
    y: 22,
    width: width - 20,
    height: 58,
    borderWidth: 2,
    borderColor: rgb(0, 0, 0),
  });
  drawText(page, bold, "ORDER ID", 18, 62, 8);
  const orderText = safePdfText(order.id);
  const orderSize = orderText.length > 28 ? 10 : 13;
  drawText(page, bold, orderText, 18, 39, orderSize);

  document.setTitle(`Shipping label ${order.id}`);
  document.setAuthor("The Protocol");
  return await document.save();
}
