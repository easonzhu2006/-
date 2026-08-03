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

Do not place private API keys directly in `index.html`. If AI or dictionary APIs require secrets later, put them behind a small backend proxy such as Vercel Functions, Netlify Functions, or Cloudflare Workers.
