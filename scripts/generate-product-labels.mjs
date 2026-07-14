#!/usr/bin/env node
/**
 * Regenerate labelled product vial photos via OpenRouter Images API.
 * Model: openai/gpt-image-2 (quality: high)
 *
 * Uses logo-mark.png + each Product examples vial as references.
 * Overwrites public/images/products/*.jpg
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-product-labels.mjs --force
 *   node --env-file=.env.local scripts/generate-product-labels.mjs --force --only=bpc-157
 */

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiKey = process.env.OPENROUTER_API_KEY;
const force = process.argv.includes("--force");
const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY. Set it in .env.local");
  process.exit(1);
}

const examplesDir = path.join(root, "public/images/Product examples");
const logoMarkPath = path.join(root, "public/images/logo-mark.png");

/** Site palette from globals.css */
const COLORS = {
  paper: "#F4F7F8",
  mist: "#D9E6EA",
  ink: "#0B1F2A",
  muted: "#5A717C",
  accent: "#1A6B7A",
  tealSoft: "#9EC9D1",
};

const products = [
  {
    id: "bacteriostatic-water",
    out: "public/images/products/bacteriostatic-water.jpg",
    example: "5-2.png.bv.webp",
    productName: "BACTERIOSTATIC WATER",
    strength: "10 ML",
  },
  {
    id: "bpc-157",
    out: "public/images/products/bpc-157.jpg",
    example: "bpc_157_10mg-e1772292050227.webp",
    productName: "BPC-157",
    strength: "10 MG",
  },
  {
    id: "cjc-1295-dac",
    out: "public/images/products/cjc-1295-dac.jpg",
    example: "cjc_1295_dac_5mg-e1772292261896.webp",
    productName: "CJC-1295 DAC",
    strength: "5 MG",
  },
  {
    id: "cjc-1295-no-dac",
    out: "public/images/products/cjc-1295-no-dac.jpg",
    example: "cjc_1295_no_dac_10mg-e1772293664181.webp.bv_resized_desktop.webp.bv.webp",
    productName: "CJC-1295 NO DAC",
    strength: "10 MG",
  },
  {
    id: "dsip",
    out: "public/images/products/dsip.jpg",
    example: "dsip_5mg-e1772292346997.webp",
    productName: "DSIP",
    strength: "5 MG",
  },
  {
    id: "epitalon",
    out: "public/images/products/epitalon.jpg",
    example: "epitalon_10mg-e1772292374543.webp",
    productName: "EPITALON",
    strength: "10 MG",
  },
  {
    id: "ghk-cu",
    out: "public/images/products/ghk-cu.jpg",
    example: "ChatGPT-Image-Jun-6-2026-05_27_21-PM.webp",
    productName: "GHK-CU",
    strength: "100 MG",
  },
  {
    id: "hcg",
    out: "public/images/products/hcg.jpg",
    example: "hcg_5000iu-e1772292501171.webp",
    productName: "HCG",
    strength: "5000 IU",
  },
  {
    id: "ipamorelin",
    out: "public/images/products/ipamorelin.jpg",
    example: "ipamorelin_10mg-e1772292612154.webp",
    productName: "IPAMORELIN",
    strength: "10 MG",
  },
  {
    id: "melanotan-ii",
    out: "public/images/products/melanotan-ii.jpg",
    example: "melanotan_2_10mg-1-e1772292019911.webp",
    productName: "MELANOTAN II",
    strength: "10 MG",
  },
  {
    id: "mots-c",
    out: "public/images/products/mots-c.jpg",
    example: "mots_c_10mg-e1772292677904.webp",
    productName: "MOTS-C",
    strength: "10 MG",
  },
  {
    id: "retatrutide",
    out: "public/images/products/retatrutide.jpg",
    example: "retatrutide_10mg-e1772291891296.webp",
    productName: "RETATRUTIDE",
    strength: "10 MG",
  },
  {
    id: "semax",
    out: "public/images/products/semax.jpg",
    example: "semax_11mg-e1772292758786.webp.bv_resized_desktop.webp.bv.webp",
    productName: "SEMAX",
    strength: "11 MG",
  },
  {
    id: "sermorelin",
    out: "public/images/products/sermorelin.jpg",
    example: "sermorelin_10mg-e1772291769222.webp",
    productName: "SERMORELIN",
    strength: "10 MG",
  },
  {
    id: "tb-500",
    out: "public/images/products/tb-500.jpg",
    example: "tb_500_10mg-e1772291854105.webp",
    productName: "TB-500",
    strength: "10 MG",
  },
  {
    id: "tesamorelin",
    out: "public/images/products/tesamorelin.jpg",
    example: "tesamorelin_10mg-1-e1772292785898.webp.bv_resized_desktop.webp.bv.webp",
    productName: "TESAMORELIN",
    strength: "10 MG",
  },
  {
    id: "tirzepatide",
    out: "public/images/products/tirzepatide.jpg",
    example: "tirzepatide_10mg-e1772292821341.webp.bv_resized_desktop.webp.bv.webp",
    productName: "TIRZEPATIDE",
    strength: "10 MG",
  },
];

function buildPrompt(product) {
  return `Rebrand this research peptide vial product photograph for brand "Peptide Protocol".

REFERENCE IMAGES:
1) Logo-mark: use this EXACT DNA helix-in-circle mark on the vial label (teal ribbons, thin ring). Do not invent a different helix.
2) Product vial: keep the SAME vial glass shape, powder/cake contents, camera angle, soft studio lighting, shadow, and catalogue framing as this photo.

REMOVE all existing branding completely (no "Pure Peptides", no yellow/gold label accents, no gold caps).

NEW LABEL — same layout structure as the product reference, rebranded:
• Top row: small helix mark (from logo-mark) on the LEFT + "PEPTIDE PROTOCOL" in clean sans-serif to the RIGHT, colour ${COLORS.accent}
• Center: thick horizontal band in ${COLORS.accent} with bold product name exactly: "${product.productName}" (white or near-white text on the teal band)
• Below the band: rectangular outlined box with strength exactly: "${product.strength}"
• Bottom thin band: "PURITY 99% • FOR RESEARCH USE ONLY" in small readable text
• Optional: very faint soft-teal DNA watermark on the lower white label field only

CAP: flip-off cap must be teal ${COLORS.accent} (not gold). Silver metal crimp seal is fine.

BACKGROUND: seamless soft studio backdrop using site paper ${COLORS.paper} grading gently into mist ${COLORS.mist}. No pure stark white, no yellow, no navy plate.

COLOUR PALETTE ONLY: ${COLORS.accent}, ${COLORS.tealSoft}, ${COLORS.ink}, ${COLORS.muted}, ${COLORS.paper}, ${COLORS.mist}, white label. No yellow, no gold, no purple, no orange.

Typography must be crisp and fully legible. Square high-end clinical catalogue product photo, consistent professional look.`;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function toPngDataUrl(filePath, { maxEdge = 1024 } = {}) {
  const png = await sharp(filePath)
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function generate(product, logoMarkDataUrl) {
  const outPath = path.join(root, product.out);
  await mkdir(path.dirname(outPath), { recursive: true });

  if (!force && (await exists(outPath))) {
    console.log(`skip (exists): ${product.out}`);
    return;
  }

  const examplePath = path.join(examplesDir, product.example);
  if (!(await exists(examplePath))) {
    throw new Error(`${product.id}: missing example ${product.example}`);
  }

  const exampleDataUrl = await toPngDataUrl(examplePath, { maxEdge: 1024 });
  console.log(`generating: ${product.id} (${product.productName} ${product.strength})`);

  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://peptideprotocolau.io",
      "X-Title": "Peptide Protocol",
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2",
      prompt: buildPrompt(product),
      quality: "high",
      n: 1,
      input_references: [
        {
          type: "image_url",
          image_url: { url: logoMarkDataUrl },
        },
        {
          type: "image_url",
          image_url: { url: exampleDataUrl },
        },
      ],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${product.id} failed (${response.status}): ${text.slice(0, 800)}`);
  }

  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`${product.id}: no b64_json in response: ${text.slice(0, 400)}`);
  }

  const jpeg = await sharp(Buffer.from(b64, "base64"))
    .resize({
      width: 1600,
      height: 1600,
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  await writeFile(outPath, jpeg);
  const cost = json?.usage?.cost;
  console.log(
    `wrote ${product.out}${typeof cost === "number" ? ` (cost ~$${cost.toFixed(4)})` : ""}`,
  );
}

const queue = products.filter((p) => !only || p.id === only);
if (only && queue.length === 0) {
  console.error(`No product matched --only=${only}`);
  process.exit(1);
}

console.log(`Logo mark: ${logoMarkPath}`);
const logoMarkDataUrl = await toPngDataUrl(logoMarkPath, { maxEdge: 768 });
console.log(`Queue: ${queue.length} product(s)`);

for (const product of queue) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      await generate(product, logoMarkDataUrl);
      break;
    } catch (error) {
      attempt += 1;
      console.error(error.message || error);
      if (attempt >= 3) throw error;
      const wait = 3000 * attempt;
      console.log(`retry ${attempt}/3 in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

console.log("Done.");
