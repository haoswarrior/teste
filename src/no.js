import { cord } from "./cord.js";

/**
 * Um nó quadrado grande, sendo dado e desfeito em laço.
 *
 * Existe para mostrar de perto duas coisas que o resto da página só sugere: a
 * torção do fio, que nesta escala aparece, e o caminho real das cordas — a de
 * fora passando na frente do recheio numa volta e atrás na outra. É essa troca
 * de lado que faz o nó ficar reto em vez de torcer.
 *
 * Cada corda de trabalho tem sua cor, senão não se enxerga quem passa por onde.
 */
export function drawNo(canvas, { paletas, t = 1 } = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cw = Math.min(w, h) * 0.05;
  const gap = cw * 0.8;
  const top = h * 0.04;
  const bottom = h * 0.96;

  const fio = (i) => paletas[i % paletas.length];
  // Frouxo, a corda de trabalho fica larga e a volta é alta; apertado, ela
  // fecha rente ao recheio.
  const lado = w * 0.36 - (w * 0.36 - gap * 2.2) * t;
  const folga = (1 - t) * h * 0.06;

  const recheio = () =>
    [-gap, gap].forEach((dx) =>
      cord(ctx, [{ x: cx + dx, y: top }, { x: cx + dx, y: bottom }], cw, fio(1)),
    );

  // As pontas de cima, de onde as cordas de trabalho chegam.
  cord(ctx, [{ x: cx + lado, y: top }, { x: cx + lado, y: h * 0.3 }], cw, fio(0));
  cord(ctx, [{ x: cx - lado, y: top }, { x: cx - lado, y: h * 0.3 }], cw, fio(2));

  meioNo(ctx, { cx, y: h * 0.36, lado, folga, cw, recheio, fio, dir: 1 });
  meioNo(ctx, { cx, y: h * 0.64, lado, folga, cw, recheio, fio, dir: -1 });

  // As pontas de baixo, depois dos dois meios nós.
  cord(ctx, [{ x: cx - lado, y: h * 0.78 }, { x: cx - lado, y: bottom }], cw, fio(0));
  cord(ctx, [{ x: cx + lado, y: h * 0.78 }, { x: cx + lado, y: bottom }], cw, fio(2));
}

/**
 * Um meio nó: a corda de um lado atravessa por cima do recheio e a do outro
 * por baixo. `dir` diz qual passa por cima — trocar o lado nos dois meios nós
 * é o que dá o nó quadrado.
 */
function meioNo(ctx, { cx, y, lado, folga, cw, recheio, fio, dir }) {
  const alto = y - cw * 0.9 - folga;
  const baixo = y + cw * 0.9 + folga;
  const frente = dir > 0 ? -1 : 1;

  // A que passa por trás, antes do recheio para ficar coberta.
  faixa(ctx, { cx, lado, alto, baixo, cw, s: -frente, fio: fio(frente > 0 ? 2 : 0) });
  recheio();
  faixa(ctx, { cx, lado, alto, baixo, cw, s: frente, fio: fio(frente > 0 ? 0 : 2) });
}

/** A travessia horizontal de uma corda de trabalho sobre o recheio. */
function faixa(ctx, { cx, lado, alto, baixo, cw, s, fio }) {
  cord(
    ctx,
    [
      { x: cx + s * lado, y: alto - cw * 1.6 },
      { x: cx + s * lado * 0.92, y: alto },
      { x: cx + s * lado * 0.2, y: alto + (baixo - alto) * 0.35 },
      { x: cx - s * lado * 0.2, y: alto + (baixo - alto) * 0.65 },
      { x: cx - s * lado * 0.92, y: baixo },
      { x: cx - s * lado, y: baixo + cw * 1.6 },
    ],
    cw,
    fio,
  );
}
