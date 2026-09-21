/**
 * Practica 5 - Cloudflare Worker deployed with GitHub Actions.
 *
 * Routes:
 *   GET /            Landing page of the cat shelter
 *   GET /api/health  JSON status of the Worker
 *   GET /api/gatos   JSON list of the cats
 *   *                404 in JSON
 */

const VERSION = "2.0.0";

type Gato = {
	nombre: string;
	edad: string;
	rasgo: string;
	pelaje: string;
	oreja: string;
	ojo: string;
};

const GATOS: Gato[] = [
	{ nombre: "Michi", edad: "4 meses", rasgo: "Duerme sobre el teclado", pelaje: "#f0a05a", oreja: "#f7c9a0", ojo: "#2e7d5b" },
	{ nombre: "Pelusa", edad: "7 meses", rasgo: "Ronronea sin parar", pelaje: "#b9b3ad", oreja: "#e2ddd8", ojo: "#3f6ea8" },
	{ nombre: "Tizón", edad: "1 año", rasgo: "Caza tapitas de refresco", pelaje: "#3c4152", oreja: "#6b7186", ojo: "#d8a13a" },
	{ nombre: "Canela", edad: "5 meses", rasgo: "Pide croquetas a gritos", pelaje: "#c9784a", oreja: "#e8b48c", ojo: "#4f9e6a" },
	{ nombre: "Nube", edad: "3 meses", rasgo: "Se esconde en las cajas", pelaje: "#e8e4df", oreja: "#f6f2ee", ojo: "#7f6ab8" },
	{ nombre: "Bigotes", edad: "2 años", rasgo: "Vigila la ventana todo el día", pelaje: "#8d6748", oreja: "#c39b78", ojo: "#c2543f" },
];

const gatoSvg = (g: Gato): string => `
<svg viewBox="0 0 200 200" role="img" aria-label="Ilustración de ${g.nombre}">
  <circle cx="100" cy="106" r="74" fill="${g.pelaje}"/>
  <path d="M38 62 L46 12 L86 42 Z" fill="${g.pelaje}"/>
  <path d="M162 62 L154 12 L114 42 Z" fill="${g.pelaje}"/>
  <path d="M46 56 L51 26 L76 45 Z" fill="${g.oreja}"/>
  <path d="M154 56 L149 26 L124 45 Z" fill="${g.oreja}"/>
  <ellipse cx="74" cy="98" rx="12" ry="15" fill="#1b1f2b"/>
  <ellipse cx="126" cy="98" rx="12" ry="15" fill="#1b1f2b"/>
  <ellipse cx="74" cy="98" rx="8" ry="12" fill="${g.ojo}"/>
  <ellipse cx="126" cy="98" rx="8" ry="12" fill="${g.ojo}"/>
  <ellipse cx="74" cy="95" rx="3" ry="6" fill="#0d0f16"/>
  <ellipse cx="126" cy="95" rx="3" ry="6" fill="#0d0f16"/>
  <circle cx="78" cy="90" r="3" fill="#ffffff" opacity="0.9"/>
  <circle cx="130" cy="90" r="3" fill="#ffffff" opacity="0.9"/>
  <ellipse cx="100" cy="132" rx="46" ry="30" fill="${g.oreja}" opacity="0.55"/>
  <path d="M92 126 L108 126 L100 136 Z" fill="#e06a7d"/>
  <path d="M100 136 Q100 146 90 148 M100 136 Q100 146 110 148" stroke="#1b1f2b" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g stroke="#1b1f2b" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
    <path d="M56 128 L18 120"/><path d="M56 136 L20 140"/>
    <path d="M144 128 L182 120"/><path d="M144 136 L180 140"/>
  </g>
</svg>`;

const tarjeta = (g: Gato): string => `
      <article class="card">
        <div class="art" style="--fur:${g.pelaje}">${gatoSvg(g)}</div>
        <h3>${g.nombre}</h3>
        <p class="edad">${g.edad}</p>
        <p class="rasgo">${g.rasgo}</p>
        <span class="chip">Busca casa</span>
      </article>`;

const page = (): string => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gatitos en adopción</title>
<meta name="description" content="Landing de adopción de gatitos, servida desde un Cloudflare Worker.">
<style>
  :root {
    --bg: #fff8f1;
    --surface: #ffffff;
    --line: #f0e0cf;
    --text: #2a2118;
    --muted: #7d6e5f;
    --accent: #f08a3c;
    --accent-soft: #ffe7d2;
    --radius: 20px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #17120e;
      --surface: #201a15;
      --line: #35291f;
      --text: #f5ece3;
      --muted: #b6a493;
      --accent: #ff9b52;
      --accent-soft: #3a2616;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
  }
  .wrap { width: 100%; max-width: 1040px; margin: 0 auto; padding: 0 20px; }
  header {
    position: sticky; top: 0; z-index: 10;
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  nav { display: flex; align-items: center; justify-content: space-between; height: 66px; }
  .logo { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: -0.02em; }
  .logo span.paw { font-size: 22px; }
  nav ul { display: flex; gap: 22px; list-style: none; margin: 0; padding: 0; }
  nav a { color: var(--muted); text-decoration: none; font-size: 15px; }
  nav a:hover { color: var(--accent); }
  .btn {
    display: inline-block; padding: 12px 22px; border-radius: 999px;
    font-weight: 700; text-decoration: none; border: 1px solid transparent;
  }
  .btn-primary { background: var(--accent); color: #241505; }
  .btn-primary:hover { filter: brightness(1.07); }
  .btn-ghost { border-color: var(--line); color: var(--text); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

  .hero { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 40px; align-items: center; padding: 72px 0 56px; }
  .eyebrow {
    display: inline-block; padding: 6px 14px; border-radius: 999px;
    background: var(--accent-soft); color: var(--accent);
    font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  }
  h1 { font-size: clamp(36px, 6vw, 58px); line-height: 1.05; letter-spacing: -0.03em; margin: 18px 0 14px; }
  h1 em { font-style: normal; color: var(--accent); }
  .hero p { color: var(--muted); font-size: 18px; max-width: 46ch; margin: 0 0 28px; }
  .acciones { display: flex; gap: 12px; flex-wrap: wrap; }
  .hero-art {
    background: var(--surface); border: 1px solid var(--line); border-radius: 28px;
    padding: 28px; box-shadow: 0 30px 60px rgba(0,0,0,0.10);
  }
  .hero-art svg { width: 100%; height: auto; display: block; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 8px 0 64px; }
  .stat { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; text-align: center; }
  .stat b { display: block; font-size: 30px; letter-spacing: -0.02em; }
  .stat span { color: var(--muted); font-size: 13px; }

  section { padding: 56px 0; }
  .titulo { text-align: center; max-width: 34ch; margin: 0 auto 40px; }
  .titulo h2 { font-size: clamp(26px, 4vw, 38px); letter-spacing: -0.02em; margin: 0 0 10px; }
  .titulo p { color: var(--muted); margin: 0; }

  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .card {
    background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
    padding: 20px; text-align: center; transition: transform .18s ease, box-shadow .18s ease;
  }
  .card:hover { transform: translateY(-4px); box-shadow: 0 18px 36px rgba(0,0,0,0.12); }
  .art {
    background: color-mix(in srgb, var(--fur) 18%, var(--bg));
    border-radius: 16px; padding: 12px; margin-bottom: 16px;
  }
  .art svg { width: 100%; height: auto; display: block; }
  .card h3 { margin: 0; font-size: 20px; }
  .edad { margin: 2px 0 8px; color: var(--accent); font-size: 14px; font-weight: 600; }
  .rasgo { margin: 0 0 14px; color: var(--muted); font-size: 15px; }
  .chip {
    display: inline-block; padding: 5px 12px; border-radius: 999px;
    background: var(--accent-soft); color: var(--accent); font-size: 12px; font-weight: 700;
  }

  .pasos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .paso { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; }
  .paso b { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px;
    background: var(--accent-soft); color: var(--accent); margin-bottom: 14px; }
  .paso h3 { margin: 0 0 6px; font-size: 18px; }
  .paso p { margin: 0; color: var(--muted); font-size: 15px; }

  .cta {
    background: var(--surface); border: 1px solid var(--line); border-radius: 28px;
    padding: 48px 32px; text-align: center; margin-bottom: 56px;
  }
  .cta h2 { font-size: clamp(24px, 4vw, 34px); margin: 0 0 10px; letter-spacing: -0.02em; }
  .cta p { color: var(--muted); margin: 0 0 24px; }

  footer { border-top: 1px solid var(--line); padding: 28px 0 48px; color: var(--muted); font-size: 14px; }
  footer div { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  a.link { color: var(--accent); }

  @media (max-width: 860px) {
    .hero { grid-template-columns: 1fr; padding-top: 48px; }
    .stats { grid-template-columns: repeat(2, 1fr); }
    .grid, .pasos { grid-template-columns: 1fr 1fr; }
    nav ul { display: none; }
  }
  @media (max-width: 560px) {
    .grid, .pasos { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<header>
  <div class="wrap">
    <nav>
      <div class="logo"><span class="paw">&#128049;</span> Refugio Michi</div>
      <ul>
        <li><a href="#gatitos">Gatitos</a></li>
        <li><a href="#adopta">Como adoptar</a></li>
        <li><a href="/api/gatos">API</a></li>
      </ul>
      <a class="btn btn-primary" href="#adopta">Adoptar</a>
    </nav>
  </div>
</header>

<main>
  <div class="wrap">
    <div class="hero">
      <div>
        <span class="eyebrow">Adopción responsable</span>
        <h1>Un <em>gatito</em> te está esperando</h1>
        <p>
          Seis gatitos rescatados buscan casa. Están desparasitados, vacunados y
          listos para ocupar tu silla favorita desde el primer día.
        </p>
        <div class="acciones">
          <a class="btn btn-primary" href="#gatitos">Conoce a los gatitos</a>
          <a class="btn btn-ghost" href="#adopta">Como adoptar</a>
        </div>
      </div>
      <div class="hero-art">${gatoSvg(GATOS[0])}</div>
    </div>

    <div class="stats">
      <div class="stat"><b>${GATOS.length}</b><span>en adopción</span></div>
      <div class="stat"><b>128</b><span>adopciones</span></div>
      <div class="stat"><b>100%</b><span>vacunados</span></div>
      <div class="stat"><b>0 $</b><span>costo</span></div>
    </div>

    <section id="gatitos">
      <div class="titulo">
        <h2>Conoce a los gatitos</h2>
        <p>Cada uno llegó con su propia historia y su propia manía.</p>
      </div>
      <div class="grid">${GATOS.map(tarjeta).join("")}
      </div>
    </section>

    <section id="adopta">
      <div class="titulo">
        <h2>Como adoptar</h2>
        <p>Tres pasos y el gatito duerme en tu casa esta semana.</p>
      </div>
      <div class="pasos">
        <div class="paso">
          <b>1</b>
          <h3>Elige tu gatito</h3>
          <p>Revisa las fichas y dinos cual te robó el corazón.</p>
        </div>
        <div class="paso">
          <b>2</b>
          <h3>Agenda la visita</h3>
          <p>Vienes al refugio y pasan un rato juntos antes de decidir.</p>
        </div>
        <div class="paso">
          <b>3</b>
          <h3>Llévatelo a casa</h3>
          <p>Firmas la carta de adopción y se va contigo con su cartilla.</p>
        </div>
      </div>
    </section>

    <div class="cta">
      <h2>Listo para el ronroneo</h2>
      <p>Escríbenos y te apartamos al gatito que elegiste.</p>
      <a class="btn btn-primary" href="#gatitos">Quiero adoptar</a>
    </div>
  </div>
</main>

<footer>
  <div class="wrap">
    <div>
      <span>Refugio Michi &middot; Practica 5, DevSecOps ITESO</span>
      <span>Cloudflare Worker v${VERSION} &middot; <a class="link" href="/api/health">estado</a> &middot; <a class="link" href="/api/gatos">datos</a></span>
    </div>
  </div>
</footer>
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

		if (url.pathname === "/api/gatos") {
			return Response.json({
				total: GATOS.length,
				gatos: GATOS.map(({ nombre, edad, rasgo }) => ({ nombre, edad, rasgo })),
			});
		}

		return Response.json({ error: "Not Found", path: url.pathname }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
