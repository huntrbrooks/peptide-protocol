#!/usr/bin/env node
/**
 * Finalize OpenArt 21:9 4K vial labels into exact 38×15 mm print masters.
 *
 * Pipeline (per plan):
 *  1. Letterbox fit-height into 3040×1200 (NO vertical crop)
 *  2. Composite real logo + crisp SVG header/name/strength/footer
 *  3. Preserve OpenArt DNA texture in pale fields
 *  4. Optional --qa-only mode for edge-clearance checks
 *
 * Usage:
 *   node scripts/finalize-labels-38x15.mjs
 *   node scripts/finalize-labels-38x15.mjs --qa-only
 *   node scripts/finalize-labels-38x15.mjs --raw-suffix=-raw-4k-v3
 */

import { mkdir, readdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public/labels/color-masters-38x15");
const workDir = path.join(outDir, "_work");
const logoPath = path.join(root, "public/images/logo-mark.png");

const TARGET_W = 3040;
const TARGET_H = 1200;
const MM_H = 15;
const PX_PER_MM = TARGET_H / MM_H;
const SAFE_MM = 2;
const SAFE_PX = Math.round(SAFE_MM * PX_PER_MM); // 160

const SKUS = [
  {
    slug: "bpc-157-10mg",
    productName: "BPC-157",
    synonym: null,
    strength: "10 MG",
    accent: "#1B4F8A",
    light: "#E8F0F8",
  },
  {
    slug: "ipamorelin-10mg",
    productName: "IPAMORELIN",
    synonym: null,
    strength: "10 MG",
    accent: "#C62828",
    light: "#FDECEA",
  },
  {
    slug: "cjc-1295-no-dac-10mg",
    productName: "CJC-1295 NO DAC",
    synonym: "CJC-1295 (without DAC)",
    strength: "10 MG",
    accent: "#D4A017",
    light: "#FFF8E6",
  },
  {
    slug: "tb-500-10mg",
    productName: "TB-500",
    synonym: "Thymosin Beta-4",
    strength: "10 MG",
    accent: "#C62828",
    light: "#FDECEA",
  },
  {
    slug: "pt-141-10mg",
    productName: "PT-141",
    synonym: "Bremelanotide",
    strength: "10 MG",
    accent: "#C62828",
    light: "#FDECEA",
  },
  {
    slug: "ghk-cu-50mg",
    productName: "GHK-Cu",
    synonym: "Copper Peptide",
    strength: "50 MG",
    accent: "#1B4F8A",
    light: "#E8F0F8",
  },
  {
    slug: "retatrutide-20mg",
    productName: "RETATRUTIDE",
    synonym: null,
    strength: "20 MG",
    accent: "#E85A9B",
    light: "#FCE4EC",
  },
  {
    slug: "retatrutide-60mg",
    productName: "RETATRUTIDE",
    synonym: null,
    strength: "60 MG",
    accent: "#C62828",
    light: "#FDECEA",
  },
  {
    slug: "glow-up-80mg",
    productName: "GLOW UP",
    synonym: "KLOW80 • TB 10mg + BPC-157 10mg + GHK 50mg + KPV 10mg",
    strength: "80 MG",
    accent: "#D4A017",
    light: "#FFF8E6",
  },
];

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseArgs(argv) {
  const args = { qaOnly: false, letterboxOnly: false, rawSuffix: "-raw-4k-v3" };
  for (const a of argv) {
    if (a === "--qa-only") args.qaOnly = true;
    if (a === "--letterbox-only") args.letterboxOnly = true;
    if (a.startsWith("--raw-suffix=")) args.rawSuffix = a.slice("--raw-suffix=".length);
  }
  return args;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function samplePaleBg(imgPath, fallback) {
  const { data, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Sample top-left pale area
  const x = Math.floor(info.width * 0.05);
  const y = Math.floor(info.height * 0.05);
  const i = (y * info.width + x) * info.channels;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (L < 180) return fallback;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

async function sampleAccent(imgPath, fallback) {
  const { data, info } = await sharp(imgPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ys = [0.3, 0.34, 0.38].map((f) => Math.floor(info.height * f));
  const xs = [0.02, 0.04, 0.06].map((f) => Math.floor(info.width * f));
  const samples = [];
  for (const y of ys) {
    for (const x of xs) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      samples.push({ r, g, b, L });
    }
  }
  const usable = samples.filter((s) => s.L < 200 && s.L > 25);
  if (!usable.length) return fallback;
  const pick = usable.sort((a, b) => a.L - b.L)[Math.floor(usable.length / 2)];
  return `#${[pick.r, pick.g, pick.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Fit source by height into TARGET, pad sides with pale bg — no vertical crop. */
async function letterbox(srcPath, paleHex) {
  const meta = await sharp(srcPath).metadata();
  const scaledW = Math.round((TARGET_H / meta.height) * meta.width);
  const left = Math.max(0, Math.floor((TARGET_W - scaledW) / 2));

  const resized = await sharp(srcPath)
    .resize({ height: TARGET_H, fit: "inside" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: TARGET_W,
      height: TARGET_H,
      channels: 3,
      background: paleHex,
    },
  })
    .composite([{ input: resized, left, top: 0 }])
    .png()
    .toBuffer();
}

function overlaySvg(sku, accent, logoHref) {
  // Zones sized so logo+wordmark fit under a true 2mm top pad (SAFE_PX).
  const logoSize = Math.round(TARGET_H * 0.095); // ~114px
  const logoY = SAFE_PX;
  const headerBottomPad = Math.round(TARGET_H * 0.02);
  const headerH = logoY + logoSize + headerBottomPad; // ~298px (~25%)
  const footerH = Math.round(TARGET_H * 0.17);
  const footerY = TARGET_H - footerH;
  // Tall enough to bury oversized AI product-name glyphs that bleed under the band
  const bandH = Math.round(TARGET_H * 0.22);
  const bandY = headerH;
  const contentTop = bandY + bandH;
  const contentH = footerY - contentTop;

  const logoX = Math.round(TARGET_W * 0.035);
  const brandX = logoX + logoSize + Math.round(TARGET_W * 0.012);
  const brandSize = Math.round(TARGET_H * 0.048);
  const brandY1 = logoY + Math.round(logoSize * 0.4);
  const brandY2 = logoY + Math.round(logoSize * 0.78);

  const nameLen = sku.productName.length;
  const nameScale = nameLen > 14 ? 0.085 : nameLen > 10 ? 0.1 : 0.115;
  const nameFont = Math.round(TARGET_H * nameScale);

  const synonymFont = Math.round(TARGET_H * 0.04);
  const boxW = Math.round(TARGET_W * (sku.strength.length > 5 ? 0.22 : 0.18));
  const boxH = Math.round(TARGET_H * 0.115);
  const boxX = (TARGET_W - boxW) / 2;
  const stroke = Math.max(3, Math.round(TARGET_H * 0.008));

  let synonymY = 0;
  let boxY;
  if (sku.synonym) {
    synonymY = contentTop + Math.round(contentH * 0.3);
    boxY = synonymY + Math.round(synonymFont * 1.15);
    const maxBoxY = footerY - boxH - Math.round(TARGET_H * 0.02);
    if (boxY > maxBoxY) boxY = maxBoxY;
  } else {
    boxY = contentTop + Math.round((contentH - boxH) / 2);
  }

  const synonymLine = sku.synonym
    ? `<text x="${TARGET_W / 2}" y="${synonymY}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${synonymFont}" fill="${accent}">${escapeXml(sku.synonym)}</text>`
    : "";

  const footerFont = Math.round(TARGET_H * 0.034);
  const footerDescentPad = Math.ceil(footerFont * 0.35) + 8;
  const maxFooterBaseline = TARGET_H - SAFE_PX - footerDescentPad;
  const bandUsableH = Math.max(footerFont, footerH - SAFE_PX);
  const footerTextY = Math.min(
    maxFooterBaseline,
    footerY + Math.round(bandUsableH * 0.58),
  );

  // Center plate abuts name band (no gap for AI white glyphs); DNA stays on left/right.
  const plateX = Math.round(TARGET_W * 0.2);
  const plateW = Math.round(TARGET_W * 0.6);
  const plateY = contentTop;
  const plateH = footerY - contentTop;
  // Full-width pale wipe just under the name band kills leftover AI name bleed at sides
  const wipeH = Math.round(TARGET_H * 0.04);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}">
  <!-- Opaque header: clears AI logo/wordmark; top ${SAFE_PX}px is empty pale margin -->
  <rect x="0" y="0" width="${TARGET_W}" height="${headerH}" fill="${sku.light}"/>
  <image href="${logoHref}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${brandX}" y="${brandY1}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${brandSize}" font-weight="700" fill="${accent}" letter-spacing="2">THE</text>
  <text x="${brandX}" y="${brandY2}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${brandSize}" font-weight="700" fill="${accent}" letter-spacing="2">PROTOCOL</text>

  <!-- Name band (opaque — kills AI product-name ghosts) -->
  <rect x="0" y="${bandY}" width="${TARGET_W}" height="${bandH}" fill="${accent}"/>
  <text x="${TARGET_W / 2}" y="${bandY + bandH * 0.62}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${nameFont}" font-weight="700" fill="#FFFFFF">${escapeXml(sku.productName)}</text>
  <rect x="0" y="${contentTop}" width="${TARGET_W}" height="${wipeH}" fill="${sku.light}"/>

  <!-- Center content plate (opaque) — DNA remains in side pale fields below wipe -->
  <rect x="${plateX}" y="${plateY}" width="${plateW}" height="${plateH}" fill="${sku.light}"/>
  ${synonymLine}
  <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="#FFFFFF" stroke="${accent}" stroke-width="${stroke}" rx="${Math.max(4, Math.round(TARGET_H * 0.015))}"/>
  <text x="${TARGET_W / 2}" y="${boxY + boxH * 0.68}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${Math.round(TARGET_H * 0.068)}" font-weight="700" fill="${accent}">${escapeXml(sku.strength)}</text>

  <!-- Footer with ≥2mm bottom pad -->
  <rect x="0" y="${footerY}" width="${TARGET_W}" height="${footerH}" fill="${accent}"/>
  <text x="${TARGET_W / 2}" y="${footerTextY}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${footerFont}" font-weight="700" fill="#FFFFFF" letter-spacing="3">PURITY 99% • FOR RESEARCH USE ONLY</text>
</svg>`;
}

async function finalizeOne(sku, rawPath, { letterboxOnly = false } = {}) {
  const pale = await samplePaleBg(rawPath, sku.light);
  const accent = await sampleAccent(rawPath, sku.accent);
  const letterboxed = await letterbox(rawPath, pale);
  const outPath = path.join(outDir, `${sku.slug}.png`);

  if (letterboxOnly) {
    // Keep OpenArt art intact — only fit to exact 38×15 canvas
    await sharp(letterboxed).png({ compressionLevel: 6, force: true }).toFile(outPath);
    return { outPath, accent, pale, letterboxOnly: true };
  }

  const logoBuf = await sharp(logoPath)
    .resize({ width: 280, height: 280, fit: "inside" })
    .png()
    .toBuffer();
  const logoHref = `data:image/png;base64,${logoBuf.toString("base64")}`;

  const overlay = await sharp(Buffer.from(overlaySvg({ ...sku, light: pale }, accent, logoHref)))
    .png()
    .toBuffer();

  await sharp(letterboxed)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 6, force: true })
    .toFile(outPath);

  return { outPath, accent, pale, letterboxOnly: false };
}

async function qaOne(slug, { letterboxOnly = false } = {}) {
  const file = path.join(outDir, `${slug}.png`);
  const meta = await sharp(file).metadata();
  const fails = [];
  if (meta.width !== TARGET_W || meta.height !== TARGET_H) {
    fails.push(`size ${meta.width}x${meta.height} ≠ ${TARGET_W}x${TARGET_H}`);
  }

  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;

  // Letterbox-only: match color-masters (~5–7% clearance). Overlay mode: hard 2mm.
  const minTopPx = letterboxOnly ? Math.round(h * 0.04) : SAFE_PX;
  const minBottomPx = letterboxOnly ? Math.round(h * 0.04) : SAFE_PX;
  const minLabel = letterboxOnly ? "4%" : "2mm";

  // First dark/logo ink from top — scan center so side DNA watermarks don't false-fail
  let firstContent = h;
  for (let y = 0; y < h; y++) {
    let hit = 0;
    for (let x = Math.floor(w * 0.3); x < Math.floor(w * 0.7); x++) {
      const i = (y * w + x) * c;
      const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (L < 140) hit++;
    }
    if (hit > 12) {
      firstContent = y;
      break;
    }
  }
  if (firstContent < minTopPx) {
    fails.push(`top content at ${firstContent}px < ${minTopPx}px (${minLabel})`);
  }

  // Lowest near-white pixel in footer region (footer text on accent band)
  let lowestWhite = 0;
  for (let y = Math.floor(h * 0.7); y < h; y++) {
    for (let x = Math.floor(w * 0.15); x < Math.floor(w * 0.85); x++) {
      const i = (y * w + x) * c;
      if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) lowestWhite = y;
    }
  }
  const bottomClear = h - 1 - lowestWhite;
  if (lowestWhite === 0 || bottomClear < minBottomPx) {
    fails.push(`footer clearance ${bottomClear}px < ${minBottomPx}px (${minLabel})`);
  }

  // Outer ~0.5mm / 1mm: no dark logo ink on absolute trim edge
  const border = letterboxOnly ? Math.max(4, Math.round(0.5 * PX_PER_MM)) : Math.round(1 * PX_PER_MM);
  let topEdgeDark = 0;
  for (let y = 0; y < border; y++) {
    for (let x = Math.floor(w * 0.3); x < Math.floor(w * 0.7); x++) {
      const i = (y * w + x) * c;
      const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (L < 100) topEdgeDark++;
    }
  }
  if (topEdgeDark > 20) {
    fails.push(`logo/dark pixels on top edge (${topEdgeDark}) — likely clipped`);
  }

  if (!letterboxOnly) {
    let bottomEdgeWhite = 0;
    for (let y = h - border; y < h; y++) {
      for (let x = Math.floor(w * 0.15); x < Math.floor(w * 0.85); x++) {
        const i = (y * w + x) * c;
        if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) bottomEdgeWhite++;
      }
    }
    if (bottomEdgeWhite > 40) {
      fails.push(`footer text pixels in bottom 1mm (${bottomEdgeWhite})`);
    }
  }

  return {
    slug,
    pass: fails.length === 0,
    fails,
    firstContentPx: firstContent,
    topClearanceMm: +((firstContent / PX_PER_MM).toFixed(2)),
    footerClearanceMm: +((bottomClear / PX_PER_MM).toFixed(2)),
    topClearancePct: +((100 * firstContent) / h).toFixed(2),
    footerClearancePct: +((100 * bottomClear) / h).toFixed(2),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(outDir, { recursive: true });
  await mkdir(workDir, { recursive: true });

  if (!args.qaOnly) {
    const workFiles = await readdir(workDir);
    for (const sku of SKUS) {
      const rawName = `${sku.slug}${args.rawSuffix}.png`;
      const rawPath = path.join(workDir, rawName);
      if (!(await exists(rawPath))) {
        // Fallback: newest matching raw
        const candidates = workFiles
          .filter((f) => f.startsWith(sku.slug) && f.includes("raw-4k") && f.endsWith(".png"))
          .sort();
        if (!candidates.length) {
          console.error(`MISSING raw for ${sku.slug}: expected ${rawName}`);
          process.exitCode = 1;
          continue;
        }
        const fallback = path.join(workDir, candidates[candidates.length - 1]);
        console.warn(`warn: ${rawName} missing, using ${path.basename(fallback)}`);
        const result = await finalizeOne(sku, fallback, { letterboxOnly: args.letterboxOnly });
        console.log(
          `finalized ${sku.slug} accent=${result.accent}${args.letterboxOnly ? " (letterbox-only)" : ""}`,
        );
        continue;
      }
      const result = await finalizeOne(sku, rawPath, { letterboxOnly: args.letterboxOnly });
      console.log(
        `finalized ${sku.slug} accent=${result.accent}${args.letterboxOnly ? " (letterbox-only)" : ""}`,
      );
    }
  }

  const qaResults = [];
  for (const sku of SKUS) {
    const r = await qaOne(sku.slug, { letterboxOnly: args.letterboxOnly });
    qaResults.push(r);
    const mark = r.pass ? "PASS" : "FAIL";
    console.log(
      `QA ${mark} ${sku.slug}: top ${r.topClearanceMm}mm (${r.topClearancePct}%), footer ${r.footerClearanceMm}mm (${r.footerClearancePct}%)${r.fails.length ? " — " + r.fails.join("; ") : ""}`,
    );
  }

  const report = {
    physicalMm: { width: 38, height: 15 },
    colorMastersPx: { width: TARGET_W, height: TARGET_H },
    pipeline: args.letterboxOnly
      ? "OpenArt GPT Image 2 4K 21:9 → letterbox only (no SVG overlay)"
      : "OpenArt 4K 21:9 → letterbox → SVG logo/name/strength/footer composite",
    safeMm: SAFE_MM,
    generatedAt: new Date().toISOString(),
    qa: qaResults,
    allPassed: qaResults.every((r) => r.pass),
  };
  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(outDir, "qa-report.json"), JSON.stringify(report, null, 2));

  if (!report.allPassed) {
    console.error("QA failed for one or more SKUs.");
    process.exitCode = 1;
  } else {
    console.log("All QA checks passed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
