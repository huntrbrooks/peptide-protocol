#!/usr/bin/env node
/**
 * Generate Peptide Protocol vertical helix logo + transparent favicon mark.
 * Model: openai/gpt-image-2 via OpenRouter Images API.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-logo.mjs --force
 */

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiKey = process.env.OPENROUTER_API_KEY;
const force = process.argv.includes("--force");

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY. Set it in .env.local");
  process.exit(1);
}

// Exact site theme colours from src/app/globals.css
const COLORS = {
  paper: "#f4f7f8",
  ink: "#0b1f2a",
  mist: "#d9e6ea",
  muted: "#5a717c",
  accent: "#1a6b7a",
  tealSoft: "#9ec9d1",
};

const referenceCandidates = [
  path.join(
    root,
    "../.cursor/projects/Users-gerardgrenville-Peptide-Protocol-peptide/assets/images-930e3ad0-ff0c-446b-84d0-da5745790ae9.png",
  ),
  "/Users/gerardgrenville/.cursor/projects/Users-gerardgrenville-Peptide-Protocol-peptide/assets/images-930e3ad0-ff0c-446b-84d0-da5745790ae9.png",
];

async function loadReferenceDataUrl() {
  for (const candidate of referenceCandidates) {
    try {
      const buf = await readFile(candidate);
      console.log(`reference: ${candidate}`);
      return `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      /* try next */
    }
  }
  console.warn("No reference image found — generating from prompt only");
  return null;
}

const assets = [
  {
    id: "logo",
    out: "public/images/logo.png",
    prompt: `Redesign this logo lockup for brand "Peptide Protocol" (NOT "Peptide Solutions"). Keep the SAME vertical composition and premium scientific feel as the reference: DNA double-helix ribbon icon inside a thin circular ring at top, bold all-caps primary wordmark below, smaller wider-tracked secondary line beneath.

CRITICAL TEXT (exact spelling, all caps):
- Primary line: PEPTIDE
- Secondary line: PROTOCOL
Do NOT write SOLUTIONS or any other secondary word.

COLOURS — use ONLY this site palette (no cyan→purple gradient, no navy fill background):
- Helix ribbon: subtle 3D/soft shading using teal #1A6B7A transitioning gently to soft teal #9EC9D1 (site accent → teal-soft only)
- Thin circular ring: #1A6B7A or #9EC9D1
- Primary word "PEPTIDE": solid deep ink #0B1F2A, bold clean sans-serif, all caps
- Secondary word "PROTOCOL": #5A717C (muted), all caps, smaller size, much wider letter-spacing/tracking
- Background: solid pure white #FFFFFF (will be removed later) — no navy plate, no dark fill

Style: premium clinical research brand, subtle 3D ribbon DNA helix, helix tips may slightly extend past the ring, centered vertical stack, ample padding, crisp vector-like finish, high resolution, no people, no vials, no glow bloom, no purple.`,
  },
  {
    id: "logo-mark",
    out: "public/images/logo-mark.png",
    prompt: `App icon / favicon mark ONLY: stylized DNA double-helix ribbon inside a thin circular ring, matching the reference composition style. NO TEXT.

COLOURS from site theme only:
- Helix: teal #1A6B7A to soft teal #9EC9D1 (subtle 3D ribbon, no purple, no cyan neon)
- Ring: #1A6B7A
- Background: solid pure white #FFFFFF only (no navy fill)

Centered, large clear silhouette readable at 32px, premium scientific clinical aesthetic, helix tips may extend slightly past the ring.`,
  },
  {
    id: "logo-footer",
    out: "public/images/logo-footer.png",
    prompt: `Same vertical logo lockup composition as the reference (DNA helix in thin ring above stacked wordmark), designed so light text is clear — place on a solid dark ink fill #0B1F2A matching the site footer.

TEXT exact (all caps):
- Primary: PEPTIDE
- Secondary: PROTOCOL
Do NOT write SOLUTIONS.

COLOURS from site theme:
- Helix ribbon: #9EC9D1 to #1A6B7A (soft teal → accent), subtle 3D
- Ring: #9EC9D1
- Primary "PEPTIDE": solid #F4F7F8 (paper/off-white)
- Secondary "PROTOCOL": #9EC9D1, smaller, wide tracking
- Background: solid #0B1F2A (site ink)

Premium clinical scientific brand mark, centered vertical stack, no purple.`,
  },
];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function generate(asset, referenceDataUrl) {
  const outPath = path.join(root, asset.out);
  await mkdir(path.dirname(outPath), { recursive: true });

  if (!force && (await exists(outPath))) {
    console.log(`skip (exists): ${asset.out}`);
    return outPath;
  }

  console.log(`generating: ${asset.id}`);
  const body = {
    model: "openai/gpt-image-2",
    prompt: asset.prompt,
    quality: "medium",
    n: 1,
  };
  if (referenceDataUrl) {
    body.input_references = [
      {
        type: "image_url",
        image_url: { url: referenceDataUrl },
      },
    ];
  }

  const response = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://peptideprotocolau.io",
      "X-Title": "Peptide Protocol",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${asset.id} failed (${response.status}): ${text.slice(0, 800)}`);
  }

  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`${asset.id}: no b64_json in response: ${text.slice(0, 400)}`);
  }

  await writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`wrote ${asset.out}`);
  return outPath;
}

/** Punch near-white / near-navy solid plates to alpha if model ignored transparent bg */
async function forceTransparent(inputPath, { punchLight = true, punchDark = true } = {}) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (punchLight && r >= 245 && g >= 245 && b >= 245) {
      data[i + 3] = 0;
      continue;
    }
    // Reference-style navy fill → transparent
    if (
      punchDark &&
      r <= 35 &&
      g <= 45 &&
      b <= 70 &&
      Math.abs(r - g) < 25 &&
      b >= r
    ) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(inputPath);

  // Trim empty margins
  const trimmed = await sharp(inputPath)
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
  await writeFile(inputPath, trimmed);
  console.log(`transparent+trim: ${path.relative(root, inputPath)}`);
}

async function writeIco(pngBuffers, outPath) {
  const images = [];
  for (const buf of pngBuffers) {
    const meta = await sharp(buf).metadata();
    images.push({
      width: meta.width >= 256 ? 0 : meta.width,
      height: meta.height >= 256 ? 0 : meta.height,
      data: buf,
    });
  }
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + 16 * count;
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width, 0);
    entry.writeUInt8(img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += img.data.length;
  }
  await writeFile(outPath, Buffer.concat([header, ...entries, ...images.map((i) => i.data)]));
}

async function deriveIcons(markPath) {
  const appDir = path.join(root, "src/app");
  const publicDir = path.join(root, "public");
  await mkdir(appDir, { recursive: true });

  const cleaned = await sharp(markPath)
    .ensureAlpha()
    .trim({ threshold: 5 })
    .png()
    .toBuffer();

  // Transparent favicons (no white plate)
  const squareTransparent = async (size) =>
    sharp(cleaned)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .png()
      .toBuffer();

  const icon64 = await squareTransparent(64);
  const icon32 = await squareTransparent(32);
  const apple = await squareTransparent(180);

  await writeFile(path.join(appDir, "icon.png"), icon64);
  await writeFile(path.join(appDir, "apple-icon.png"), apple);
  await writeFile(path.join(publicDir, "apple-icon.png"), apple);
  await writeFile(path.join(publicDir, "icon-32.png"), icon32);

  // Refresh mark at 512 transparent
  const mark512 = await squareTransparent(512);
  await writeFile(path.join(publicDir, "images/logo-mark.png"), mark512);

  const ico16 = await squareTransparent(16);
  const ico32 = await squareTransparent(32);
  const ico48 = await squareTransparent(48);
  await writeIco([ico16, ico32, ico48], path.join(appDir, "favicon.ico"));
  await writeIco([ico16, ico32, ico48], path.join(publicDir, "favicon.ico"));

  console.log("wrote transparent favicon.ico, icon.png, apple-icon.png, icon-32.png");
}

const referenceDataUrl = await loadReferenceDataUrl();

for (const asset of assets) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      await generate(asset, referenceDataUrl);
      break;
    } catch (error) {
      attempt += 1;
      console.error(error.message || error);
      if (attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 2500 * attempt));
    }
  }
}

await forceTransparent(path.join(root, "public/images/logo.png"), {
  punchLight: true,
  punchDark: true,
});
await forceTransparent(path.join(root, "public/images/logo-mark.png"), {
  punchLight: true,
  punchDark: true,
});
// Footer lockup keeps ink plate — only trim (do not punch dark)
{
  const footerPath = path.join(root, "public/images/logo-footer.png");
  const trimmed = await sharp(footerPath).trim({ threshold: 8 }).png().toBuffer();
  await writeFile(footerPath, trimmed);
  console.log("trimmed public/images/logo-footer.png");
}

await deriveIcons(path.join(root, "public/images/logo-mark.png"));
console.log("Done. Theme colours used:", COLORS);
