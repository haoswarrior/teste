import { cordPalette } from "./cord.js";

/**
 * As cores de fio que o ateliê usa.
 *
 * Fio de macramé tingido vem numa faixa estreita e reconhecível: o cru, os
 * barros, os verdes de folha seca e os azuis puxados para o petróleo. Nada
 * daqui é cor de tela — são tons que existem em bobina de algodão.
 */
export const FIOS = {
  cru: "#e5d7bb",
  barro: "#bd5c33",
  telha: "#a8492c",
  mostarda: "#d0912c",
  salvia: "#8a9975",
  oliva: "#5c6b45",
  petroleo: "#356273",
  indigo: "#2c4a63",
  rosa: "#c58a7d",
  vinho: "#7d3b48",
};

/** O nome que vai na ficha da peça, para o cliente pedir pela cor. */
export const NOMES = {
  cru: "cru",
  barro: "barro",
  telha: "telha",
  mostarda: "mostarda",
  salvia: "sálvia",
  oliva: "oliva",
  petroleo: "petróleo",
  indigo: "índigo",
  rosa: "rosa velho",
  vinho: "vinho",
};

/**
 * Monta as paletas de uma combinação. A ordem importa: é a ordem em que as
 * faixas de cor aparecem na peça, da esquerda para a direita.
 */
export function combinacao(chaves, base) {
  return chaves.map((k) => cordPalette(FIOS[k] || FIOS.cru, base));
}

export function nomesDe(chaves) {
  return chaves.map((k) => NOMES[k] || k).join(", ");
}
