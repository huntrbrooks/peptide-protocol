import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  createReceiptPdf,
  createShippingLabelPdf,
  type PaidOrderDocument,
} from "./order-documents";

const order: PaidOrderDocument = {
  id: "order_test_123",
  shipping: {
    fullName: "Test Researcher",
    line1: "42 Laboratory Road",
    city: "Sydney",
    state: "NSW",
    postcode: "2000",
    country: "Australia",
  },
  lines: [
    {
      slug: "test-item",
      name: "Test Research Material",
      quantity: 2,
      unitPriceAud: 50,
      lineTotalAud: 100,
    },
  ],
  subtotalAud: 100,
  paymentMethod: "stripe",
  paidAt: Date.UTC(2026, 7, 17),
};

describe("paid order PDFs", () => {
  it("creates an A4 receipt", async () => {
    const bytes = await createReceiptPdf(order);
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();

    expect(bytes.byteLength).toBeGreaterThan(1_000);
    expect(page.getWidth()).toBeCloseTo(595.28, 1);
    expect(page.getHeight()).toBeCloseTo(841.89, 1);
  });

  it("creates a 100 by 150 millimetre shipping label", async () => {
    const bytes = await createShippingLabelPdf(order, {
      name: "The Protocol",
      line1: "123 Example Street",
      city: "Sydney",
      state: "NSW",
      postcode: "2000",
      country: "Australia",
    });
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();
    const pointsPerMillimetre = 72 / 25.4;

    expect(bytes.byteLength).toBeGreaterThan(1_000);
    expect(page.getWidth()).toBeCloseTo(100 * pointsPerMillimetre, 1);
    expect(page.getHeight()).toBeCloseTo(150 * pointsPerMillimetre, 1);
  });
});
