# Peptide Protocol content archive

Editable copy archive for the Peptide Protocol website. Canonical structured data lives in `src/content/`.

**Domain:** peptideprotocolau.io  
**Handle:** @peptideprotocolau  
**Market:** Australia  

All products are for research purposes only. Not for human consumption. Not a medicine, supplement, or cosmetic. Laboratory and in vitro use only.

---

## Social

### Instagram / TikTok bio
```
Research peptides for Australian laboratories. Documented purity. Express dispatch. Research use only. Not for human consumption.
peptideprotocolau.io
```

### Link-in-bio
1. Shop all research materials → https://peptideprotocolau.io/shop
2. Quality & testing / COA requests → https://peptideprotocolau.io/quality
3. Shipping information → https://peptideprotocolau.io/shipping
4. Contact support → https://peptideprotocolau.io/contact
5. Research use disclaimer → https://peptideprotocolau.io/disclaimer

---

## Sitemap

- `/` Home
- `/shop` All products
- `/shop/metabolic` Metabolic research
- `/shop/growth-hormone` Growth hormone pathway research
- `/shop/tissue-recovery` Tissue & recovery research
- `/shop/cellular-mitochondrial` Cellular & mitochondrial research
- `/shop/other-compounds` Other research compounds
- `/products/[slug]` × 16 products (8 singles + 8 kits)
- `/stack-finder` Find your ideal peptide stack (adaptive questionnaire)
- `/quality` Quality & Testing
- `/about` About
- `/faq` FAQ
- `/shipping` Shipping
- `/returns` Returns
- `/contact` Contact
- `/terms` Terms of Sale
- `/privacy` Privacy Policy
- `/disclaimer` Research Use Disclaimer

---

## Data sources

| Content | Path |
|---|---|
| Products (16 active) | `src/content/products.ts` |
| Categories (5) | `src/content/categories.ts` |
| Info pages | `src/content/pages.ts` |
| Home + social + nav | `src/content/site.ts` |
| Stack finder tree (human-readable) | `content/stack-finder-tree.md` |
| Stack finder questions | `src/content/stackFinder.ts` |

Edit those TypeScript modules to update live site copy. This markdown file is a human-readable index.

---

## Product slugs (active catalogue)

### Singles
1. bpc-157-10mg — BPC-157 (10mg) — $69.99 AUD — BC10
2. ipamorelin-10mg — Ipamorelin (10mg) — $60.00 AUD — IP10
3. cjc-1295-no-dac-10mg — CJC-1295 without DAC (10mg) — $99.99 AUD — CP10
4. tb-500-10mg — TB-500 (10mg) — $118.95 AUD — BT10
5. pt-141-10mg — PT-141 (10mg) — $89.95 AUD — P41
6. ghk-cu-50mg — GHK-Cu (50mg) — $64.95 AUD — CU50
7. retatrutide-20mg — Retatrutide (20mg) — $199.99 AUD — RT20
8. retatrutide-60mg — Retatrutide (60mg) — $479.95 AUD — RT60

### 10-vial kits
9. bpc-157-10mg-kit-10 — $594.95 AUD
10. ipamorelin-10mg-kit-10 — $509.95 AUD
11. cjc-1295-no-dac-10mg-kit-10 — $849.95 AUD
12. tb-500-10mg-kit-10 — $1010.95 AUD
13. pt-141-10mg-kit-10 — $764.95 AUD
14. ghk-cu-50mg-kit-10 — $551.95 AUD
15. retatrutide-20mg-kit-10 — $1699.95 AUD
16. retatrutide-60mg-kit-10 — $4079.95 AUD

BAC Water and other former SKUs are hidden from the active catalogue (image assets retained).

---

## SEO titles (absolute)

See `metaTitle` / `metaDescription` fields on each product, category, and page object in `src/content/`.
