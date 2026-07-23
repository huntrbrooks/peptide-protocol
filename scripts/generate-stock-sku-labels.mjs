#!/usr/bin/env node
/**
 * Print-ready labels for the 8 original-stock SKUs with cap-matched accents.
 *
 * Outputs:
 *   public/labels/color-masters/{slug}.png          (2000×1200)
 *   public/labels/niimbot-thermal/{slug}.png         (400×240, 1-bit style)
 *   public/labels/kit/{stockCode}-kit-label.png      (709×472, 60×40mm @300dpi)
 *   public/labels/stickers/peptide-protocol-universal-circle-{30,40}mm.png
 *
 * Usage:
 *   node scripts/generate-stock-sku-labels.mjs
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public/images/logo-mark.png");

const CAP = {
  darkBlue: { hex: "#1B4F8A", light: "#E8F0F8", name: "dark blue" },
  solidRed: { hex: "#C62828", light: "#FDECEA", name: "solid red" },
  yellow: { hex: "#D4A017", light: "#FFF8E6", name: "yellow" },
  pink: { hex: "#E85A9B", light: "#FCE4EC", name: "pink" },
};

/** Original-stock SKUs — cap colours are source of truth */
const SKUS = [
  {
    stockCode: "BC10",
    slug: "bpc-157-10mg",
    productName: "BPC-157",
    synonym: null,
    strength: "10 MG",
    cap: CAP.darkBlue,
    imageOut: "public/images/products/bpc-157.jpg",
  },
  {
    stockCode: "IP10",
    slug: "ipamorelin-10mg",
    productName: "IPAMORELIN",
    synonym: null,
    strength: "10 MG",
    cap: CAP.solidRed,
    imageOut: "public/images/products/ipamorelin.jpg",
  },
  {
    stockCode: "CP10",
    slug: "cjc-1295-no-dac-10mg",
    productName: "CJC-1295 NO DAC",
    synonym: "CJC-1295 (without DAC)",
    strength: "10 MG",
    cap: CAP.yellow,
    imageOut: "public/images/products/cjc-1295-no-dac.jpg",
  },
  {
    stockCode: "BT10",
    slug: "tb-500-10mg",
    productName: "TB-500",
    synonym: "Thymosin Beta-4",
    strength: "10 MG",
    cap: CAP.solidRed,
    imageOut: "public/images/products/tb-500.jpg",
  },
  {
    stockCode: "P41",
    slug: "pt-141-10mg",
    productName: "PT-141",
    synonym: "Bremelanotide",
    strength: "10 MG",
    cap: CAP.solidRed,
    imageOut: "public/images/products/pt-141.jpg",
  },
  {
    stockCode: "CU50",
    slug: "ghk-cu-50mg",
    productName: "GHK-CU",
    synonym: "Copper Peptide",
    strength: "50 MG",
    cap: CAP.darkBlue,
    imageOut: "public/images/products/ghk-cu-50mg.jpg",
  },
  {
    stockCode: "RT20",
    slug: "retatrutide-20mg",
    productName: "RETATRUTIDE",
    synonym: null,
    strength: "20 MG",
    cap: CAP.pink,
    imageOut: "public/images/products/retatrutide-20mg.jpg",
  },
  {
    stockCode: "RT60",
    slug: "retatrutide-60mg",
    productName: "RETATRUTIDE",
    synonym: null,
    strength: "60 MG",
    cap: CAP.solidRed,
    imageOut: "public/images/products/retatrutide-60mg.jpg",
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
    .resize({ width: 280, height: 280, fit: "inside" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function vialLabelSvg(sku, { w, h, logoUri, thermal = false }) {
  const accent = thermal ? "#000000" : sku.cap.hex;
  const light = thermal ? "#FFFFFF" : sku.cap.light;
  const onAccent = "#FFFFFF";
  const bandH = Math.round(h * 0.22);
  const bandY = Math.round(h * 0.28);
  const footerH = Math.round(h * 0.12);
  const footerY = h - footerH;
  const logoSize = Math.round(h * 0.16);
  const contentTop = bandY + bandH;
  const contentH = footerY - contentTop;
  const synonymFont = Math.round(h * 0.045);
  const boxW = Math.round(w * 0.28);
  const boxH = Math.round(h * 0.12);
  const boxX = (w - boxW) / 2;
  // Minimum clearance below synonym baseline → strength box top (descenders + air).
  const afterSynonym = Math.max(
    14,
    Math.round(h * 0.06),
    Math.round(synonymFont * 0.55) + Math.round(h * 0.03),
  );

  // Stack synonym above strength box with a clear gap so they never collide.
  // Without a synonym, center the strength box in the white content band.
  let synonymY = 0;
  let boxY;
  if (sku.synonym) {
    synonymY = contentTop + Math.round(h * 0.07);
    boxY = synonymY + afterSynonym;
    const maxBoxY = footerY - boxH - Math.round(h * 0.02);
    if (boxY > maxBoxY) boxY = maxBoxY;
  } else {
    boxY = contentTop + Math.round((contentH - boxH) / 2);
  }

  const synonymLine = sku.synonym
    ? `<text x="${w / 2}" y="${synonymY}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${synonymFont}" fill="${accent}" opacity="0.85">${escapeXml(sku.synonym)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${light}"/>
  <image href="${logoUri}" x="${Math.round(w * 0.04)}" y="${Math.round(h * 0.06)}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${Math.round(w * 0.04) + logoSize + Math.round(w * 0.02)}" y="${Math.round(h * 0.12)}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.055)}" font-weight="700" fill="${accent}" letter-spacing="1.5">PEPTIDE</text>
  <text x="${Math.round(w * 0.04) + logoSize + Math.round(w * 0.02)}" y="${Math.round(h * 0.18)}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.055)}" font-weight="700" fill="${accent}" letter-spacing="1.5">PROTOCOL</text>
  <rect x="0" y="${bandY}" width="${w}" height="${bandH}" fill="${accent}"/>
  <text x="${w / 2}" y="${bandY + bandH * 0.65}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.1)}" font-weight="700" fill="${onAccent}">${escapeXml(sku.productName)}</text>
  ${synonymLine}
  <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="${light}" stroke="${accent}" stroke-width="${Math.max(2, Math.round(h * 0.008))}" rx="2"/>
  <text x="${w / 2}" y="${boxY + boxH * 0.68}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.07)}" font-weight="700" fill="${accent}">${escapeXml(sku.strength)}</text>
  <rect x="0" y="${footerY}" width="${w}" height="${footerH}" fill="${accent}"/>
  <text x="${w / 2}" y="${footerY + footerH * 0.62}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.038)}" font-weight="600" fill="${onAccent}" letter-spacing="0.5">PURITY 99% • RESEARCH USE ONLY</text>
</svg>`;
}

function kitLabelSvg(sku, { w, h, logoUri }) {
  const accent = sku.cap.hex;
  const light = sku.cap.light;
  const logoSize = Math.round(h * 0.18);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="8" fill="${light}" stroke="${accent}" stroke-width="4"/>
  <image href="${logoUri}" x="${Math.round(w * 0.04)}" y="${Math.round(h * 0.08)}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${Math.round(w * 0.04) + logoSize + 12}" y="${Math.round(h * 0.16)}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.065)}" font-weight="700" fill="${accent}" letter-spacing="1">PEPTIDE PROTOCOL</text>
  <text x="${Math.round(w * 0.04) + logoSize + 12}" y="${Math.round(h * 0.24)}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.04)}" fill="${accent}" opacity="0.85">peptideprotocolau.io</text>
  <rect x="${Math.round(w * 0.04)}" y="${Math.round(h * 0.32)}" width="${Math.round(w * 0.92)}" height="${Math.round(h * 0.22)}" rx="4" fill="${accent}"/>
  <text x="${w / 2}" y="${Math.round(h * 0.46)}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.09)}" font-weight="700" fill="#FFFFFF">${escapeXml(sku.productName)}</text>
  <text x="${w / 2}" y="${Math.round(h * 0.62)}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.07)}" font-weight="700" fill="${accent}">${escapeXml(sku.strength)}  ·  10 × vials</text>
  <text x="${w / 2}" y="${Math.round(h * 0.74)}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.055)}" font-weight="600" fill="${accent}">STOCK ${escapeXml(sku.stockCode)}</text>
  <text x="${w / 2}" y="${Math.round(h * 0.88)}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.045)}" font-weight="600" fill="${accent}">PURITY 99% · RESEARCH USE ONLY</text>
</svg>`;
}

function circleStickerSvg({ size, logoUri }) {
  const r = size / 2;
  const logo = Math.round(size * 0.28);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${r}" cy="${r}" r="${r - 2}" fill="#FFFFFF" stroke="#1A6B7A" stroke-width="${Math.max(3, Math.round(size * 0.018))}"/>
  <image href="${logoUri}" x="${(size - logo) / 2}" y="${Math.round(size * 0.14)}" width="${logo}" height="${logo}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${r}" y="${Math.round(size * 0.55)}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(size * 0.075)}" font-weight="700" fill="#1A6B7A" letter-spacing="0.5">Peptide Protocol</text>
  <text x="${r}" y="${Math.round(size * 0.66)}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(size * 0.048)}" fill="#1A6B7A">peptideprotocolau.io</text>
  <text x="${r}" y="${Math.round(size * 0.8)}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(size * 0.052)}" font-weight="700" fill="#1A6B7A" letter-spacing="1">RESEARCH USE ONLY</text>
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
  const colorDir = path.join(root, "public/labels/color-masters");
  const thermalDir = path.join(root, "public/labels/niimbot-thermal");
  const kitDir = path.join(root, "public/labels/kit");
  const stickerDir = path.join(root, "public/labels/stickers");
  await mkdir(colorDir, { recursive: true });
  await mkdir(thermalDir, { recursive: true });
  await mkdir(kitDir, { recursive: true });
  await mkdir(stickerDir, { recursive: true });

  const written = [];

  for (const sku of SKUS) {
    const colorSvg = vialLabelSvg(sku, { w: 2000, h: 1200, logoUri });
    const colorOut = path.join(colorDir, `${sku.slug}.png`);
    await rasterSvg(colorSvg, colorOut, { w: 2000, h: 1200 });
    written.push(colorOut);

    const thermalSvg = vialLabelSvg(sku, {
      w: 400,
      h: 240,
      logoUri,
      thermal: true,
    });
    const thermalOut = path.join(thermalDir, `${sku.slug}.png`);
    await rasterSvg(thermalSvg, thermalOut, { w: 400, h: 240, threshold: true });
    written.push(thermalOut);

    const kitSvg = kitLabelSvg(sku, { w: 709, h: 472, logoUri });
    const kitOut = path.join(
      kitDir,
      `${sku.stockCode.toLowerCase()}-kit-label.png`,
    );
    await rasterSvg(kitSvg, kitOut, { w: 709, h: 472 });
    written.push(kitOut);

    console.log(`labels: ${sku.stockCode} ${sku.slug}`);
  }

  for (const [mm, px] of [
    [30, 354],
    [40, 472],
  ]) {
    const svg = circleStickerSvg({ size: px, logoUri });
    const out = path.join(
      stickerDir,
      `peptide-protocol-universal-circle-${mm}mm.png`,
    );
    await rasterSvg(svg, out, { w: px, h: px });
    written.push(out);
    console.log(`sticker: ${mm}mm → ${out}`);
  }

  // Export SKU map for product-image generation helpers
  const mapPath = path.join(root, "tmp/stock-sku-map.json");
  await mkdir(path.dirname(mapPath), { recursive: true });
  await writeFile(mapPath, JSON.stringify(SKUS, null, 2));

  console.log(`Done. Wrote ${written.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
