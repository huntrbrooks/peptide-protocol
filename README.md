# Peptide Protocol

Australian research peptide catalogue site for **peptideprotocolau.io**.

Research materials only. Not for human consumption. Not a medicine, supplement, or cosmetic. Laboratory and in vitro use only.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4

## Setup

```bash
npm install
cp .env.example .env.local
# Add your OpenRouter key to .env.local (never commit it)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Content

- Live copy: `src/content/` (`products.ts`, `categories.ts`, `pages.ts`, `site.ts`)
- Human index: `CONTENT.md`
- Prices are AUD catalogue placeholders. Cart is a launch stub (enquiry-oriented).

## Image generation

Assets are generated with OpenRouter model `openai/gpt-image-2`:

```bash
npm run generate:images
```

Options:

```bash
node --env-file=.env.local scripts/generate-images.mjs --only=hero
node --env-file=.env.local scripts/generate-images.mjs --only=products --force
```

Images write to `public/images/`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run generate:images` | OpenRouter image generation |

## Compliance

Every product page and the site footer include the research-use disclaimer. See `/disclaimer` for the full statement.
