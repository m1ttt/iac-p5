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

describe("Practica 5 worker", () => {
	it("serves the HTML page on / (unit style)", async () => {
		const request = new IncomingRequest("http://example.com/");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(await response.text()).toContain("Practica 5");
	});

	it("serves the HTML page on / (integration style)", async () => {
		const response = await SELF.fetch("https://example.com/");

		expect(response.status).toBe(200);
		expect(await response.text()).toContain("Cloudflare Worker");
	});

	it("reports the status on /api/health", async () => {
		const response = await SELF.fetch("https://example.com/api/health");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: "ok",
			service: "iac-p5",
			version: "1.1.0",
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
