#!/usr/bin/env node
/**
 * Generate Peptide Protocol brand assets via OpenRouter Images API.
 * Model: openai/gpt-image-2
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-images.mjs
 *   node --env-file=.env.local scripts/generate-images.mjs --only=hero
 *   node --env-file=.env.local scripts/generate-images.mjs --only=products
 */

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY. Set it in .env.local");
  process.exit(1);
}

const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const force = process.argv.includes("--force");

const sharedStyle =
  "Professional clinical research aesthetic, clean laboratory product photography, cool slate and teal colour palette, soft diffused lighting, no text overlays, no logos, no people, no medical injection scenes, premium scientific catalogue style";

const assets = [
  {
    id: "hero",
    out: "public/images/hero.jpg",
    prompt: `${sharedStyle}. Wide hero photograph of a modern Australian research laboratory bench with glass vials and frosted peptide vials arranged on matte stone, shallow depth of field, atmospheric but serious, edge-to-edge composition.`,
  },
  {
    id: "bacteriostatic-water",
    out: "public/images/products/bacteriostatic-water.jpg",
    prompt: `${sharedStyle}. Single clear 10mL glass vial of bacteriostatic water on a pale mist background, studio product shot, subtle reflection.`,
  },
  {
    id: "bpc-157",
    out: "public/images/products/bpc-157.jpg",
    prompt: `${sharedStyle}. Single frosted glass research vial labelled conceptually as lyophilised peptide powder, pale teal-grey background, catalogue product photo.`,
  },
  {
    id: "cjc-1295-dac",
    out: "public/images/products/cjc-1295-dac.jpg",
    prompt: `${sharedStyle}. Single sealed research peptide vial with white lyophilised cake visible, cool laboratory backdrop.`,
  },
  {
    id: "cjc-1295-no-dac",
    out: "public/images/products/cjc-1295-no-dac.jpg",
    prompt: `${sharedStyle}. Premium product photograph of a clear research vial containing white lyophilised powder, soft teal accents.`,
  },
  {
    id: "dsip",
    out: "public/images/products/dsip.jpg",
    prompt: `${sharedStyle}. Research peptide vial on slate surface, soft morning laboratory light.`,
  },
  {
    id: "epitalon",
    out: "public/images/products/epitalon.jpg",
    prompt: `${sharedStyle}. Minimalist lyophilised peptide vial product shot, pale sage and slate tones.`,
  },
  {
    id: "ghk-cu",
    out: "public/images/products/ghk-cu.jpg",
    prompt: `${sharedStyle}. Research vial with subtle blue-green copper peptide powder tone, clinical catalogue photography.`,
  },
  {
    id: "hcg",
    out: "public/images/products/hcg.jpg",
    prompt: `${sharedStyle}. Sterile lyophilised research vial, precise studio lighting, cool scientific mood.`,
  },
  {
    id: "ipamorelin",
    out: "public/images/products/ipamorelin.jpg",
    prompt: `${sharedStyle}. Single research peptide vial upright on mist-coloured seamless background.`,
  },
  {
    id: "melanotan-ii",
    out: "public/images/products/melanotan-ii.jpg",
    prompt: `${sharedStyle}. Research chemical vial product photo, restrained clinical styling, no lifestyle cues.`,
  },
  {
    id: "mots-c",
    out: "public/images/products/mots-c.jpg",
    prompt: `${sharedStyle}. Mitochondrial research peptide vial, soft laboratory lighting, teal and stone palette.`,
  },
  {
    id: "retatrutide",
    out: "public/images/products/retatrutide.jpg",
    prompt: `${sharedStyle}. Premium lyophilised research vial, sharp focus, pale clinical background.`,
  },
  {
    id: "semax",
    out: "public/images/products/semax.jpg",
    prompt: `${sharedStyle}. Neurological research peptide vial, clean product catalogue composition.`,
  },
  {
    id: "sermorelin",
    out: "public/images/products/sermorelin.jpg",
    prompt: `${sharedStyle}. GHRH research peptide vial with white powder cake, professional studio shot.`,
  },
  {
    id: "tb-500",
    out: "public/images/products/tb-500.jpg",
    prompt: `${sharedStyle}. Tissue research peptide vial, matte laboratory surface, soft shadow.`,
  },
  {
    id: "tesamorelin",
    out: "public/images/products/tesamorelin.jpg",
    prompt: `${sharedStyle}. Research peptide vial product photography, cool teal rim light, scientific catalogue style.`,
  },
  {
    id: "tirzepatide",
    out: "public/images/products/tirzepatide.jpg",
    prompt: `${sharedStyle}. Metabolic research peptide vial, high-end clinical product photo, pale paper background.`,
  },
  {
    id: "metabolic",
    out: "public/images/categories/metabolic.jpg",
    prompt: `${sharedStyle}. Abstract laboratory still life suggesting metabolic research, glassware and soft teal light, no text.`,
  },
  {
    id: "growth-hormone",
    out: "public/images/categories/growth-hormone.jpg",
    prompt: `${sharedStyle}. Abstract research bench with sealed vials suggesting growth hormone pathway study, cool palette.`,
  },
  {
    id: "tissue-recovery",
    out: "public/images/categories/tissue-recovery.jpg",
    prompt: `${sharedStyle}. Soft laboratory still life with vials and sterile wraps suggesting tissue research, muted teal.`,
  },
  {
    id: "cognitive-neurological",
    out: "public/images/categories/cognitive-neurological.jpg",
    prompt: `${sharedStyle}. Quiet laboratory desk scene with peptide vials and notebook, neurological research mood, no readable text.`,
  },
  {
    id: "cellular-mitochondrial",
    out: "public/images/categories/cellular-mitochondrial.jpg",
    prompt: `${sharedStyle}. Abstract cellular research aesthetic with glass vials and soft teal glow, scientific but calm.`,
  },
  {
    id: "other-compounds",
    out: "public/images/categories/other-compounds.jpg",
    prompt: `${sharedStyle}. Organised row of research vials on slate, catalogue category image.`,
  },
  {
    id: "research-solvents",
    out: "public/images/categories/research-solvents.jpg",
    prompt: `${sharedStyle}. Clear sterile solvent vials on pale laboratory surface, clean reagent photography.`,
  },
];

function shouldRun(asset) {
  if (!only) return true;
  if (only === "hero") return asset.id === "hero";
  if (only === "products") return asset.out.includes("/products/");
  if (only === "categories") return asset.out.includes("/categories/");
  return asset.id === only;
}

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
    return;
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
      quality: "medium",
      n: 1,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${asset.id} failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`${asset.id}: no b64_json in response`);
  }

  await writeFile(outPath, Buffer.from(b64, "base64"));
  console.log(`wrote ${asset.out}`);
}

const queue = assets.filter(shouldRun);
for (const asset of queue) {
  let attempt = 0;
  while (attempt < 3) {
    try {
      await generate(asset);
      break;
    } catch (error) {
      attempt += 1;
      console.error(error.message || error);
      if (attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

console.log("Done.");
