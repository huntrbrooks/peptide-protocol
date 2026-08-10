# Vinyl Label / Sticker Purchase Order Brief

**The Protocol**  
Website: [peptideprotocolau.io](https://peptideprotocolau.io)  
Document purpose: Quote request for professional vinyl labels and packing stickers  
Date prepared: 24 July 2026  
**Updated:** 7 August 2026 — 3 ml vial wraps corrected to **38 × 15 mm**; BAC water 10 ml kept at **50 × 30 mm**  
Source of truth (sizes): `public/labels/README.md`, `scripts/generate-vial-labels-38x15.mjs`

---

## 1. Company / brand

| Field | Detail |
|-------|--------|
| Brand | The Protocol |
| Domain | peptideprotocolau.io |
| Product context | Research-use peptide packaging (vial wraps, kit lids, packing stickers) |
| Artwork style | Full-colour brand labels (logo, colour name band, strength, research footer) — **not** thermal black-only |

Please quote for **outdoor/indoor-capable vinyl** suitable for cold-chain / lab packaging handling (fridge/freezer exposure possible). Permanent adhesive preferred.

---

## 2. Order summary (totals)

| Product type | Finished size | Qty | Artwork | Material notes (recommended) |
|--------------|---------------|----:|---------|------------------------------|
| Kit lid labels | **60 × 40 mm** (rectangle) | **30** | 8 SKU designs | Gloss or matte vinyl; permanent adhesive; die-cut rectangle (optional light corner radius OK) |
| Peptide vial wraps (3 ml) | **38 × 15 mm** (rectangle) | **300** | 8 SKU designs | Gloss or matte vinyl; permanent adhesive; die-cut rectangle; wrap-friendly flexible face stock |
| BAC water vial wraps (10 ml) | **50 × 30 mm** (rectangle) | *(quote qty)* | 1 design | Same material as peptide wraps; **do not** die-cut at 38×15 |
| Packing stickers | **Ø 40 mm** (circle) — recommended | **300** | 1 universal design | Gloss or matte vinyl; permanent adhesive; die-cut circle |

### Packing sticker size recommendation

Repo includes both **Ø 30 mm** and **Ø 40 mm** universal circle artworks.  
**Please quote Ø 40 mm** as the primary packing sticker (better kit-lid / packing visibility).  
Optional alternate line: same artwork at Ø 30 mm if you prefer a dual-size quote.

---

## 3. Line items — kit lid labels (60 × 40 mm)

**1 kit label per kit.** Total = **30**.

| Stock code | Product | Kits | Kit labels qty | Artwork file |
|------------|---------|-----:|---------------:|--------------|
| BC10 | BPC-157 10 mg | 5 | 5 | `kit/bc10-kit-label.png` |
| IP10 | Ipamorelin 10 mg | 4 | 4 | `kit/ip10-kit-label.png` |
| CP10 | CJC-1295 (without DAC) 10 mg | 2 | 2 | `kit/cp10-kit-label.png` |
| BT10 | TB-500 (Thymosin Beta-4) 10 mg | 3 | 3 | `kit/bt10-kit-label.png` |
| P41 | PT-141 (Bremelanotide) 10 mg | 5 | 5 | `kit/p41-kit-label.png` |
| CU50 | GHK-Cu (Copper Peptide) 50 mg | 5 | 5 | `kit/cu50-kit-label.png` |
| RT20 | Retatrutide 20 mg | 5 | 5 | `kit/rt20-kit-label.png` |
| RT60 | Retatrutide 60 mg | 1 | 1 | `kit/rt60-kit-label.png` |
| **TOTAL** | | **30** | **30** | |

---

## 4. Line items — peptide vial wrap labels (38 × 15 mm) — 3 ml vials

**1 vial label per vial.** Total = **300** (1 kit = 10 vials).

| Stock code | Product | Kits | Vials / labels qty | Artwork file (colour master) |
|------------|---------|-----:|-------------------:|------------------------------|
| BC10 | BPC-157 10 mg | 5 | 50 | `color-masters-38x15/bpc-157-10mg.png` |
| IP10 | Ipamorelin 10 mg | 4 | 40 | `color-masters-38x15/ipamorelin-10mg.png` |
| CP10 | CJC-1295 (without DAC) 10 mg | 2 | 20 | `color-masters-38x15/cjc-1295-no-dac-10mg.png` |
| BT10 | TB-500 (Thymosin Beta-4) 10 mg | 3 | 30 | `color-masters-38x15/tb-500-10mg.png` |
| P41 | PT-141 (Bremelanotide) 10 mg | 5 | 50 | `color-masters-38x15/pt-141-10mg.png` |
| CU50 | GHK-Cu (Copper Peptide) 50 mg | 5 | 50 | `color-masters-38x15/ghk-cu-50mg.png` |
| RT20 | Retatrutide 20 mg | 5 | 50 | `color-masters-38x15/retatrutide-20mg.png` |
| RT60 | Retatrutide 60 mg | 1 | 10 | `color-masters-38x15/retatrutide-60mg.png` |
| **TOTAL** | | **30** | **300** | |

> **Important:** Previous PO used **50 × 30 mm** for these peptide wraps — that size is **too large for 3 ml vials**. Reprint at **38 × 15 mm** using the files above.

---

## 5. Line item — BAC water vial wrap (50 × 30 mm) — 10 ml vial

Keep the **original** finished size (same as the first vinyl run’s peptide wraps).

| Product | Finished size | Artwork file |
|---------|---------------|--------------|
| BAC WATER / Bacteriostatic Water 10 ml | **50 × 30 mm** | `color-masters/bacteriostatic-water-10ml.png` (2000×1200 px) |

Please quote quantity separately (not included in the 300 peptide wraps).

---

## 6. Packing stickers — universal (not per-SKU)

| Item | Detail |
|------|--------|
| Quantity | **300** |
| Design | **One** universal brand sticker (no peptide / SKU name) |
| Content | Logo + “The Protocol” + peptideprotocolau.io + RESEARCH USE ONLY |
| Recommended size | **Ø 40 mm** |
| Artwork (recommended) | `stickers/peptide-protocol-universal-circle-40mm.png` |
| Alternate artwork | `stickers/peptide-protocol-universal-circle-30mm.png` (Ø 30 mm) |

---

## 7. Artwork status (print-ready files on hand)

All paths relative to `public/labels/` in the The Protocol repo.

| Type | Finished size | Pixel size | Approx. DPI | Format | Folder |
|------|---------------|------------|-------------|--------|--------|
| Peptide vial colour masters | **38 × 15 mm** | **3040 × 1200** px | ~2032 DPI (OpenArt 4K) | PNG, RGB | `color-masters-38x15/{slug}.png` |
| BAC water colour master | **50 × 30 mm** | **2000 × 1200** px | ~1016 DPI | PNG, RGB | `color-masters/bacteriostatic-water-10ml.png` |
| Kit lid labels | 60 × 40 mm | **709 × 472** px | **300 DPI** | PNG, RGB | `kit/{code}-kit-label.png` |
| Circle sticker Ø30 | Ø 30 mm | **354 × 354** px | **300 DPI** | PNG, RGB | `stickers/…-30mm.png` |
| Circle sticker Ø40 | Ø 40 mm | **472 × 472** px | **300 DPI** | PNG, RGB | `stickers/…-40mm.png` |

**Do not use** `niimbot-thermal/` or `niimbot-thermal-38x15/` for this vinyl quote — those are thermal proofs only.  
**Do not use** legacy `color-masters/{peptide-slug}.png` (50×30) for 3 ml peptide wraps.

Regenerate 38×15 peptide wraps from source if needed:

```bash
node scripts/generate-vial-labels-38x15.mjs
```

---

## 8. Specs for printers / suppliers

### Finished sizes (die-cut)

| Item | W × H / diameter |
|------|------------------|
| Peptide vial wrap (3 ml) | **38 mm × 15 mm** |
| BAC water vial wrap (10 ml) | **50 mm × 30 mm** |
| Kit lid | **60 mm × 40 mm** |
| Packing sticker | **Ø 40 mm** (quote primary) |

### Bleed / margins

| Spec | Recommendation |
|------|----------------|
| Bleed | **+2 mm** all sides (or all around for circles) if your process requires it — please advise if artwork must be remade with bleed |
| Safe margin | Keep critical text/logo ≥ **2 mm** from trim edge |
| Corner radius | Supplier standard OK for rectangles unless otherwise specified |

### Colour & files

| Spec | Detail |
|------|--------|
| Source files | PNG (RGB) as supplied |
| Preferred production colour | Convert to **CMYK** in your RIP / prepress (or quote RGB→CMYK conversion) |
| Soft-proof | Cap accent colours are brand-critical — please soft-proof / drawdown if possible |
| Delivery formats we can supply | PNG now; PDF vector/export available on request if needed for plate/RIP |

### Material (please quote options)

1. **White vinyl** face stock (indoor/outdoor grade)  
2. **Permanent** acrylic adhesive  
3. Finish: quote **matte** and **gloss** if both available (matte preferred for less glare on vial wraps; gloss OK for stickers)  
4. Liner: standard release liner; die-cut on sheets or rolls — **please state sheet vs roll** and min order per SKU  

---

## 9. Quote request (please include)

Please quote in **AUD**, itemised where possible:

| Quote line | Notes |
|------------|-------|
| Unit price per label/sticker | By type (kit / 38×15 peptide / 50×30 BAC / packing) and/or by SKU if priced differently |
| Setup / plate / die charges | New die for **38×15** if not already tooled; existing **50×30** die for BAC |
| Colour print surcharge | If applicable |
| Shipping to Australia | Include method / ETA estimate |
| Lead time | Production + dispatch |
| Minimum order | Per SKU or overall |
| Optional **+5% overrun** | Allowance for waste/misprints — quote as optional add-on |

### Delivery / questions for supplier

- Confirm die sizes match **38×15 mm** (peptides), **50×30 mm** (BAC), **60×40 mm** (kit), and **Ø 40 mm**.  
- Confirm whether you need artwork with **2 mm bleed** rebuilt, or can work from trim-size PNGs.  
- Preferred file handoff: email / Dropbox / USB — we can supply a zip of `color-masters-38x15/`, `color-masters/bacteriostatic-water-10ml.png`, `kit/`, and `stickers/`.  
- Sample / proof: digital proof required; physical proof preferred before full run if cost is modest.

---

## 10. Contact / next step

Please reply with:

1. Unit + setup + shipping (AUD)  
2. Lead time  
3. Material finish options (matte vs gloss)  
4. Confirmation of finished sizes and die method  

Artwork zip available on request from The Protocol (`public/labels/`).

---

*Internal note: 3 ml wraps verified against `scripts/generate-vial-labels-38x15.mjs`. BAC water master retained at 50×30. Thermal Niimbot assets are out of scope for this vinyl purchase order.*
