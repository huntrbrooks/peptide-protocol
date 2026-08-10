/**
 * Detect solid white QR placeholders on lab-handling inserts and composite a real QR.
 * Target URL: https://peptideprotocolau.io/lab-handling
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRINT_DIR = path.join(__dirname, "../public/images/print");
const QR_URL = "https://peptideprotocolau.io/lab-handling";

/**
 * Find the largest solid near-white square via row-run histogram + density check.
 * Ignores sparse white text by requiring high fill ratio inside the candidate.
 */
async function findWhiteSquare(imagePath) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const isWhite = (x, y) => {
    const i = (y * width + x) * channels;
    return data[i] >= 245 && data[i + 1] >= 245 && data[i + 2] >= 245;
  };

  // For each row, find longest contiguous white run
  const rowRuns = [];
  for (let y = 0; y < height; y++) {
    let best = { start: -1, len: 0 };
    let start = -1;
    let len = 0;
    for (let x = 0; x <= width; x++) {
      const white = x < width && isWhite(x, y);
      if (white) {
        if (start < 0) start = x;
        len++;
      } else if (start >= 0) {
        if (len > best.len) best = { start, len };
        start = -1;
        len = 0;
      }
    }
    rowRuns.push(best);
  }

  // Slide vertically looking for a stack of similar long runs (solid square)
  let bestSquare = null;
  let bestScore = 0;
  const minSide = Math.floor(Math.min(width, height) * 0.12); // at least ~12% of short side
  const maxSide = Math.floor(Math.min(width, height) * 0.55);

  for (let y0 = 0; y0 < height; y0++) {
    if (rowRuns[y0].len < minSide) continue;

    // Grow downward while runs stay aligned and similarly long
    const targetStart = rowRuns[y0].start;
    const targetLen = rowRuns[y0].len;
    let y1 = y0;
    while (y1 + 1 < height) {
      const r = rowRuns[y1 + 1];
      if (r.len < targetLen * 0.92) break;
      if (Math.abs(r.start - targetStart) > targetLen * 0.05) break;
      if (Math.abs(r.len - targetLen) > targetLen * 0.08) break;
      y1++;
    }

    const sideH = y1 - y0 + 1;
    const sideW = targetLen;
    const side = Math.min(sideH, sideW);
    if (side < minSide || side > maxSide) {
      y0 = y1; // skip ahead
      continue;
    }

    // Center horizontally on the run, vertically on the stack
    const left = targetStart + Math.floor((sideW - side) / 2);
    const top = y0 + Math.floor((sideH - side) / 2);

    // Density check: solid fill, not text
    let whiteCount = 0;
    const sampleStep = Math.max(1, Math.floor(side / 80));
    let samples = 0;
    for (let y = top; y < top + side; y += sampleStep) {
      for (let x = left; x < left + side; x += sampleStep) {
        samples++;
        if (isWhite(x, y)) whiteCount++;
      }
    }
    const density = whiteCount / samples;
    if (density < 0.92) {
      y0 = y1;
      continue;
    }

    const score = side * side * density;
    if (score > bestScore) {
      bestScore = score;
      bestSquare = {
        left,
        top,
        width: side,
        height: side,
        density,
        runStack: { y0, y1, targetStart, targetLen },
      };
    }
    y0 = y1;
  }

  if (!bestSquare) {
    throw new Error(`No solid white placeholder square found in ${imagePath}`);
  }

  // Tighten edges: trim any non-white fringe from each side
  let { left, top, width: side } = bestSquare;
  let right = left + side - 1;
  let bottom = top + side - 1;

  const rowIsMostlyWhite = (y, x0, x1) => {
    let w = 0;
    const n = x1 - x0 + 1;
    for (let x = x0; x <= x1; x++) if (isWhite(x, y)) w++;
    return w / n > 0.9;
  };
  const colIsMostlyWhite = (x, y0, y1) => {
    let w = 0;
    const n = y1 - y0 + 1;
    for (let y = y0; y <= y1; y++) if (isWhite(x, y)) w++;
    return w / n > 0.9;
  };

  while (top < bottom && !rowIsMostlyWhite(top, left, right)) top++;
  while (bottom > top && !rowIsMostlyWhite(bottom, left, right)) bottom--;
  while (left < right && !colIsMostlyWhite(left, top, bottom)) left++;
  while (right > left && !colIsMostlyWhite(right, top, bottom)) right--;

  const w = right - left + 1;
  const h = bottom - top + 1;
  const finalSide = Math.min(w, h);
  left = left + Math.floor((w - finalSide) / 2);
  top = top + Math.floor((h - finalSide) / 2);

  return {
    left,
    top,
    width: finalSide,
    height: finalSide,
    density: bestSquare.density,
  };
}

async function generateQrPng(size) {
  return QRCode.toBuffer(QR_URL, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

async function decodeQrFromPngBuffer(pngBuffer) {
  const png = PNG.sync.read(pngBuffer);
  const code = jsQR(Uint8ClampedArray.from(png.data), png.width, png.height);
  return code?.data ?? null;
}

async function compositeInsert(inputName, outputNames) {
  const inputPath = path.join(PRINT_DIR, inputName);
  const placeholder = await findWhiteSquare(inputPath);
  console.log(`\n${inputName}`);
  console.log("  placeholder:", placeholder);

  // Inset so raspberry border stays visible; QR margin provides quiet zone
  const inset = Math.max(8, Math.round(placeholder.width * 0.035));
  const qrSize = placeholder.width - inset * 2;
  const qrBuffer = await generateQrPng(qrSize);

  const qrDecoded = await decodeQrFromPngBuffer(qrBuffer);
  console.log("  QR encode URL:", QR_URL);
  console.log("  QR decode URL:", qrDecoded);
  if (qrDecoded !== QR_URL) {
    throw new Error(`QR decode mismatch: expected ${QR_URL}, got ${qrDecoded}`);
  }

  const composed = await sharp(inputPath)
    .composite([
      {
        input: qrBuffer,
        left: placeholder.left + inset,
        top: placeholder.top + inset,
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const region = await sharp(composed)
    .extract({
      left: placeholder.left,
      top: placeholder.top,
      width: placeholder.width,
      height: placeholder.height,
    })
    .png()
    .toBuffer();

  const finalDecoded = await decodeQrFromPngBuffer(region);
  console.log("  final region decode:", finalDecoded);
  if (finalDecoded !== QR_URL) {
    throw new Error(
      `Final composite QR decode mismatch: expected ${QR_URL}, got ${finalDecoded}`
    );
  }

  for (const name of outputNames) {
    const out = path.join(PRINT_DIR, name);
    fs.writeFileSync(out, composed);
    console.log("  wrote:", out);
  }

  // Debug crop of just the QR area for visual check
  const debugName = inputName.replace(/\.png$/, "-qr-region.png");
  fs.writeFileSync(path.join(PRINT_DIR, debugName), region);
  console.log("  debug region:", path.join(PRINT_DIR, debugName));

  return { placeholder, inset, qrSize, decoded: finalDecoded };
}

async function main() {
  const v1 = await compositeInsert("lab-handling-insert-v1.png", [
    "lab-handling-insert-v1-with-qr.png",
    "lab-handling-insert-final.png",
  ]);

  try {
    await compositeInsert("lab-handling-insert-v2.png", [
      "lab-handling-insert-v2-with-qr.png",
    ]);
  } catch (err) {
    console.warn("\nv2 skipped:", err.message);
  }

  console.log("\nDone.");
  console.log("Confirmed QR URL:", QR_URL);
  console.log(
    "Print tip: print at ~5×7 in for a 5.9×7 mailer (leave quiet zone; avoid glossy glare)."
  );
  console.log("v1 inset:", v1.inset, "px; QR size:", v1.qrSize, "px");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
