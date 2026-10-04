/**
 * Business rules for the adoption form. The Worker calls validateAdopcion on
 * POST /api/adopciones. The functions have no I/O, so the unit tests run them
 * directly, without the Worker or Cloudflare.
 */

import { GATOS } from "./gatos";

export const NOMBRE_MIN = 2;
export const NOMBRE_MAX = 60;
// RFC 5321: 64 characters for the local part, 254 for the full address.
export const EMAIL_LOCAL_MAX = 64;
export const EMAIL_MAX = 254;
export const MENSAJE_MAX = 500;

const NOMBRE_RE = /^[\p{L}][\p{L} '.-]*$/u;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export type SolicitudAdopcion = {
	nombre: string;
	email: string;
	telefono?: string;
	gato: string;
	mensaje?: string;
};

export type ResultadoValidacion =
	| { ok: true; solicitud: SolicitudAdopcion }
	| { ok: false; errores: string[] };

/** Returns the errors of a full name. An empty list means the name is valid. */
export function validateNombre(nombre: unknown): string[] {
	if (typeof nombre !== "string" || nombre.trim().length === 0) {
		return ["El nombre es requerido"];
	}
	const limpio = nombre.trim();
	const errores: string[] = [];
	if (limpio.length < NOMBRE_MIN || limpio.length > NOMBRE_MAX) {
		errores.push(`El nombre debe tener entre ${NOMBRE_MIN} y ${NOMBRE_MAX} caracteres`);
	}
	if (!NOMBRE_RE.test(limpio)) {
		errores.push("El nombre solo puede tener letras, espacios, apóstrofes, puntos y guiones");
	}
	return errores;
}

/** Returns the errors of an email address. An empty list means the address is valid. */
export function validateEmail(email: unknown): string[] {
	if (typeof email !== "string" || email.trim().length === 0) {
		return ["El correo electrónico es requerido"];
	}
	const limpio = email.trim();
	if (limpio.length > EMAIL_MAX) {
		return [`El correo electrónico no puede tener más de ${EMAIL_MAX} caracteres`];
	}
	const local = limpio.split("@")[0];
	if (local.length > EMAIL_LOCAL_MAX) {
		return [`La parte antes de la @ no puede tener más de ${EMAIL_LOCAL_MAX} caracteres`];
	}
	if (!EMAIL_RE.test(limpio) || limpio.includes("..") || local.startsWith(".") || local.endsWith(".")) {
		return ["Se requiere un correo electrónico válido"];
	}
	return [];
}

/** Optional field. When present, it must have 10 digits after the separators are removed. */
export function validateTelefono(telefono: unknown): string[] {
	if (telefono === undefined || telefono === null || telefono === "") {
		return [];
	}
	if (typeof telefono !== "string") {
		return ["El teléfono debe ser texto"];
	}
	const digitos = normalizarTelefono(telefono);
	if (!/^[0-9 ()+-]+$/.test(telefono) || digitos.length !== 10) {
		return ["El teléfono debe tener 10 dígitos"];
	}
	return [];
}

/** The cat must be one of the cats in the shelter. The check ignores case and accents. */
export function validateGato(gato: unknown): string[] {
	if (typeof gato !== "string" || gato.trim().length === 0) {
		return ["Selecciona un gatito"];
	}
	if (!buscarGato(gato)) {
		return [`El gatito "${gato.trim()}" no está en el refugio`];
	}
	return [];
}

export function validateMensaje(mensaje: unknown): string[] {
	if (mensaje === undefined || mensaje === null) {
		return [];
	}
	if (typeof mensaje !== "string") {
		return ["El mensaje debe ser texto"];
	}
	if (mensaje.trim().length > MENSAJE_MAX) {
		return [`El mensaje no puede tener más de ${MENSAJE_MAX} caracteres`];
	}
	return [];
}

/** Checks the full form and, when it is valid, returns the normalized request. */
export function validateAdopcion(datos: unknown): ResultadoValidacion {
	if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
		return { ok: false, errores: ["La solicitud debe ser un objeto JSON"] };
	}
	const d = datos as Record<string, unknown>;
	const errores = [
		...validateNombre(d.nombre),
		...validateEmail(d.email),
		...validateTelefono(d.telefono),
		...validateGato(d.gato),
		...validateMensaje(d.mensaje),
	];
	if (errores.length > 0) {
		return { ok: false, errores };
	}

	const solicitud: SolicitudAdopcion = {
		nombre: (d.nombre as string).trim().replace(/\s+/g, " "),
		email: (d.email as string).trim().toLowerCase(),
		gato: buscarGato(d.gato as string)!.nombre,
	};
	if (typeof d.telefono === "string" && d.telefono !== "") {
		solicitud.telefono = normalizarTelefono(d.telefono);
	}
	if (typeof d.mensaje === "string" && d.mensaje.trim() !== "") {
		solicitud.mensaje = d.mensaje.trim();
	}
	return { ok: true, solicitud };
}

function normalizarTelefono(telefono: string): string {
	return telefono.replace(/\D/g, "");
}

function sinAcentos(texto: string): string {
	return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function buscarGato(nombre: string) {
	const buscado = sinAcentos(nombre.trim());
	return GATOS.find((g) => sinAcentos(g.nombre) === buscado);
}
