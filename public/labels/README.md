# Niimbot / vial-matched labels

## Why these didn't match the product photos before

The first pass was a **plain text thermal layout**. Colour masters use **THE PROTOCOL** centered text-logo branding (small THE between rules above PROTOCOL — no DNA circle in the header), plus accent name band, strength box, optional faint DNA watermark in the body, and research footer.

**Niimbot is still a valid printer for vials** — but standard Niimbot units are **direct thermal (black only)**. They cannot print colour bands, gradients, or soft watermarks. Colour bands become solid black; the logo becomes a B&W mark.

- Use `niimbot-thermal/` (or root `*.png`) in the NIIMBOT app.
- Use `color-masters/` if you print on a **color** label printer / inkjet for photo-matching labels.
- Use `kit/` for 60×40 mm kit-lid labels (cap-colour matched).
- Use `stickers/` for universal circular packaging stickers (no peptide names).

## Spec

| Item | Value |
|------|-------|
| **3 ml vial wrap** | **38 × 15 mm** → colour `color-masters-38x15/` **3040×1200** (OpenArt 4K text-logo masters); thermal `niimbot-thermal-38x15/` 304×120 @ 203 DPI |
| **10 ml vial wrap** (BAC water) | **50 × 30 mm** → `color-masters/bacteriostatic-water-10ml.png` 2000×1200 |
| Legacy 50 × 30 peptide masters | Still in `color-masters/` (OpenArt) — **too large for 3 ml vials**; keep for reference / 10 ml only |
| Kit lid | 60 × 40 mm @ 300 DPI → 709 × 472 px |
| Circle stickers | Ø30 mm → 354×354; Ø40 mm → 472×472 @ 300 DPI |
| Thermal files | 1-bit PNG |

## Original-stock SKUs (cap-matched)

Generated via `node scripts/generate-stock-sku-labels.mjs` (SVG + sharp). Accent colours match flip-top caps:

| Stock | Slug | Cap |
|-------|------|-----|
| BC10 | bpc-157-10mg | dark blue |
| IP10 | ipamorelin-10mg | solid red |
| CP10 | cjc-1295-no-dac-10mg | yellow |
| BT10 | tb-500-10mg | solid red |
| P41 | pt-141-10mg | solid red |
| CU50 | ghk-cu-50mg | dark blue |
| RT20 | retatrutide-20mg | pink |
| RT60 | retatrutide-60mg | solid red |

### Outputs for stock SKUs
- `color-masters-38x15/{slug}.png` — **use these for 3 ml vial vinyl / colour print**
- `niimbot-thermal-38x15/{slug}.png` — Niimbot at 38×15 mm
- `color-masters/{slug}.png` — legacy 50×30 OpenArt masters (not for 3 ml)
- `niimbot-thermal/{slug}.png` — legacy 50×30 thermal
- `kit/{stockCode}-kit-label.png` (e.g. `bc10-kit-label.png`)
- `stickers/peptide-protocol-universal-circle-30mm.png`
- `stickers/peptide-protocol-universal-circle-40mm.png`
- `mockups/kit-box-with-sticker.png`

### BAC water (10 ml)
- `color-masters/bacteriostatic-water-10ml.png` — **50 × 30 mm** (original size; do not resize to 38×15)

Legacy catalogue SKUs (previous AI pass) remain under `color-masters/` / `niimbot-thermal/` with older teal branding.

### Proof
- `PROOF-SHEET-all-labels.png` (legacy sheet; regenerate if needed for new SKUs)

## Print (Niimbot app)

1. For **3 ml vials**: load **38×15 mm** white thermal labels.
2. NIIMBOT app → connect printer → new label at that size.
3. Import from `niimbot-thermal-38x15/` → stretch edge-to-edge.
4. For **BAC water (10 ml)**: use **50×30 mm** stock + `niimbot-thermal/bacteriostatic-water-10ml.png` (or colour master).
5. Test print; raise density if light.
6. Colour vinyl: print `color-masters-38x15/` at **38×15 mm**; BAC at **50×30** from `color-masters/`.
7. Kit lids: print `kit/*-kit-label.png` at **60×40 mm**.
8. Circle stickers: print at physical Ø30 / Ø40 mm from `stickers/`.

## Regenerate

```bash
# 3 ml vial wraps @ 38×15 mm (does not overwrite 50×30 OpenArt masters)
node scripts/generate-vial-labels-38x15.mjs

# Cap-matched stock SKUs @ legacy 50×30 + kit lids + stickers
# CAUTION: overwrites color-masters/ for the 8 stock SKUs with flatter SVG art
node scripts/generate-stock-sku-labels.mjs

# Legacy AI colour masters (OpenRouter)
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --force
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --only=bpc-157-10mg --force
```
