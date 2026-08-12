import { cord } from "./cord.js";

/**
 * A transição entre seções: uma corda esticada de ponta a ponta, com os nós se
 * dando da esquerda para a direita conforme ela entra na tela.
 *
 * A corda é uma polilinha explícita, e os nós são posicionados amostrando essa
 * mesma polilinha — senão eles flutuam acima da curva desenhada.
 */
export function drawDivider(canvas, { paletas, progress = 1 } = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const cw = Math.min(15, Math.max(9, w / 110));
  const cy = h * 0.5;
  const sag = cw * 1.1;

  // A corda cede no meio: esticada em linha reta ela vira régua.
  const samples = 48;
  const rope = [];
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    rope.push({ x: u * w, y: cy - sag + 4 * sag * u * (1 - u) });
  }
  cord(ctx, rope, cw, paletas[0]);

  const knots = Math.max(3, Math.round(w / 190));
  const step = w / (knots + 1);

  for (let i = 0; i < knots; i += 1) {
    const t = clamp((progress * knots - i) / 0.7);
    if (t <= 0) continue;
    const x = step * (i + 1);
    const u = x / w;
    const y = cy - sag + 4 * sag * u * (1 - u);
    // Tangente da corda, para a volta cruzar ela de through e não na diagonal.
    const slope = (4 * sag * (1 - 2 * u)) / w;
    // Cada nó da fileira leva um fio diferente, como numa peça multicolor.
    tie(ctx, x, y, slope, cw, paletas[(i + 1) % paletas.length], t);
  }
}

/** A volta desce sobre a corda e aperta: chega alta e frouxa, fecha rente. */
function tie(ctx, x, y, slope, cw, palette, t) {
  const drop = (1 - t) * cw * 3;
  const len = cw * (1.5 - 0.35 * t);
  // Normal à corda: a volta abraça o cilindro atravessando ele.
  const nx = -slope / Math.hypot(1, slope);
  const ny = 1 / Math.hypot(1, slope);

  ctx.save();
  ctx.globalAlpha = Math.min(1, t * 1.5);
  cord(
    ctx,
    [
      { x: x - nx * len, y: y - ny * len - drop },
      { x: x + nx * len, y: y + ny * len - drop },
    ],
    cw * (0.75 + 0.25 * t),
    palette,
    { twist: false },
  );
  ctx.restore();
}

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
