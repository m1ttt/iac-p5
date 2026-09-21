import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Refugio Michi worker", () => {
	it("serves the landing page on / (unit style)", async () => {
		const request = new IncomingRequest("http://example.com/");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(await response.text()).toContain("Un <em>gatito</em> te está esperando");
	});

	it("lists every cat on the landing page (integration style)", async () => {
		const response = await SELF.fetch("https://example.com/");
		const html = await response.text();

		expect(response.status).toBe(200);
		for (const nombre of ["Michi", "Pelusa", "Tizón", "Canela", "Nube", "Bigotes"]) {
			expect(html).toContain(nombre);
		}
	});

	it("reports the status on /api/health", async () => {
		const response = await SELF.fetch("https://example.com/api/health");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: "ok",
			service: "iac-p5",
			version: "2.0.0",
		});
	});

	it("returns the cats on /api/gatos", async () => {
		const response = await SELF.fetch("https://example.com/api/gatos");
		const body = (await response.json()) as {
			total: number;
			gatos: { nombre: string; edad: string; rasgo: string }[];
		};

		expect(response.status).toBe(200);
		expect(body.total).toBe(6);
		expect(body.gatos).toHaveLength(6);
		expect(body.gatos[0]).toEqual({
			nombre: "Michi",
			edad: "4 meses",
			rasgo: "Duerme sobre el teclado",
		});
	});

	it("answers 404 on an unknown route", async () => {
		const response = await SELF.fetch("https://example.com/no-existe");

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: "Not Found",
			path: "/no-existe",
		});
	});
});
