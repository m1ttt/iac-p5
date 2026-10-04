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
			version: "3.0.0",
			environment: "development",
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

	it("accepts a valid adoption request on /api/adopciones", async () => {
		const response = await SELF.fetch("https://example.com/api/adopciones", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ nombre: "Ana López", email: "ana@iteso.mx", gato: "michi" }),
		});

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			mensaje: "Solicitud recibida para adoptar a Michi",
			solicitud: { nombre: "Ana López", email: "ana@iteso.mx", gato: "Michi" },
		});
	});

	it("returns the validation errors on /api/adopciones", async () => {
		const response = await SELF.fetch("https://example.com/api/adopciones", {
			method: "POST",
			body: JSON.stringify({ nombre: "Ana", email: "ana", gato: "Michi" }),
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ errores: ["Se requiere un correo electrónico válido"] });
	});

	it("rejects a body that is not JSON on /api/adopciones", async () => {
		const response = await SELF.fetch("https://example.com/api/adopciones", { method: "POST", body: "nombre=Ana" });

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ errores: ["El cuerpo debe ser JSON válido"] });
	});

	it("answers 405 on GET /api/adopciones", async () => {
		const response = await SELF.fetch("https://example.com/api/adopciones");

		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("POST");
	});
});
