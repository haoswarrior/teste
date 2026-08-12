/**
 * O perfil de um sino de bronze, em meia-secção.
 *
 * É desta curva que sai tudo nesta página: o desenho técnico da esquerda e o
 * objeto 3D da direita leem o mesmo array. Um fundidor projeta um sino
 * exatamente assim — desenhando metade do contorno e girando em torno do eixo.
 *
 * Coordenadas em raios de boca: x = raio, y = altura a partir do lábio.
 */

// Contorno externo, do lábio (boca) até a coroa. É esta a curva desenhada.
export const OUTER = [
  [1.0, 0.015], // lábio
  [1.015, 0.05], // saliência do cordão
  [1.0, 0.1],
  [0.955, 0.16],
  [0.9, 0.23],
  [0.83, 0.32],
  [0.755, 0.43],
  [0.69, 0.55],
  [0.635, 0.68],
  [0.595, 0.82],
  [0.565, 0.95],
  [0.548, 1.06],
  [0.54, 1.15],
  [0.535, 1.22], // ombro
  [0.5, 1.28],
  [0.42, 1.33],
  [0.32, 1.37],
  [0.22, 1.4],
  [0.15, 1.43],
  [0.115, 1.47],
  [0.1, 1.52], // coroa
];

// Contorno interno, da coroa de volta ao lábio: dá parede ao sino, mais grossa
// no cordão (onde nasce o nominal) e fina na cintura.
const INNER = [
  [0.055, 1.5],
  [0.075, 1.44],
  [0.13, 1.39],
  [0.22, 1.35],
  [0.32, 1.31],
  [0.4, 1.26],
  [0.435, 1.2],
  [0.45, 1.1],
  [0.47, 0.95],
  [0.5, 0.8],
  [0.545, 0.65],
  [0.6, 0.5],
  [0.665, 0.36],
  [0.74, 0.23],
  [0.8, 0.13],
  [0.845, 0.06],
  [0.86, 0.0],
];

/**
 * Os cinco parciais de um sino afinado, com a altura em que o afinador tira
 * metal para corrigir cada um. As frequências são de um sino com prime em ré4:
 * as razões 1/2 : 1 : 6/5 : 3/2 : 2 são o que define um sino "afinado".
 */
export const PARTIALS = [
  { name: "nominal", note: "Ré5", hz: 587.33, ratio: 2, height: 0.09 },
  { name: "quint", note: "Lá4", hz: 440.0, ratio: 1.5, height: 0.42 },
  { name: "tierce", note: "Fá4", hz: 349.23, ratio: 1.2, height: 0.72 },
  { name: "prime", note: "Ré4", hz: 293.66, ratio: 1, height: 1.02 },
  { name: "hum", note: "Ré3", hz: 146.83, ratio: 0.5, height: 1.34 },
];

export const BELL_HEIGHT = 1.52;
export const MOUTH_RADIUS = 1.015;

/** O contorno fechado que o torno revoluciona: externo, lábio, interno. */
export function latheProfile() {
  return [...OUTER, ...INNER];
}
