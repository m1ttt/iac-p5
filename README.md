# Practica 5 - Cloudflare Worker with GitHub Actions

DevSecOps / Infrastructure as Code - ITESO.

Cloudflare Worker created with the Cloudflare CLI (`npm create cloudflare@latest`,
Hello World template, TypeScript). GitHub Actions builds the project, runs the
unit tests and deploys the Worker to Cloudflare on every push to `main`.

Live: https://iac-p5.mike-iteso.workers.dev

The Worker serves a landing page for a cat shelter. Every cat illustration is
inline SVG, so the page loads no external asset.

## Routes

| Route | Response |
| --- | --- |
| `GET /` | Landing page of the shelter |
| `GET /api/gatos` | The cat list in JSON |
| `GET /api/health` | Worker status in JSON |
| Any other path | 404 in JSON |

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
| `npm run test -- run` | Run the unit tests once |
| `npm run deploy` | Deploy the Worker from the local machine |

## Pipeline

The deploy runs on Cloudflare Workers Builds. The repository `m1ttt/iac-p5` is
connected to the Worker in the Cloudflare dashboard, branch `main`. On every
push Cloudflare installs the dependencies, runs `npm run test -- run` as the
build command and then `npx wrangler deploy`. A failed test stops the deploy.

`.github/workflows/deploy.yml` runs the same checks on GitHub on every push to
`main`:

1. `actions/checkout@v4` - get the code.
2. `actions/setup-node@v4` - install Node.js 22.
3. `npm ci` - install the dependencies from `package-lock.json`.
4. `npm run test -- run` - run the unit tests.

## Worker configuration

`wrangler.jsonc` holds the Worker name, the entry point and the compatibility
date. Observability is enabled, so the request logs are visible in the
Cloudflare dashboard.
