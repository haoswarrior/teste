/**
 * Desenho de corda de algodão em canvas.
 *
 * Uma corda não é um traço: é um cilindro torcido. O que faz ela parecer
 * algodão é a soma de três coisas — uma sombra por baixo, um corpo, e as
 * marcas diagonais da torção por cima. Sem as marcas, vira linha de desenho.
 */

/** Traça a polilinha suavizada por pontos médios, sem cantos vivos. */
function trace(ctx, pts) {
  ctx.beginPath();
  if (pts.length < 2) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i += 1) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
}

/**
 * Desenha uma corda. `w` é a espessura em pixels; as marcas de torção são
 * espaçadas em função dela, para a corda manter a mesma textura em qualquer
 * escala.
 */
export function cord(ctx, pts, w, palette, { twist = true } = {}) {
  if (pts.length < 2) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Sombra: o que separa a corda do fundo e dá volume.
  ctx.save();
  ctx.translate(0, w * 0.16);
  trace(ctx, pts);
  ctx.strokeStyle = palette.shadow;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.restore();

  trace(ctx, pts);
  ctx.strokeStyle = palette.body;
  ctx.lineWidth = w;
  ctx.stroke();

  // Brilho deslocado para cima: a luz bate no alto do cilindro.
  ctx.save();
  ctx.translate(-w * 0.06, -w * 0.2);
  trace(ctx, pts);
  ctx.strokeStyle = palette.light;
  ctx.lineWidth = w * 0.32;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.restore();

  if (twist) twistMarks(ctx, pts, w, palette);
}

/** As diagonais da torção, cortadas pela própria corda. */
function twistMarks(ctx, pts, w, palette) {
  ctx.save();
  trace(ctx, pts);
  ctx.lineWidth = w;
  ctx.clip("nonzero");

  ctx.strokeStyle = palette.shadow;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = Math.max(0.7, w * 0.11);
  ctx.lineCap = "butt";

  const step = w * 0.62;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const ux = dx / len;
    const uy = dy / len;
    // Normal da corda: a marca cruza o cilindro, inclinada.
    const nx = -uy;
    const ny = ux;

    for (let d = 0; d < len; d += step) {
      const cx = a.x + ux * d;
      const cy = a.y + uy * d;
      const lean = w * 0.34;
      ctx.beginPath();
      ctx.moveTo(cx - nx * w * 0.5 - ux * lean, cy - ny * w * 0.5 - uy * lean);
      ctx.lineTo(cx + nx * w * 0.5 + ux * lean, cy + ny * w * 0.5 + uy * lean);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * A ponta desfiada. O algodão torcido de 3 fios abre em três quando escovado —
 * é por isso que a franja de macramé é feita com torcido e não com trançado.
 */
export function fray(ctx, x, yTop, yBottom, w, palette, rand) {
  const strands = 3;
  for (let s = 0; s < strands; s += 1) {
    const spread = (s - (strands - 1) / 2) * w * 0.5;
    const drift = (rand() - 0.5) * w * 1.6;
    const pts = [
      { x, y: yTop },
      { x: x + spread * 0.4, y: yTop + (yBottom - yTop) * 0.45 },
      { x: x + spread + drift, y: yBottom - (rand() * (yBottom - yTop) * 0.22) },
    ];
    cord(ctx, pts, w * 0.42, palette, { twist: false });
  }
}

/** Gerador determinístico: o painel precisa redesenhar igual a cada resize. */
export function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
