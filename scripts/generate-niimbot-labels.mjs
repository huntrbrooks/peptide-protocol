#!/usr/bin/env node
/**
 * Generate Niimbot thermal print-ready vial labels from repo product data.
 *
 * Assumption (no printer model in repo):
 *   Niimbot B21 / B1 family — most common product/vial stock size
 *   Label size: 50 × 30 mm
 *   Resolution: 203 DPI
 *   Format: PNG (Niimbot app accepts JPG/BMP/TIF/JPEG/PNG)
 *   Color: 1-bit style solid black on white
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-niimbot-labels.mjs
 */

import { mkdir, writeFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const productsImageDir = path.join(root, "public/images/products");
const outDir = path.join(root, "public/labels");

/** Documented Niimbot target (B21/B1 default vial label). */
const SPEC = {
  modelAssumption: "Niimbot B21 / B1 (not confirmed in repo)",
  widthMm: 50,
  heightMm: 30,
  dpi: 203,
  format: "PNG",
  colorMode: "solid black (#000) on white (#FFF); thresholded for thermal",
  safeMarginMm: { top: 2, bottom: 2, left: 3, right: 3 },
  sources: [
    "https://www.niimbot.co.za/pages/niimbot-b21-product-specifications (203 dpi, 20–50mm width)",
    "https://niimbot.eu/en/comparison-of-models/ (B21 stock includes 50×30mm)",
    "B21 retail packs commonly include 50×30mm labels",
  ],
};

function mmToPx(mm, dpi = SPEC.dpi) {
  return Math.round((mm / 25.4) * dpi);
}

const W = mmToPx(SPEC.widthMm);
const H = mmToPx(SPEC.heightMm);
const MARGIN = {
  top: mmToPx(SPEC.safeMarginMm.top),
  bottom: mmToPx(SPEC.safeMarginMm.bottom),
  left: mmToPx(SPEC.safeMarginMm.left),
  right: mmToPx(SPEC.safeMarginMm.right),
};

/**
 * Product fields pulled only from src/content/products.ts (name, shortName,
 * strength, image, and optional purity when present in specs).
 * Flags note missing optional fields — never invented.
 */
const PRODUCTS = [
  {
    slug: "bacteriostatic-water-10ml",
    shortName: "BAC Water",
    strength: "10mL",
    imageFile: "bacteriostatic-water.jpg",
    purity: null,
    flag: "No purity % in specs; composition (0.9% benzyl alcohol) not printed to avoid crowding — see product page.",
  },
  {
    slug: "bpc-157-10mg",
    shortName: "BPC-157",
    strength: "10mg",
    imageFile: "bpc-157.jpg",
    purity: "≥99%",
  },
  {
    slug: "cjc-1295-dac-5mg",
    shortName: "CJC-1295 DAC",
    strength: "5mg",
    imageFile: "cjc-1295-dac.jpg",
    purity: "≥99%",
  },
  {
    slug: "cjc-1295-no-dac-10mg",
    shortName: "CJC-1295 No DAC",
    strength: "10mg",
    imageFile: "cjc-1295-no-dac.jpg",
    purity: "≥99%",
  },
  {
    slug: "dsip-5mg",
    shortName: "DSIP",
    strength: "5mg",
    imageFile: "dsip.jpg",
    purity: "≥99%",
  },
  {
    slug: "epitalon-10mg",
    shortName: "Epitalon",
    strength: "10mg",
    imageFile: "epitalon.jpg",
    purity: "≥99%",
  },
  {
    slug: "ghk-cu-100mg",
    shortName: "GHK-Cu",
    strength: "100mg",
    imageFile: "ghk-cu.jpg",
    purity: "≥99%",
  },
  {
    slug: "hcg-5000iu",
    shortName: "HCG",
    strength: "5000 IU",
    imageFile: "hcg.jpg",
    purity: null,
    flag: "No numeric purity in specs (COA-dependent); potency shown as strength only.",
  },
  {
    slug: "ipamorelin-10mg",
    shortName: "Ipamorelin",
    strength: "10mg",
    imageFile: "ipamorelin.jpg",
    purity: "≥99%",
  },
  {
    slug: "melanotan-ii-10mg",
    shortName: "Melanotan II",
    strength: "10mg",
    imageFile: "melanotan-ii.jpg",
    purity: "≥99%",
  },
  {
    slug: "mots-c-10mg",
    shortName: "MOTS-c",
    strength: "10mg",
    imageFile: "mots-c.jpg",
    purity: "≥99%",
  },
  {
    slug: "retatrutide-10mg",
    shortName: "Retatrutide",
    strength: "10mg",
    imageFile: "retatrutide.jpg",
    purity: "≥99%",
  },
  {
    slug: "semax-11mg",
    shortName: "Semax",
    strength: "11mg",
    imageFile: "semax.jpg",
    purity: "≥99%",
  },
  {
    slug: "sermorelin-10mg",
    shortName: "Sermorelin",
    strength: "10mg",
    imageFile: "sermorelin.jpg",
    purity: "≥99%",
  },
  {
    slug: "tb-500-10mg",
    shortName: "TB-500",
    strength: "10mg",
    imageFile: "tb-500.jpg",
    purity: "≥99%",
  },
  {
    slug: "tesamorelin-10mg",
    shortName: "Tesamorelin",
    strength: "10mg",
    imageFile: "tesamorelin.jpg",
    purity: "≥99%",
  },
  {
    slug: "tirzepatide-10mg",
    shortName: "Tirzepatide",
    strength: "10mg",
    imageFile: "tirzepatide.jpg",
    purity: "≥99%",
  },
];

const RESEARCH_LINE = "RESEARCH USE ONLY"; // abbreviated from products.ts RESEARCH_NOTICE

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function productNameFontSize(name) {
  const n = name.length;
  if (n <= 10) return 28;
  if (n <= 14) return 24;
  if (n <= 18) return 20;
  return 17;
}

/** Layout from OpenRouter design pass (Claude Sonnet): brand → name → strength/purity → disclaimer. */
function buildLabelSvg(product) {
  const innerX = MARGIN.left;
  const innerY = MARGIN.top;
  const innerW = W - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;
  const cx = innerX + innerW / 2;

  const brandY = innerY + 14;
  const nameSize = productNameFontSize(product.shortName);
  const nameY = innerY + 14 + 22 + nameSize * 0.35;
  const ruleY = nameY + nameSize * 0.55 + 6;
  const strengthY = ruleY + 22;
  const disclaimerY = H - MARGIN.bottom - 8;

  const strengthLine = product.purity
    ? `${product.strength}  ·  ${product.purity}`
    : product.strength;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <!-- outer frame: 2px min stroke for thermal -->
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="#000000" stroke-width="2"/>
  <text x="${cx}" y="${brandY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#000000" letter-spacing="1.2">PEPTIDE PROTOCOL</text>
  <text x="${cx}" y="${nameY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${nameSize}" font-weight="700" fill="#000000">${escapeXml(product.shortName.toUpperCase())}</text>
  <rect x="${innerX + 8}" y="${ruleY}" width="${innerW - 16}" height="3" fill="#000000"/>
  <text x="${cx}" y="${strengthY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#000000">${escapeXml(strengthLine)}</text>
  <text x="${cx}" y="${disclaimerY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="700" fill="#000000" letter-spacing="0.8">${RESEARCH_LINE}</text>
</svg>`;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function validateInventory() {
  const files = (await readdir(productsImageDir)).filter((f) =>
    /\.(jpg|jpeg|png|webp)$/i.test(f),
  );
  const expected = new Set(PRODUCTS.map((p) => p.imageFile));
  const actual = new Set(files);

  const missingImages = [...expected].filter((f) => !actual.has(f));
  const extraImages = [...actual].filter((f) => !expected.has(f));

  if (files.length !== 17 || PRODUCTS.length !== 17 || missingImages.length || extraImages.length) {
    return {
      ok: false,
      report: {
        imageCount: files.length,
        productCount: PRODUCTS.length,
        missingImages,
        extraImages,
        images: files.sort(),
        products: PRODUCTS.map((p) => p.slug),
      },
    };
  }

  for (const p of PRODUCTS) {
    if (!p.shortName || !p.strength || !p.slug) {
      return {
        ok: false,
        report: { error: "Missing required fields", product: p },
      };
    }
  }

  return { ok: true, files };
}

async function renderLabelPng(product) {
  const svg = Buffer.from(buildLabelSvg(product));
  // Threshold to hard black/white — no soft anti-alias gray for thermal heads.
  const png = await sharp(svg)
    .resize(W, H, { fit: "fill" })
    .greyscale()
    .threshold(160)
    .png({ compressionLevel: 9, palette: true, colors: 2 })
    .toBuffer();
  return png;
}

async function writeLabels() {
  await mkdir(outDir, { recursive: true });
  const written = [];

  for (const product of PRODUCTS) {
    const png = await renderLabelPng(product);
    const filename = `${product.slug}.png`;
    const outPath = path.join(outDir, filename);
    await writeFile(outPath, png);
    written.push({
      file: filename,
      slug: product.slug,
      shortName: product.shortName,
      strength: product.strength,
      purity: product.purity,
      flag: product.flag ?? null,
      pixels: `${W}×${H}`,
      mm: `${SPEC.widthMm}×${SPEC.heightMm}`,
    });
    console.log(`wrote labels/${filename}`);
  }

  return written;
}

async function writeProofSheet(written) {
  const cols = 3;
  const rows = Math.ceil(written.length / cols);
  const gapX = mmToPx(8);
  const gapY = mmToPx(14);
  const pad = mmToPx(12);
  const annotH = mmToPx(8);
  const titleH = mmToPx(14);
  const sheetW = pad * 2 + cols * W + (cols - 1) * gapX;
  const sheetH =
    pad * 2 + titleH + rows * (H + annotH) + (rows - 1) * gapY + mmToPx(18);

  const composites = [];
  const annotations = [];

  for (let i = 0; i < written.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (W + gapX);
    const y = pad + titleH + row * (H + annotH + gapY);
    const buf = await sharp(path.join(outDir, written[i].file)).png().toBuffer();
    composites.push({ input: buf, left: x, top: y });
    annotations.push({
      x: x + W / 2,
      y: y + H + mmToPx(5),
      text: written[i].shortName,
    });
  }

  const scaleNoteY = sheetH - mmToPx(6);
  const svgOverlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${sheetW}" height="${sheetH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${sheetW}" height="${sheetH}" fill="#FFFFFF"/>
  <text x="${sheetW / 2}" y="${pad + mmToPx(6)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#000000">Peptide Protocol — Niimbot Label Proof (${SPEC.widthMm}×${SPEC.heightMm} mm @ ${SPEC.dpi} DPI)</text>
  <text x="${sheetW / 2}" y="${pad + mmToPx(11)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#000000">True scale at ${SPEC.dpi} DPI · ${written.length} labels · Assumption: ${escapeXml(SPEC.modelAssumption)}</text>
  ${annotations
    .map(
      (a) =>
        `<text x="${a.x}" y="${a.y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" fill="#000000">${escapeXml(a.text)}</text>`,
    )
    .join("\n  ")}
  <text x="${sheetW / 2}" y="${scaleNoteY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="#000000">Each label frame is ${W}×${H} px = ${SPEC.widthMm}×${SPEC.heightMm} mm at ${SPEC.dpi} DPI. Print this sheet at 100% scale (no “fit to page”).</text>
</svg>`;

  const base = await sharp(Buffer.from(svgOverlay)).png().toBuffer();
  const proofPath = path.join(outDir, "PROOF-SHEET-all-labels.png");
  await sharp(base).composite(composites).png().toFile(proofPath);
  console.log(`wrote labels/PROOF-SHEET-all-labels.png (${sheetW}×${sheetH} px)`);
  return proofPath;
}

async function writeManifest(written) {
  const flags = written.filter((w) => w.flag);
  const manifest = {
    generatedAt: new Date().toISOString(),
    target: SPEC,
    pixelSize: { width: W, height: H },
    productCount: written.length,
    files: written.map((w) => w.file),
    flags: flags.map((f) => ({ slug: f.slug, flag: f.flag })),
    layoutSource: "OpenRouter anthropic/claude-sonnet-4 design pass + sharp SVG raster",
  };

  const manifestPath = path.join(outDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  const readme = `# Niimbot print-ready labels

## Target spec (assumption)

| Item | Value |
|------|-------|
| Printer model | **${SPEC.modelAssumption}** — no model found in repo |
| Label size | **${SPEC.widthMm} × ${SPEC.heightMm} mm** (common B21 vial/product stock) |
| Resolution | **${SPEC.dpi} DPI** → **${W} × ${H} px** |
| Color | Solid black on white (thresholded; no grayscale / color) |
| Format | PNG (Niimbot app: JPG / BMP / TIF / JPEG / PNG) |
| Safe margins | ${SPEC.safeMarginMm.top}/${SPEC.safeMarginMm.bottom} mm TB, ${SPEC.safeMarginMm.left}/${SPEC.safeMarginMm.right} mm LR |

Sources / reasoning:
${SPEC.sources.map((s) => `- ${s}`).join("\n")}

If your printer is a **D110/D11** (≤15 mm width) or **B3S** (up to 75 mm), these files will not match your stock — say which model/label size you have and they can be regenerated.

## Inventory check

17 images in \`public/images/products\` ↔ 17 products in \`src/content/products.ts\` (matched).

## Files

### Individual labels (print these in the Niimbot app)
${written.map((w) => `- \`${w.file}\` — ${w.shortName} (${w.strength}${w.purity ? `, ${w.purity}` : ""})`).join("\n")}

### Proof sheet
- \`PROOF-SHEET-all-labels.png\` — all 17 labels at true ${SPEC.dpi} DPI scale with product names annotated

### Manifest
- \`manifest.json\`

## Data flags (not invented)

${flags.length ? flags.map((f) => `- **${f.slug}**: ${f.flag}`).join("\n") : "- None — all products had name + strength; purity omitted only where absent in specs."}

Label text uses only: brand, \`shortName\`, \`strength\`, optional purity from specs when present, and abbreviated research line from the shared research notice (“RESEARCH USE ONLY”).

## How to print in the Niimbot app

1. Load a **${SPEC.widthMm}×${SPEC.heightMm} mm** white thermal label roll into the printer (B21/B1).
2. Open the **NIIMBOT** app → connect your printer over Bluetooth.
3. Create a new label → set size to **${SPEC.widthMm} × ${SPEC.heightMm} mm** (or choose the matching stock template).
4. Tap **Image** / import → select one PNG from this folder (e.g. \`bpc-157-10mg.png\`).
5. Stretch the image to fill the label canvas (edge to edge). Do not add extra borders in-app.
6. Print 1 copy as a test; check alignment and darkness. Adjust printer density if text looks light.
7. Repeat for each product file. Use \`PROOF-SHEET-all-labels.png\` only for review (print at 100% scale on a normal printer) — not as a Niimbot label.

## Regenerate

\`\`\`bash
node --env-file=.env.local scripts/generate-niimbot-labels.mjs
\`\`\`
`;

  await writeFile(path.join(outDir, "README.md"), readme);
  console.log("wrote labels/README.md and labels/manifest.json");
}

async function main() {
  console.log(`Target: ${SPEC.widthMm}×${SPEC.heightMm} mm @ ${SPEC.dpi} DPI → ${W}×${H} px`);
  console.log(`Assumption: ${SPEC.modelAssumption}`);

  const check = await validateInventory();
  if (!check.ok) {
    console.error("INVENTORY MISMATCH — stopping before label generation.");
    console.error(JSON.stringify(check.report, null, 2));
    process.exit(1);
  }
  console.log(`Inventory OK: ${check.files.length} images ↔ ${PRODUCTS.length} products`);

  const written = await writeLabels();
  await writeProofSheet(written);
  await writeManifest(written);

  console.log("\nFlags:");
  for (const w of written.filter((x) => x.flag)) {
    console.log(`  - ${w.slug}: ${w.flag}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
