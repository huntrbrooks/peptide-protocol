#!/usr/bin/env node
/**
 * Generate Peptide Protocol logo + favicon mark via OpenRouter (openai/gpt-image-2),
 * then derive App Router icon assets with sharp.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-logo.mjs
 *   node --env-file=.env.local scripts/generate-logo.mjs --force
 */

import { mkdir, writeFile, access } from "node:fs/promises";
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

const assets = [
  {
    id: "logo",
    out: "public/images/logo.png",
    prompt:
      "Professional brand logo lockup for an Australian research-peptide supplier named Peptide Protocol. Horizontal composition: refined wordmark reading exactly \"Peptide Protocol\" in a clean modern serif or humanist sans, paired with a compact geometric mark suggesting a stylised peptide bond or molecular link (two linked hexagons or a minimal helix fragment). Colour palette: deep ink slate #0B1F2A and clinical teal #1A6B7A on a pure white background. Flat vector logo design, crisp edges, high contrast, trustworthy clinical aesthetic, no purple, no neon glow, no gradients, no 3D, no photorealism, no people, no vials, no medical syringes, ample padding around the lockup, suitable for a website header.",
  },
  {
    id: "logo-mark",
    out: "public/images/logo-mark.png",
    prompt:
      "Square app icon / favicon mark for Peptide Protocol. Centered geometric monogram: interlocking letter P forms or a minimal peptide-bond glyph made of two linked rounded rectangles, deep ink slate #0B1F2A and clinical teal #1A6B7A on pure white. Flat vector, perfectly centered, large clear silhouette that remains legible at 32px, no text, no purple, no glow, no gradients, no photorealism, generous but balanced padding, clinical research brand aesthetic.",
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

async function generate(asset) {
  const outPath = path.join(root, asset.out);
  await mkdir(path.dirname(outPath), { recursive: true });

  if (!force && (await exists(outPath))) {
    console.log(`skip (exists): ${asset.out}`);
    return outPath;
  }

  console.log(`generating: ${asset.id}`);
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
      prompt: asset.prompt,
      quality: "high",
      n: 1,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${asset.id} failed (${response.status}): ${text.slice(0, 800)}`);
  }

  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`${asset.id}: no b64_json in response`);
  }

  await writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`wrote ${asset.out}`);
  return outPath;
}

async function writeIco(pngBuffers, outPath) {
  // Minimal multi-size ICO writer (PNG-compressed entries, Vista+)
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
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = dataOffset;
  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
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
  await mkdir(publicDir, { recursive: true });

  // Trim near-white margins so the mark fills the canvas better
  const cleaned = await sharp(markPath)
    .trim({ background: "#ffffff", threshold: 12 })
    .png()
    .toBuffer();

  const square = async (size) =>
    sharp(cleaned)
      .resize(size, size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: "#ffffff" })
      .ensureAlpha()
      .png()
      .toBuffer();

  const icon64 = await square(64);
  const icon32 = await square(32);
  const apple = await square(180);
  const mark512 = await square(512);

  await writeFile(path.join(appDir, "icon.png"), icon64);
  await writeFile(path.join(appDir, "apple-icon.png"), apple);
  await writeFile(path.join(publicDir, "apple-icon.png"), apple);
  await writeFile(path.join(publicDir, "images/logo-mark.png"), mark512);

  const ico16 = await square(16);
  const ico32 = await square(32);
  const ico48 = await square(48);
  await writeIco([ico16, ico32, ico48], path.join(appDir, "favicon.ico"));
  await writeIco([ico16, ico32, ico48], path.join(publicDir, "favicon.ico"));

  // Also keep a public PNG favicon for explicit metadata if needed
  await writeFile(path.join(publicDir, "icon-32.png"), icon32);

  console.log("wrote src/app/icon.png, apple-icon.png, favicon.ico");
  console.log("wrote public/favicon.ico, public/icon-32.png");
}

async function refineLogo(logoPath) {
  // Soft-trim excess white canvas while keeping a clean PNG for the header
  const trimmed = await sharp(logoPath)
    .trim({ background: "#ffffff", threshold: 10 })
    .png()
    .toBuffer();

  const withPadding = await sharp(trimmed)
    .extend({
      top: 24,
      bottom: 24,
      left: 32,
      right: 32,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  await writeFile(logoPath, withPadding);
  console.log("refined public/images/logo.png");
}

for (const asset of assets) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      await generate(asset);
      break;
    } catch (error) {
      attempt += 1;
      console.error(error.message || error);
      if (attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 2500 * attempt));
    }
  }
}

const logoPath = path.join(root, "public/images/logo.png");
const markPath = path.join(root, "public/images/logo-mark.png");
await refineLogo(logoPath);
await deriveIcons(markPath);
console.log("Done.");
