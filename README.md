# Vocabulary & Corpus

An offline-first English learning MVP for contextual vocabulary practice, corpus collection, dictionary-style explanations, and asset-based review.

## Preview Locally

Open `index.html` directly in Chrome or Edge. No Node.js server is required for the current single-file version.

## Publish With GitHub Pages

1. Create a new GitHub repository.
2. Upload or push this project to the repository root.
3. Open repository `Settings` -> `Pages`.
4. Choose `Deploy from a branch`.
5. Select branch `main` and folder `/root`.
6. Save and wait for GitHub to generate the public URL.

The public URL will usually look like:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

## Notes

Do not place private API keys directly in `index.html` or `localStorage` for production.

## Cloudflare Pages + Worker API
This project includes a Cloudflare Pages Function at `functions/api/generate-passage.js`. Pages Functions run on Cloudflare's Worker runtime and are reached by the same-origin URL `/api/generate-passage`.

1. Push the project, including the `functions/` directory, to GitHub.
2. In Cloudflare Dashboard, open **Workers & Pages**, select the Pages project, then **Settings -> Variables and Secrets**.
3. Add an encrypted secret named `OPENAI_API_KEY`. Add `OPENAI_MODEL` as a normal variable or keep the default `gpt-4o-mini`.
4. Redeploy the Pages project.
5. The frontend already calls `/api/generate-passage` by default.

For local Pages Functions testing, copy `.dev.vars.example` to an untracked `.dev.vars` and add the secret. Never commit `.dev.vars`.
The current login and asset data are still browser-local `localStorage` data. A production account system needs a database and real authentication later.
