This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Describe the Scene (env vars)

The `/3d-world/describe-scene` drill records a spoken description, transcribes
it, and scores it with OpenAI. Add these to `.env.local` (never commit real
keys — `.env*` is gitignored):

```bash
OPENAI_API_KEY=sk-...            # required; server-only, never sent to the client
OPENAI_TRANSCRIBE_MODEL=gpt-4o-transcribe   # optional; default favours accuracy
OPENAI_SCORING_MODEL=gpt-4o      # optional; must support strict json_schema outputs
```

The page itself stays statically prerendered; `/api/transcribe` and
`/api/score` are dynamic server routes that hold the key.

## Alcohol Tracker (env vars)

The `/alcohol-tracker` feature logs drinking occasions to MongoDB. Add these to
`.env.local` (never commit real values — `.env*` is gitignored):

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.example.mongodb.net   # required
MONGODB_DB=alcohol_tracker                                        # optional; default "alcohol_tracker"
```

The page is client-rendered; `/api/alcohol` (list/create) and
`/api/alcohol/[id]` (delete) are dynamic server routes that hold the
connection and never expose it to the browser.

The same `MONGODB_URI` / `MONGODB_DB` also back **Dini's Water Quest**
(`/dini-water-game`), which persists its game state to the `water_state`
collection via `/api/water` (GET to load, PUT to save). No extra config is
needed beyond the variables above.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
