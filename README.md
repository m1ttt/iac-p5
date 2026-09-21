# Practica 5 - Cloudflare Worker with GitHub Actions

DevSecOps / Infrastructure as Code - ITESO.

Cloudflare Worker created with the Cloudflare CLI (`npm create cloudflare@latest`,
Hello World template, TypeScript). GitHub Actions builds the project, runs the
unit tests and deploys the Worker to Cloudflare on every push to `main`.

## Stack

- Cloudflare Workers (`wrangler` v4)
- TypeScript
- Vitest with `@cloudflare/vitest-plugin`
- GitHub Actions (`cloudflare/wrangler-action@v3`)

## Local commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the local dev server on http://localhost:8787 |
| `npm run test:ci` | Run the unit tests once |
| `npm run deploy` | Deploy the Worker from the local machine |

## Pipeline

`.github/workflows/deploy.yml` runs on every push to `main`:

1. `actions/checkout@v4` - get the code.
2. `actions/setup-node@v4` - install Node.js 22.
3. `npm ci` - install the dependencies from `package-lock.json`.
4. `npm run test:ci` - run the unit tests. A failed test stops the deploy.
5. `cloudflare/wrangler-action@v3` - deploy the Worker to Cloudflare.

## Required GitHub secrets

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token created with the "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from the Cloudflare dashboard |

## Worker configuration

`wrangler.jsonc` holds the Worker name, the entry point and the compatibility
date. Observability is enabled, so the request logs are visible in the
Cloudflare dashboard.
