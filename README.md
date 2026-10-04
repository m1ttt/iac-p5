# Practica 7 - Pipeline with UAT

DevSecOps / Infrastructure as Code - ITESO.

Cloudflare Worker created with the Cloudflare CLI (`npm create cloudflare@latest`,
Hello World template, TypeScript). GitHub Actions builds the Worker, runs the
unit tests with a coverage report, publishes the bundle as an artifact and
deploys it to two separate Cloudflare Workers: DEV and PROD.

| Environment | Worker | URL |
| --- | --- | --- |
| DEV | `iac-p5` | https://iac-p5.mike-iteso.workers.dev |
| PROD | `iac-p5-prod` | https://iac-p5-prod.mike-iteso.workers.dev |

The Worker serves a landing page for a cat shelter. Every cat illustration is
inline SVG, so the page loads no external asset.

## Routes

| Route | Response |
| --- | --- |
| `GET /` | Landing page of the shelter |
| `GET /api/gatos` | The cat list in JSON |
| `GET /api/health` | Worker status and environment in JSON |
| `POST /api/adopciones` | Adoption request. 201 when valid, 400 with the errors when not |
| Any other path | 404 in JSON |

`POST /api/adopciones` takes a JSON body:

```json
{ "nombre": "Ana López", "email": "ana@iteso.mx", "telefono": "33 1234 5678", "gato": "Michi", "mensaje": "Tengo un patio" }
```

`telefono` and `mensaje` are optional.

## Unit tests

`src/validators.ts` holds the business rules of the adoption form. The
functions have no I/O, so `test/validators.spec.ts` tests them directly,
without the Worker, the network or Cloudflare.

| Field | Rule |
| --- | --- |
| `nombre` | Required, 2 to 60 characters, letters, spaces, `'`, `.` and `-` |
| `email` | Required, `user@domain.tld`, 64 characters before the `@`, 254 in total, no `..` |
| `telefono` | Optional, 10 digits, accepts spaces, `()` and `-` |
| `gato` | Required, a cat of the shelter, ignores case and accents |
| `mensaje` | Optional, 500 characters at most |

`test/index.spec.ts` tests the routes in the Workers runtime of
`@cloudflare/vitest-plugin`.

Coverage uses `@vitest/coverage-istanbul`, because the Workers runtime has no
V8 coverage API. `vitest.config.mts` sets a quality gate of 80% for lines,
functions, branches and statements. A lower value fails the pipeline.

## Stack

- Cloudflare Workers (`wrangler` v4)
- TypeScript
- Vitest with `@cloudflare/vitest-plugin` and `@vitest/coverage-istanbul`
- GitHub Actions (`cloudflare/wrangler-action@v3`)

## Local commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the local dev server on http://localhost:8787 |
| `npm run test -- run` | Run the unit tests once |
| `npm run test:coverage` | Run the unit tests with the coverage report in `coverage/` |
| `npm run typecheck` | Generate the Worker types and run `tsc` |
| `npm run build` | Bundle the Worker into `dist/` without a deploy |
| `npm run deploy` | Deploy the DEV Worker from the local machine |
| `npm run deploy:prod` | Deploy the PROD Worker from the local machine |

## Pipeline

`.github/workflows/deploy.yml` runs on every push and pull request to `main`.

| Job | Needs | Steps |
| --- | --- | --- |
| Build | | `npm ci`, type check, `wrangler deploy --dry-run --outdir dist`, upload the `worker-bundle` artifact |
| Unit tests and coverage | Build | `vitest run --coverage`, write the report to `$GITHUB_STEP_SUMMARY`, upload the `coverage-report` artifact |
| Deploy to DEV | Unit tests | Download `worker-bundle`, `wrangler deploy dist/index.js --no-bundle`, smoke test on `/api/health` |
| Deploy to PROD | Deploy to DEV | Download `worker-bundle`, `wrangler deploy dist/index.js --no-bundle --env production`, smoke test on `/api/health` |

Pull requests run only Build and the unit tests. Both deploy jobs deploy the
same bundle that the Build job published. The smoke test checks that
`/api/health` reports the expected environment.

## Worker configuration

`wrangler.jsonc` holds the DEV Worker at the top level and the PROD Worker in
`env.production`. Each one sets `ENVIRONMENT` in `vars`, and the Worker shows
the value in `/api/health` and in the page footer. Observability is enabled in
both, so the request logs are visible in the Cloudflare dashboard.
