/** Cats in the shelter. The landing page and the adoption form use this list. */

export type Gato = {
	nombre: string;
	edad: string;
	rasgo: string;
	pelaje: string;
	oreja: string;
	ojo: string;
};

export const GATOS: Gato[] = [
	{ nombre: "Michi", edad: "4 meses", rasgo: "Duerme sobre el teclado", pelaje: "#f0a05a", oreja: "#f7c9a0", ojo: "#2e7d5b" },
	{ nombre: "Pelusa", edad: "7 meses", rasgo: "Ronronea sin parar", pelaje: "#b9b3ad", oreja: "#e2ddd8", ojo: "#3f6ea8" },
	{ nombre: "Tizón", edad: "1 año", rasgo: "Caza tapitas de refresco", pelaje: "#3c4152", oreja: "#6b7186", ojo: "#d8a13a" },
	{ nombre: "Canela", edad: "5 meses", rasgo: "Pide croquetas a gritos", pelaje: "#c9784a", oreja: "#e8b48c", ojo: "#4f9e6a" },
	{ nombre: "Nube", edad: "3 meses", rasgo: "Se esconde en las cajas", pelaje: "#e8e4df", oreja: "#f6f2ee", ojo: "#7f6ab8" },
	{ nombre: "Bigotes", edad: "2 años", rasgo: "Vigila la ventana todo el día", pelaje: "#8d6748", oreja: "#c39b78", ojo: "#c2543f" },
];
