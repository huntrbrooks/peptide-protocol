# The Protocol content archive

Editable copy archive for the The Protocol website. Canonical structured data lives in `src/content/`.

**Domain:** theprotocolau.com  
**Handle:** @theprotocol.au  
**Market:** Australia  

All products are for research purposes only. Not for human consumption. Not a medicine, supplement, or cosmetic. Laboratory and in vitro use only.

---

## Social

### Instagram / TikTok bio
```
Research peptides for Australian laboratories. Documented purity. Express dispatch. Research use only. Not for human consumption.
theprotocolau.com
```

### Link-in-bio
1. Shop all research materials → https://theprotocolau.com/shop
2. Quality & testing / COA requests → https://theprotocolau.com/quality
3. Shipping information → https://theprotocolau.com/shipping
4. Contact support → https://theprotocolau.com/contact
5. Research use disclaimer → https://theprotocolau.com/disclaimer

---

## Sitemap

- `/` Home
- `/shop` All products
- `/shop/metabolic` Metabolic research
- `/shop/growth-hormone` Growth hormone pathway research
- `/shop/tissue-recovery` Tissue & recovery research
- `/shop/cellular-mitochondrial` Cellular & mitochondrial research
- `/shop/other-compounds` Other research compounds
- `/products/[slug]` × 18 products (10 singles + 8 kits)
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
| Products (18 active) | `src/content/products.ts` |
| Categories (6) | `src/content/categories.ts` |
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
9. glow-up-80mg — Glow Up / KLOW80 (80mg) — $239.95 AUD — KLOW80
10. bacteriostatic-water-10ml — BAC Water (10mL) — $19.99 AUD — BAC10

### 10-vial kits
11. bpc-157-10mg-kit-10 — $594.95 AUD
12. ipamorelin-10mg-kit-10 — $509.95 AUD
13. cjc-1295-no-dac-10mg-kit-10 — $849.95 AUD
14. tb-500-10mg-kit-10 — $1010.95 AUD
15. pt-141-10mg-kit-10 — $764.95 AUD
16. ghk-cu-50mg-kit-10 — $551.95 AUD
17. retatrutide-20mg-kit-10 — $1699.95 AUD
18. retatrutide-60mg-kit-10 — $4079.95 AUD

---

## SEO titles (absolute)

See `metaTitle` / `metaDescription` fields on each product, category, and page object in `src/content/`.
