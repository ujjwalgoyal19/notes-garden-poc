# Notes Garden

A notes garden proof of concept. Click to plant a note. Jev, an LLM judge, picks a plant species for it
and decides which existing notes it connects to. Those connections grow as roots between the plants.

Short notes become sprouts, mid-length notes become a species (flower, fern, cactus or mushroom),
and long notes become trees.

> Status: proof of concept. It is being upgraded from an SVG/emoji toy to a 2D PixiJS garden in small PRs.
> See [`PLAN.md`](PLAN.md) for the plan and [`TRACKER.md`](TRACKER.md) for progress.

## Stack

Vite 7, React 19, plain JS (no TypeScript). Notes are stored in the browser.

## Run it

```sh
npm install
cp .env.example .env
npm run dev
```

With the default `VITE_MOCK=1` a fake judge (word overlap) is used, so no API key is needed.

To use the real Jev, set `VITE_MOCK=0` and put your OpenRouter key in `.env` as `OPENROUTER_API_KEY`.
The key stays server-side: the Vite dev proxy adds it, and it is never sent to the browser.
Never commit `.env`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |

## Limits

- The Jev proxy only exists in the Vite dev server. A deployed build needs a serverless function for `/api/decisions`.
- A new note is compared with the 150 most recent notes only.

## License

[MIT](LICENSE)
