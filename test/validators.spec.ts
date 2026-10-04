import { describe, it, expect } from "vitest";
import {
	EMAIL_LOCAL_MAX,
	EMAIL_MAX,
	MENSAJE_MAX,
	NOMBRE_MAX,
	validateAdopcion,
	validateEmail,
	validateGato,
	validateMensaje,
	validateNombre,
	validateTelefono,
} from "../src/validators";

describe("validateNombre", () => {
	it("accepts a full name with accents, apostrophes and hyphens", () => {
		expect(validateNombre("María José O'Connor-Pérez")).toEqual([]);
	});

	it.each([undefined, null, "", "   ", 42])("rejects a missing name (%s)", (valor) => {
		expect(validateNombre(valor)).toEqual(["El nombre es requerido"]);
	});

	it("rejects a name with one letter", () => {
		expect(validateNombre("A")).toEqual(["El nombre debe tener entre 2 y 60 caracteres"]);
	});

	it("accepts a name at the maximum length and rejects one character more", () => {
		expect(validateNombre("a".repeat(NOMBRE_MAX))).toEqual([]);
		expect(validateNombre("a".repeat(NOMBRE_MAX + 1))).toHaveLength(1);
	});

	it.each(["Juan123", "<script>", "-Ana", "Ana_Luisa"])("rejects invalid characters (%s)", (valor) => {
		expect(validateNombre(valor)).toContain(
			"El nombre solo puede tener letras, espacios, apóstrofes, puntos y guiones",
		);
	});
});

describe("validateEmail", () => {
	it.each(["ana@iteso.mx", "ana.lopez+gatos@correo.com.mx", "A_B-c%1@sub-dominio.example.org"])(
		"accepts a valid address (%s)",
		(valor) => {
			expect(validateEmail(valor)).toEqual([]);
		},
	);

	it.each([undefined, null, "", "  "])("rejects a missing address (%s)", (valor) => {
		expect(validateEmail(valor)).toEqual(["El correo electrónico es requerido"]);
	});

	it.each([
		"sin-arroba.com",
		"ana@",
		"@iteso.mx",
		"ana@iteso",
		"ana@@iteso.mx",
		"ana@iteso.m",
		"ana..lopez@iteso.mx",
		".ana@iteso.mx",
		"ana.@iteso.mx",
		"ana lopez@iteso.mx",
		"ana@iteso..mx",
	])("rejects a malformed address (%s)", (valor) => {
		expect(validateEmail(valor)).toEqual(["Se requiere un correo electrónico válido"]);
	});

	it("rejects a local part longer than 64 characters", () => {
		expect(validateEmail(`${"a".repeat(EMAIL_LOCAL_MAX + 1)}@iteso.mx`)).toEqual([
			"La parte antes de la @ no puede tener más de 64 caracteres",
		]);
		expect(validateEmail(`${"a".repeat(EMAIL_LOCAL_MAX)}@iteso.mx`)).toEqual([]);
	});

	it("rejects an address longer than 254 characters", () => {
		const dominio = `${"d".repeat(60)}.`.repeat(4) + "com";
		const email = `ana@${dominio}`.padStart(EMAIL_MAX + 1, "a");
		expect(validateEmail(email)).toEqual(["El correo electrónico no puede tener más de 254 caracteres"]);
	});
});

describe("validateTelefono", () => {
	it.each([undefined, null, ""])("accepts an empty optional phone (%s)", (valor) => {
		expect(validateTelefono(valor)).toEqual([]);
	});

	it.each(["3312345678", "33 1234 5678", "(33) 1234-5678"])("accepts 10 digits (%s)", (valor) => {
		expect(validateTelefono(valor)).toEqual([]);
	});

	it.each(["12345", "331234567890", "33-12ab-5678"])("rejects a phone without 10 digits (%s)", (valor) => {
		expect(validateTelefono(valor)).toEqual(["El teléfono debe tener 10 dígitos"]);
	});

	it("rejects a phone that is not text", () => {
		expect(validateTelefono(3312345678)).toEqual(["El teléfono debe ser texto"]);
	});
});

describe("validateGato", () => {
	it.each(["Michi", "tizon", "  TIZÓN  ", "bigotes"])("accepts a cat of the shelter (%s)", (valor) => {
		expect(validateGato(valor)).toEqual([]);
	});

	it.each([undefined, "", "   ", 7])("asks for a cat when the value is missing (%s)", (valor) => {
		expect(validateGato(valor)).toEqual(["Selecciona un gatito"]);
	});

	it("rejects a cat that is not in the shelter", () => {
		expect(validateGato("Garfield")).toEqual(['El gatito "Garfield" no está en el refugio']);
	});
});

describe("validateMensaje", () => {
	it.each([undefined, null, "", "Tengo un patio grande"])("accepts an optional message (%s)", (valor) => {
		expect(validateMensaje(valor)).toEqual([]);
	});

	it("rejects a message that is not text", () => {
		expect(validateMensaje({ texto: "hola" })).toEqual(["El mensaje debe ser texto"]);
	});

	it("rejects a message longer than the maximum", () => {
		expect(validateMensaje("x".repeat(MENSAJE_MAX + 1))).toEqual([
			"El mensaje no puede tener más de 500 caracteres",
		]);
	});
});

describe("validateAdopcion", () => {
	const valida = {
		nombre: "  Ana   López ",
		email: " Ana.Lopez@ITESO.mx ",
		telefono: "(33) 1234-5678",
		gato: "tizon",
		mensaje: "  Tengo experiencia con gatos  ",
	};

	it("returns the normalized request for a valid form", () => {
		expect(validateAdopcion(valida)).toEqual({
			ok: true,
			solicitud: {
				nombre: "Ana López",
				email: "ana.lopez@iteso.mx",
				telefono: "3312345678",
				gato: "Tizón",
				mensaje: "Tengo experiencia con gatos",
			},
		});
	});

	it("leaves out the optional fields when they are empty", () => {
		const resultado = validateAdopcion({ nombre: "Ana", email: "ana@iteso.mx", gato: "Nube", mensaje: "  " });
		expect(resultado).toEqual({
			ok: true,
			solicitud: { nombre: "Ana", email: "ana@iteso.mx", gato: "Nube" },
		});
	});

	it("returns every error of the form at the same time", () => {
		const resultado = validateAdopcion({ nombre: "", email: "ana", telefono: "1", gato: "Garfield" });
		expect(resultado).toEqual({
			ok: false,
			errores: [
				"El nombre es requerido",
				"Se requiere un correo electrónico válido",
				"El teléfono debe tener 10 dígitos",
				'El gatito "Garfield" no está en el refugio',
			],
		});
	});

	it.each([null, "texto", 5, [valida]])("rejects a body that is not an object (%s)", (valor) => {
		expect(validateAdopcion(valor)).toEqual({ ok: false, errores: ["La solicitud debe ser un objeto JSON"] });
	});
});
