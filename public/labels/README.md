# Niimbot / vial-matched labels

## Why these didn't match the product photos before

The first pass was a **plain text thermal layout**. Your product photos use the full Peptide Protocol vial brand system (DNA mark, colour name band, strength box, research footer).

**Niimbot is still a valid printer for vials** — but standard Niimbot units are **direct thermal (black only)**. They cannot print colour bands, gradients, or soft watermarks. Colour bands become solid black; the logo becomes a B&W mark.

- Use `niimbot-thermal/` (or root `*.png`) in the NIIMBOT app.
- Use `color-masters/` if you print on a **color** label printer / inkjet for photo-matching labels.
- Use `kit/` for 60×40 mm kit-lid labels (cap-colour matched).
- Use `stickers/` for universal circular packaging stickers (no peptide names).

## Spec (assumption: B21 / B1)

| Item | Value |
|------|-------|
| Vial wrap size | 50 × 30 mm |
| Thermal DPI | 203 → 400 × 240 px |
| Color masters | PNG 2000×1200 |
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
- `color-masters/{slug}.png`
- `niimbot-thermal/{slug}.png`
- `kit/{stockCode}-kit-label.png` (e.g. `bc10-kit-label.png`)
- `stickers/peptide-protocol-universal-circle-30mm.png`
- `stickers/peptide-protocol-universal-circle-40mm.png`
- `mockups/kit-box-with-sticker.png`

Legacy catalogue SKUs (previous AI pass) remain under `color-masters/` / `niimbot-thermal/` with older teal branding.

### Proof
- `PROOF-SHEET-all-labels.png` (legacy sheet; regenerate if needed for new SKUs)

## Print (Niimbot app)

1. Load **50×30 mm** white thermal labels.
2. NIIMBOT app → connect printer → new label at that size.
3. Import a file from `niimbot-thermal/` → stretch edge-to-edge.
4. Test print; raise density if light.
5. For colour matching the website photos, print `color-masters/` on a color label printer instead.
6. Kit lids: print `kit/*-kit-label.png` at **60×40 mm**.
7. Circle stickers: print at physical Ø30 / Ø40 mm from `stickers/`.

## Regenerate

```bash
# Cap-matched stock SKUs (labels + stickers + kit lids)
node scripts/generate-stock-sku-labels.mjs

# Legacy AI colour masters (OpenRouter)
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --force
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --only=bpc-157-10mg --force
```
