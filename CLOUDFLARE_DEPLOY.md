# Cloudflare Pages deployment

This project is prepared for Cloudflare Pages.

## Cloudflare build settings

Use these settings in Cloudflare Pages:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
Node version: 20 or newer
```

The repository includes `wrangler.toml` with:

```toml
pages_build_output_dir = "./dist"
compatibility_flags = ["nodejs_compat"]
```

## Required environment variables

Add these variables in Cloudflare Pages > Settings > Environment variables for both Production and Preview:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Do not commit real Supabase keys into the repository.

## Why these variables are required

Vite exposes variables to browser code only when their names start with `VITE_`. The app creates the Supabase client at runtime, so missing values will cause the app to show a server/client error.

## If Cloudflare still fails

Check the build log for the output directory. If `vite build` produces `.output/public` instead of `dist`, change both Cloudflare's build output directory and `wrangler.toml` to:

```toml
pages_build_output_dir = "./.output/public"
```
