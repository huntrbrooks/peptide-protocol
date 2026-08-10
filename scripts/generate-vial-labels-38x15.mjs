#!/usr/bin/env node
/**
 * Compact vial wrap labels for 3 ml vials — finished size 38 × 15 mm.
 *
 * Aspect ratio (~2.53:1) differs from the legacy 50 × 30 mm masters (~1.67:1),
 * so artwork is regenerated for this size (not stretched from 50×30 files).
 *
 * Does NOT overwrite public/labels/color-masters/ (50×30 OpenArt masters).
 *
 * Outputs:
 *   public/labels/color-masters-38x15/{slug}.png   (1520×600 ≈ same px/mm as 2000×1200@50×30)
 *   public/labels/niimbot-thermal-38x15/{slug}.png (304×120 @ 203 DPI)
 *
 * BAC water for 10 ml vials stays at original 50×30:
 *   public/labels/color-masters/bacteriostatic-water-10ml.png
 *
 * Usage:
 *   node scripts/generate-vial-labels-38x15.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public/images/logo-mark.png");

/** Physical size */
const WIDTH_MM = 38;
const HEIGHT_MM = 15;

/** Colour master px — match ~40 px/mm used by 2000×1200 @ 50×30 */
const COLOR_W = Math.round(WIDTH_MM * 40); // 1520
const COLOR_H = Math.round(HEIGHT_MM * 40); // 600

/** Thermal @ 203 DPI */
const THERMAL_W = Math.round((WIDTH_MM / 25.4) * 203); // ~304
const THERMAL_H = Math.round((HEIGHT_MM / 25.4) * 203); // ~120

const CAP = {
  darkBlue: { hex: "#1B4F8A", light: "#E8F0F8" },
  solidRed: { hex: "#C62828", light: "#FDECEA" },
  yellow: { hex: "#D4A017", light: "#FFF8E6" },
  pink: { hex: "#E85A9B", light: "#FCE4EC" },
  teal: { hex: "#1A6B7A", light: "#E8F4F6" },
};

/** 3 ml peptide wraps — same 8 stock SKUs as generate-stock-sku-labels.mjs */
const SKUS = [
  {
    slug: "bpc-157-10mg",
    productName: "BPC-157",
    synonym: null,
    strength: "10 MG",
    cap: CAP.darkBlue,
  },
  {
    slug: "ipamorelin-10mg",
    productName: "IPAMORELIN",
    synonym: null,
    strength: "10 MG",
    cap: CAP.solidRed,
  },
  {
    slug: "cjc-1295-no-dac-10mg",
    productName: "CJC-1295 NO DAC",
    synonym: "CJC-1295 (without DAC)",
    strength: "10 MG",
    cap: CAP.yellow,
  },
  {
    slug: "tb-500-10mg",
    productName: "TB-500",
    synonym: "Thymosin Beta-4",
    strength: "10 MG",
    cap: CAP.solidRed,
  },
  {
    slug: "pt-141-10mg",
    productName: "PT-141",
    synonym: "Bremelanotide",
    strength: "10 MG",
    cap: CAP.solidRed,
  },
  {
    slug: "ghk-cu-50mg",
    productName: "GHK-CU",
    synonym: "Copper Peptide",
    strength: "50 MG",
    cap: CAP.darkBlue,
  },
  {
    slug: "retatrutide-20mg",
    productName: "RETATRUTIDE",
    synonym: null,
    strength: "20 MG",
    cap: CAP.pink,
  },
  {
    slug: "retatrutide-60mg",
    productName: "RETATRUTIDE",
    synonym: null,
    strength: "60 MG",
    cap: CAP.solidRed,
  },
  {
    slug: "glow-up-80mg",
    productName: "GLOW UP",
    synonym: "KLOW80 • TB 10mg + BPC-157 10mg + GHK 50mg + KPV 10mg",
    strength: "80 MG",
    cap: CAP.yellow,
  },
];

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function logoDataUri() {
  const buf = await sharp(logoPath)
    .resize({ width: 200, height: 200, fit: "inside" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/**
 * Compact layout for 38×15 mm — shorter header/footer so the name band
 * and strength stay readable on 3 ml vials.
 */
function vialLabelSvg38x15(sku, { w, h, logoUri, thermal = false }) {
  const accent = thermal ? "#000000" : sku.cap.hex;
  const light = thermal ? "#FFFFFF" : sku.cap.light;
  const onAccent = "#FFFFFF";

  const headerH = Math.round(h * 0.2);
  const bandH = Math.round(h * 0.3);
  const bandY = headerH;
  const footerH = Math.round(h * 0.14);
  const footerY = h - footerH;
  const contentTop = bandY + bandH;
  const contentH = footerY - contentTop;

  const logoSize = Math.round(h * 0.14);
  const logoX = Math.round(w * 0.025);
  const logoY = Math.round((headerH - logoSize) / 2);
  const brandX = logoX + logoSize + Math.round(w * 0.015);
  const brandSize = Math.round(h * 0.07);
  const brandY1 = Math.round(headerH * 0.38);
  const brandY2 = Math.round(headerH * 0.72);

  // Long names (CJC-1295 NO DAC, RETATRUTIDE) need slightly smaller type
  const nameLen = sku.productName.length;
  const nameScale = nameLen > 14 ? 0.11 : nameLen > 10 ? 0.125 : 0.14;
  const nameFont = Math.round(h * nameScale);

  const synonymFont = Math.round(h * 0.055);
  const boxW = Math.round(w * (sku.strength.length > 5 ? 0.26 : 0.22));
  const boxH = Math.round(h * 0.16);
  const boxX = (w - boxW) / 2;
  const stroke = Math.max(1.5, Math.round(h * 0.01));

  let synonymY = 0;
  let boxY;
  if (sku.synonym) {
    synonymY = contentTop + Math.round(contentH * 0.32);
    boxY = synonymY + Math.round(synonymFont * 0.85);
    const maxBoxY = footerY - boxH - Math.round(h * 0.015);
    if (boxY > maxBoxY) boxY = maxBoxY;
  } else {
    boxY = contentTop + Math.round((contentH - boxH) / 2);
  }

  const synonymLine = sku.synonym
    ? `<text x="${w / 2}" y="${synonymY}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${synonymFont}" fill="${accent}" opacity="0.9">${escapeXml(sku.synonym)}</text>`
    : "";

  const footerText = "PURITY 99% • RESEARCH USE ONLY";
  const footerFont = Math.round(h * 0.05);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${light}"/>
  <image href="${logoUri}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${brandX}" y="${brandY1}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${brandSize}" font-weight="700" fill="${accent}" letter-spacing="1.2">THE</text>
  <text x="${brandX}" y="${brandY2}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${brandSize}" font-weight="700" fill="${accent}" letter-spacing="1.2">PROTOCOL</text>
  <rect x="0" y="${bandY}" width="${w}" height="${bandH}" fill="${accent}"/>
  <text x="${w / 2}" y="${bandY + bandH * 0.66}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${nameFont}" font-weight="700" fill="${onAccent}">${escapeXml(sku.productName)}</text>
  ${synonymLine}
  <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="#FFFFFF" stroke="${accent}" stroke-width="${stroke}" rx="${Math.max(2, Math.round(h * 0.02))}"/>
  <text x="${w / 2}" y="${boxY + boxH * 0.7}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.09)}" font-weight="700" fill="${accent}">${escapeXml(sku.strength)}</text>
  <rect x="0" y="${footerY}" width="${w}" height="${footerH}" fill="${accent}"/>
  <text x="${w / 2}" y="${footerY + footerH * 0.65}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${footerFont}" font-weight="600" fill="${onAccent}" letter-spacing="0.4">${footerText}</text>
</svg>`;
}

async function rasterSvg(svg, outPath, { w, h, threshold = false }) {
  let pipeline = sharp(Buffer.from(svg)).resize(w, h, { fit: "fill" }).png();
  if (threshold) {
    pipeline = sharp(await pipeline.toBuffer())
      .greyscale()
      .threshold(160)
      .png();
  }
  const buf = await pipeline.toBuffer();
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, buf);
  return outPath;
}

async function main() {
  const logoUri = await logoDataUri();
  const colorDir = path.join(root, "public/labels/color-masters-38x15");
  const thermalDir = path.join(root, "public/labels/niimbot-thermal-38x15");
  await mkdir(colorDir, { recursive: true });
  await mkdir(thermalDir, { recursive: true });

  const written = [];

  for (const sku of SKUS) {
    const colorSvg = vialLabelSvg38x15(sku, {
      w: COLOR_W,
      h: COLOR_H,
      logoUri,
    });
    const colorOut = path.join(colorDir, `${sku.slug}.png`);
    await rasterSvg(colorSvg, colorOut, { w: COLOR_W, h: COLOR_H });
    written.push(colorOut);

    const thermalSvg = vialLabelSvg38x15(sku, {
      w: THERMAL_W,
      h: THERMAL_H,
      logoUri,
      thermal: true,
    });
    const thermalOut = path.join(thermalDir, `${sku.slug}.png`);
    await rasterSvg(thermalSvg, thermalOut, {
      w: THERMAL_W,
      h: THERMAL_H,
      threshold: true,
    });
    written.push(thermalOut);

    console.log(`38×15: ${sku.slug}`);
  }

  const manifest = {
    physicalMm: { width: WIDTH_MM, height: HEIGHT_MM },
    colorMastersPx: { width: COLOR_W, height: COLOR_H },
    thermalPx: { width: THERMAL_W, height: THERMAL_H },
    vial: "3ml",
    skus: SKUS.map((s) => s.slug),
    bacWater10ml: {
      note: "Keep original 50×30 mm artwork — do not use 38×15 for BAC water",
      file: "public/labels/color-masters/bacteriostatic-water-10ml.png",
      physicalMm: { width: 50, height: 30 },
    },
    generatedAt: new Date().toISOString(),
  };
  const manifestPath = path.join(colorDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  written.push(manifestPath);

  console.log(
    `Done. Wrote ${written.length} files → color-masters-38x15/ + niimbot-thermal-38x15/`,
  );
  console.log(
    `BAC water (10 ml): keep color-masters/bacteriostatic-water-10ml.png @ 50×30 mm`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
