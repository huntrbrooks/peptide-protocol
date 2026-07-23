#!/usr/bin/env node
/**
 * Generate flat vial labels matching public/images/products artwork via
 * OpenRouter openai/gpt-image-2, then export Niimbot-sized thermal PNGs.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs
 *   node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --only=bpc-157-10mg
 *   node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --force
 */

import { mkdir, writeFile, access } from "node:fs/promises";
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

const COLORS = {
  paper: "#FFFFFF",
  ink: "#0B1F2A",
  accent: "#1A6B7A",
  tealSoft: "#9EC9D1",
};

/** B21/B1 common vial label stock */
const SPEC = {
  widthMm: 50,
  heightMm: 30,
  dpi: 203,
};
const NIIMBOT_W = Math.round((SPEC.widthMm / 25.4) * SPEC.dpi); // ~400
const NIIMBOT_H = Math.round((SPEC.heightMm / 25.4) * SPEC.dpi); // ~240

const outDir = path.join(root, "public/labels");
const colorDir = path.join(outDir, "color-masters");
const thermalDir = path.join(outDir, "niimbot-thermal");
const logoMarkPath = path.join(root, "public/images/logo-mark.png");
const productsDir = path.join(root, "public/images/products");

const PRODUCTS = [
  {
    slug: "bacteriostatic-water-10ml",
    image: "bacteriostatic-water.jpg",
    productName: "BAC WATER",
    strength: "10 ML",
    purityLine: "FOR RESEARCH USE ONLY",
  },
  {
    slug: "bpc-157-10mg",
    image: "bpc-157.jpg",
    productName: "BPC-157",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "cjc-1295-dac-5mg",
    image: "cjc-1295-dac.jpg",
    productName: "CJC-1295 DAC",
    strength: "5 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "cjc-1295-no-dac-10mg",
    image: "cjc-1295-no-dac.jpg",
    productName: "CJC-1295 NO DAC",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "dsip-5mg",
    image: "dsip.jpg",
    productName: "DSIP",
    strength: "5 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "epitalon-10mg",
    image: "epitalon.jpg",
    productName: "EPITALON",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "ghk-cu-100mg",
    image: "ghk-cu.jpg",
    productName: "GHK-CU",
    strength: "100 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "hcg-5000iu",
    image: "hcg.jpg",
    productName: "HCG",
    strength: "5000 IU",
    purityLine: "FOR RESEARCH USE ONLY",
  },
  {
    slug: "ipamorelin-10mg",
    image: "ipamorelin.jpg",
    productName: "IPAMORELIN",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "melanotan-ii-10mg",
    image: "melanotan-ii.jpg",
    productName: "MELANOTAN II",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "mots-c-10mg",
    image: "mots-c.jpg",
    productName: "MOTS-C",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "retatrutide-10mg",
    image: "retatrutide.jpg",
    productName: "RETATRUTIDE",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "semax-11mg",
    image: "semax.jpg",
    productName: "SEMAX",
    strength: "11 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "sermorelin-10mg",
    image: "sermorelin.jpg",
    productName: "SERMORELIN",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "tb-500-10mg",
    image: "tb-500.jpg",
    productName: "TB-500",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "tesamorelin-10mg",
    image: "tesamorelin.jpg",
    productName: "TESAMORELIN",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
  {
    slug: "tirzepatide-10mg",
    image: "tirzepatide.jpg",
    productName: "TIRZEPATIDE",
    strength: "10 MG",
    purityLine: "PURITY 99% • FOR RESEARCH USE ONLY",
  },
];

function buildPrompt(product) {
  return `Create a FLAT rectangular PRODUCT LABEL artwork (not a photo of a vial, not 3D, not mockup).

REFERENCE IMAGES:
1) Logo-mark: use this EXACT DNA helix-in-circle mark (teal ribbons, thin ring). Do not invent a different helix.
2) Product vial photo: MATCH the label design style and layout already printed on this vial. Reproduce that same label as a flat 2D rectangular sticker/layout, full-bleed edge to edge.

LAYOUT (landscape, aspect ~5:3, white label field) — match the vial label exactly:
• TOP: small helix mark on the LEFT + "PEPTIDE PROTOCOL" in two lines of bold teal sans-serif to the RIGHT (colour ${COLORS.accent})
• CENTER: thick solid horizontal band in ${COLORS.accent} with bold white product name exactly: "${product.productName}"
• BELOW band: rectangular outlined box (teal stroke) with strength exactly: "${product.strength}" — the box MUST be HORIZONTALLY CENTERED under the product name (not left-aligned)
• Optional: faint soft teal DNA watermark on the lower white field only (subtle)
• BOTTOM thin teal band or line with small white/teal text exactly: "${product.purityLine}"

STRICT RULES:
- Output ONLY the flat label (full frame). No vial glass, no cap, no hands, no background scene, no shadows, no perspective warp.
- Crisp readable typography. Professional clinical research brand look.
- Colour palette only: ${COLORS.accent}, ${COLORS.tealSoft}, ${COLORS.ink}, white. No yellow, gold, purple, orange.
- Do not invent extra ingredients, dosages, barcodes, or warnings beyond the text specified above.`;
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

/** Crop the central label-ish region from the vial photo as a stronger style cue. */
async function vialLabelCropDataUrl(imagePath) {
  const meta = await sharp(imagePath).rotate().metadata();
  const w = meta.width ?? 1600;
  const h = meta.height ?? 1600;
  // Label sits mid-vial; take a landscape band through the center.
  const cropW = Math.round(w * 0.55);
  const cropH = Math.round(h * 0.42);
  const left = Math.round((w - cropW) / 2);
  const top = Math.round(h * 0.28);
  const png = await sharp(imagePath)
    .rotate()
    .extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: Math.min(cropW, w - left),
      height: Math.min(cropH, h - top),
    })
    .resize({ width: 1024, height: 614, fit: "cover" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function callGptImage2(prompt, references) {
  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://peptideprotocolau.io",
      "X-Title": "Peptide Protocol Labels",
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2",
      prompt,
      quality: "high",
      n: 1,
      input_references: references,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter images failed (${response.status}): ${text.slice(0, 800)}`);
  }
  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`No b64_json in response: ${text.slice(0, 400)}`);
  }
  return { buffer: Buffer.from(b64, "base64"), cost: json?.usage?.cost };
}

async function exportVariants(slug, rawBuffer) {
  // Color master — landscape 5:3 cover crop at high res
  const colorMaster = await sharp(rawBuffer)
    .resize({
      width: 2000,
      height: 1200,
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  const colorPath = path.join(colorDir, `${slug}.png`);
  await writeFile(colorPath, colorMaster);

  // Niimbot thermal: exact 50×30mm @ 203 DPI, hard B&W (teal→black).
  // Crush faint watermarks/gradients so they don't dither into speckles.
  const thermal = await sharp(colorMaster)
    .resize(NIIMBOT_W, NIIMBOT_H, { fit: "fill" })
    .greyscale()
    .normalize()
    .linear(1.55, -48)
    .threshold(155)
    .png({ compressionLevel: 9, palette: true, colors: 2 })
    .toBuffer();

  const thermalPath = path.join(thermalDir, `${slug}.png`);
  await writeFile(thermalPath, thermal);

  // Convenience copy at root of labels/ (thermal print-ready)
  await writeFile(path.join(outDir, `${slug}.png`), thermal);

  return { colorPath, thermalPath };
}

async function generateOne(product, logoMarkDataUrl) {
  const colorPath = path.join(colorDir, `${product.slug}.png`);
  if (!force && (await exists(colorPath))) {
    console.log(`skip (exists): ${product.slug}`);
    const existing = await sharp(colorPath).png().toBuffer();
    await exportVariants(product.slug, existing);
    return { skipped: true };
  }

  const vialPath = path.join(productsDir, product.image);
  if (!(await exists(vialPath))) {
    throw new Error(`Missing product image: ${product.image}`);
  }

  const vialDataUrl = await toPngDataUrl(vialPath, { maxEdge: 1024 });
  const cropDataUrl = await vialLabelCropDataUrl(vialPath);

  console.log(`generating (gpt-image-2): ${product.slug} — ${product.productName}`);

  const { buffer, cost } = await callGptImage2(buildPrompt(product), [
    { type: "image_url", image_url: { url: logoMarkDataUrl } },
    { type: "image_url", image_url: { url: vialDataUrl } },
    { type: "image_url", image_url: { url: cropDataUrl } },
  ]);

  await exportVariants(product.slug, buffer);
  console.log(
    `wrote color + thermal for ${product.slug}${typeof cost === "number" ? ` (cost ~$${cost.toFixed(4)})` : ""}`,
  );
  return { skipped: false, cost };
}

async function writeProofSheet(slugs) {
  const cols = 3;
  const rows = Math.ceil(slugs.length / cols);
  const gapX = 64;
  const gapY = 112;
  const pad = 96;
  const annotH = 64;
  const titleH = 112;
  const sheetW = pad * 2 + cols * NIIMBOT_W + (cols - 1) * gapX;
  const sheetH = pad * 2 + titleH + rows * (NIIMBOT_H + annotH) + (rows - 1) * gapY + 80;

  const composites = [];
  const annotations = [];

  for (let i = 0; i < slugs.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (NIIMBOT_W + gapX);
    const y = pad + titleH + row * (NIIMBOT_H + annotH + gapY);
    const buf = await sharp(path.join(thermalDir, `${slugs[i]}.png`)).png().toBuffer();
    composites.push({ input: buf, left: x, top: y });
    const product = PRODUCTS.find((p) => p.slug === slugs[i]);
    annotations.push({
      x: x + NIIMBOT_W / 2,
      y: y + NIIMBOT_H + 40,
      text: product?.productName ?? slugs[i],
    });
  }

  const escape = (s) =>
    String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${sheetW}" height="${sheetH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${sheetW}" height="${sheetH}" fill="#FFFFFF"/>
  <text x="${sheetW / 2}" y="${pad + 36}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#000000">Peptide Protocol — Niimbot Proof (vial-matched layout, thermal B&amp;W)</text>
  <text x="${sheetW / 2}" y="${pad + 64}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#000000">${SPEC.widthMm}×${SPEC.heightMm} mm @ ${SPEC.dpi} DPI (${NIIMBOT_W}×${NIIMBOT_H} px) · Generated with openai/gpt-image-2 · Color masters in color-masters/</text>
  ${annotations
    .map(
      (a) =>
        `<text x="${a.x}" y="${a.y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#000000">${escape(a.text)}</text>`,
    )
    .join("\n  ")}
  <text x="${sheetW / 2}" y="${sheetH - 28}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#000000">Niimbot prints black only — teal bands become solid black. For full-color labels matching product photos, use a color label printer with files in color-masters/.</text>
</svg>`;

  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(base)
    .composite(composites)
    .png()
    .toFile(path.join(outDir, "PROOF-SHEET-all-labels.png"));
  console.log("wrote PROOF-SHEET-all-labels.png");
}

async function writeReadme(slugs) {
  const readme = `# Niimbot / vial-matched labels

## Why these didn't match the product photos before

The first pass was a **plain text thermal layout**. Your product photos use the full Peptide Protocol vial brand system (DNA mark, teal name band, strength box, research footer).

**Niimbot is still a valid printer for vials** — but standard Niimbot units are **direct thermal (black only)**. They cannot print teal, gradients, or soft watermarks in color. The teal bands become solid black; the logo becomes a B&W mark.

- Use \`niimbot-thermal/\` (or root \`*.png\`) in the NIIMBOT app.
- Use \`color-masters/\` if you print on a **color** label printer / inkjet for photo-matching teal labels.

## Spec (assumption: B21 / B1)

| Item | Value |
|------|-------|
| Size | ${SPEC.widthMm} × ${SPEC.heightMm} mm |
| DPI | ${SPEC.dpi} → ${NIIMBOT_W} × ${NIIMBOT_H} px |
| Thermal files | 1-bit PNG |
| Color masters | PNG ~2000×1200 |
| Model | openai/gpt-image-2 via OpenRouter |

## Files

### Thermal (Niimbot)
${slugs.map((s) => `- \`niimbot-thermal/${s}.png\``).join("\n")}

### Color masters
${slugs.map((s) => `- \`color-masters/${s}.png\``).join("\n")}

### Proof
- \`PROOF-SHEET-all-labels.png\`

## Print (Niimbot app)

1. Load **${SPEC.widthMm}×${SPEC.heightMm} mm** white thermal labels.
2. NIIMBOT app → connect printer → new label at that size.
3. Import a file from \`niimbot-thermal/\` → stretch edge-to-edge.
4. Test print; raise density if light.
5. For teal/color matching the website photos, print \`color-masters/\` on a color label printer instead.

## Regenerate

\`\`\`bash
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --force
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --only=bpc-157-10mg --force
\`\`\`
`;
  await writeFile(path.join(outDir, "README.md"), readme);
}

async function main() {
  await mkdir(colorDir, { recursive: true });
  await mkdir(thermalDir, { recursive: true });

  const queue = PRODUCTS.filter((p) => !only || p.slug === only || p.slug.includes(only));
  if (only && queue.length === 0) {
    console.error(`No product matched --only=${only}`);
    process.exit(1);
  }

  console.log(`Logo: ${logoMarkPath}`);
  console.log(`Queue: ${queue.length} · Niimbot ${NIIMBOT_W}×${NIIMBOT_H} px`);
  const logoMarkDataUrl = await toPngDataUrl(logoMarkPath, { maxEdge: 768 });

  let totalCost = 0;
  for (const product of queue) {
    let attempt = 0;
    while (attempt < 3) {
      try {
        const result = await generateOne(product, logoMarkDataUrl);
        if (typeof result.cost === "number") totalCost += result.cost;
        break;
      } catch (error) {
        attempt += 1;
        console.error(error.message || error);
        if (attempt >= 3) throw error;
        const wait = 4000 * attempt;
        console.log(`retry ${attempt}/3 in ${wait}ms…`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }

  const allSlugs = PRODUCTS.map((p) => p.slug);
  // Ensure every slug has thermal export if color master exists
  for (const p of PRODUCTS) {
    const colorPath = path.join(colorDir, `${p.slug}.png`);
    if (await exists(colorPath)) {
      const buf = await sharp(colorPath).png().toBuffer();
      await exportVariants(p.slug, buf);
    }
  }

  const ready = [];
  for (const slug of allSlugs) {
    if (await exists(path.join(thermalDir, `${slug}.png`))) ready.push(slug);
  }

  if (ready.length === 17) {
    await writeProofSheet(ready);
    await writeReadme(ready);
  } else {
    console.warn(`Only ${ready.length}/17 ready — proof sheet skipped until complete.`);
    await writeReadme(ready);
  }

  if (totalCost > 0) console.log(`Approx OpenRouter image cost this run: $${totalCost.toFixed(4)}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
