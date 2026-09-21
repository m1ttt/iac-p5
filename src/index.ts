/**
 * Practica 5 - Cloudflare Worker deployed with GitHub Actions.
 *
 * Routes:
 *   GET /            HTML page with the practice information
 *   GET /api/health  JSON status of the Worker
 *   *                404 in JSON
 */

const VERSION = "1.1.0";

const page = (): string => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Practica 5 - Cloudflare Worker</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #0b1020;
    --card: #141a2e;
    --line: #26304d;
    --text: #e8ecf8;
    --muted: #9aa5c4;
    --accent: #f6821f;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: radial-gradient(1200px 600px at 50% -10%, #1b2444 0%, var(--bg) 60%);
    color: var(--text);
  }
  main {
    width: 100%;
    max-width: 640px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  .tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(246, 130, 31, 0.14);
    border: 1px solid rgba(246, 130, 31, 0.35);
    color: var(--accent);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h1 { margin: 16px 0 8px; font-size: 30px; line-height: 1.2; }
  p.lead { margin: 0 0 24px; color: var(--muted); line-height: 1.6; }
  dl { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0 0 24px; }
  .item { background: #0f1526; border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
  dt { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  dd { margin: 6px 0 0; font-size: 15px; font-weight: 600; }
  ol { margin: 0; padding-left: 20px; color: var(--muted); line-height: 1.9; }
  footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; }
  a { color: var(--accent); }
  @media (max-width: 520px) { dl { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
  <span class="tag">DevSecOps &middot; ITESO</span>
  <h1>Practica 5: Cloudflare Worker con GitHub Actions</h1>
  <p class="lead">
    Este Worker se creo con el CLI de Cloudflare y se publica de forma automatica
    con un pipeline de GitHub Actions en cada push a la rama <code>main</code>.
  </p>
  <dl>
    <div class="item"><dt>Plataforma</dt><dd>Cloudflare Workers</dd></div>
    <div class="item"><dt>Pipeline</dt><dd>GitHub Actions</dd></div>
    <div class="item"><dt>Lenguaje</dt><dd>TypeScript</dd></div>
    <div class="item"><dt>Version</dt><dd>${VERSION}</dd></div>
  </dl>
  <ol>
    <li>Checkout del codigo en el runner</li>
    <li>Instalacion de Node.js 22</li>
    <li><code>npm ci</code> con el package-lock</li>
    <li>Pruebas unitarias con Vitest</li>
    <li>Deploy con <code>wrangler-action@v3</code></li>
  </ol>
  <footer>Estado del Worker: <a href="/api/health">/api/health</a></footer>
</main>
</body>
</html>`;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		console.log(`${request.method} ${url.pathname}`);

		if (url.pathname === "/") {
			return new Response(page(), {
				headers: { "content-type": "text/html; charset=utf-8" },
			});
		}

		if (url.pathname === "/api/health") {
			return Response.json({
				status: "ok",
				service: "iac-p5",
				version: VERSION,
			});
		}

		return Response.json({ error: "Not Found", path: url.pathname }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
