# Studio placeholder

Cloudflare Worker for https://penantumbra.com/, independent of the GitHub Pages tech blog at https://penantumbra.github.io/.

The module serves a small placeholder and a blog link. This directory is excluded from Jekyll output. Deploy from this directory with Wrangler, or upload `worker.mjs` through the Cloudflare API with `main_module: worker.mjs` and the configuration in `wrangler.jsonc`.

Do not restore the blog repository's old `CNAME` file or bind penantumbra.com to GitHub Pages. Preserve the zone's email and verification DNS records when changing website hosting.
