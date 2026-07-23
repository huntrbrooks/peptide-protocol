# Niimbot / vial-matched labels

## Why these didn't match the product photos before

The first pass was a **plain text thermal layout**. Your product photos use the full Peptide Protocol vial brand system (DNA mark, teal name band, strength box, research footer).

**Niimbot is still a valid printer for vials** — but standard Niimbot units are **direct thermal (black only)**. They cannot print teal, gradients, or soft watermarks in color. The teal bands become solid black; the logo becomes a B&W mark.

- Use `niimbot-thermal/` (or root `*.png`) in the NIIMBOT app.
- Use `color-masters/` if you print on a **color** label printer / inkjet for photo-matching teal labels.

## Spec (assumption: B21 / B1)

| Item | Value |
|------|-------|
| Size | 50 × 30 mm |
| DPI | 203 → 400 × 240 px |
| Thermal files | 1-bit PNG |
| Color masters | PNG ~2000×1200 |
| Model | openai/gpt-image-2 via OpenRouter |

## Files

### Thermal (Niimbot)
- `niimbot-thermal/bacteriostatic-water-10ml.png`
- `niimbot-thermal/bpc-157-10mg.png`
- `niimbot-thermal/cjc-1295-dac-5mg.png`
- `niimbot-thermal/cjc-1295-no-dac-10mg.png`
- `niimbot-thermal/dsip-5mg.png`
- `niimbot-thermal/epitalon-10mg.png`
- `niimbot-thermal/ghk-cu-100mg.png`
- `niimbot-thermal/hcg-5000iu.png`
- `niimbot-thermal/ipamorelin-10mg.png`
- `niimbot-thermal/melanotan-ii-10mg.png`
- `niimbot-thermal/mots-c-10mg.png`
- `niimbot-thermal/retatrutide-10mg.png`
- `niimbot-thermal/semax-11mg.png`
- `niimbot-thermal/sermorelin-10mg.png`
- `niimbot-thermal/tb-500-10mg.png`
- `niimbot-thermal/tesamorelin-10mg.png`
- `niimbot-thermal/tirzepatide-10mg.png`

### Color masters
- `color-masters/bacteriostatic-water-10ml.png`
- `color-masters/bpc-157-10mg.png`
- `color-masters/cjc-1295-dac-5mg.png`
- `color-masters/cjc-1295-no-dac-10mg.png`
- `color-masters/dsip-5mg.png`
- `color-masters/epitalon-10mg.png`
- `color-masters/ghk-cu-100mg.png`
- `color-masters/hcg-5000iu.png`
- `color-masters/ipamorelin-10mg.png`
- `color-masters/melanotan-ii-10mg.png`
- `color-masters/mots-c-10mg.png`
- `color-masters/retatrutide-10mg.png`
- `color-masters/semax-11mg.png`
- `color-masters/sermorelin-10mg.png`
- `color-masters/tb-500-10mg.png`
- `color-masters/tesamorelin-10mg.png`
- `color-masters/tirzepatide-10mg.png`

### Proof
- `PROOF-SHEET-all-labels.png`

## Print (Niimbot app)

1. Load **50×30 mm** white thermal labels.
2. NIIMBOT app → connect printer → new label at that size.
3. Import a file from `niimbot-thermal/` → stretch edge-to-edge.
4. Test print; raise density if light.
5. For teal/color matching the website photos, print `color-masters/` on a color label printer instead.

## Regenerate

```bash
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --force
node --env-file=.env.local scripts/generate-niimbot-labels-ai.mjs --only=bpc-157-10mg --force
```
