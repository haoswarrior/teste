/**
 * Desenho de corda de algodão em canvas.
 *
 * Uma corda não é uma faixa de cor: é um cilindro de fibra. O que a faz
 * parecer algodão de verdade são quatro coisas, e faltando qualquer uma ela
 * volta a parecer desenho vetorial:
 *
 *   1. o degradê no sentido da largura — escuro na borda, claro perto do topo,
 *      escuro de novo na outra borda;
 *   2. a penugem, um halo macio de fibra solta em volta;
 *   3. os fiapos, fibras curtas escapando do corpo;
 *   4. a sombra projetada no fundo.
 *
 * As marcas de torção sozinhas não bastam: elas dão o sulco, não o volume.
 */

const hex = (c) => {
  const n = parseInt(c.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const css = (c, a = 1) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/** Ruído estável por posição: a corda redesenha igual a cada quadro. */
function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Deriva a paleta de uma corda a partir da cor dela.
 *
 * Fio tingido não é fio cru pintado por cima: o brilho de um fio escuro é
 * menos claro que o de um fio claro, e a sombra é mais profunda. Por isso a
 * mistura é proporcional à luminância, e não fixa.
 */
export function cordPalette(base, { wood, woodGrain, accent } = {}) {
  const rgb = hex(base);
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  const light = lerp(rgb, [255, 250, 240], 0.15 + 0.2 * lum);
  const edge = lerp(rgb, [40, 26, 16], 0.3 + 0.22 * (1 - lum));
  const cast = lerp(rgb, [24, 14, 8], 0.62);
  return {
    rgb,
    lightRgb: light,
    edgeRgb: edge,
    body: base,
    light: css(light),
    shadow: css(cast),
    wood,
    woodGrain,
    accent,
  };
}

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
 * Desenha uma corda. `w` é a espessura em pixels. `detail` desliga a fibra e a
 * torção durante animação, quando ninguém as vê e elas custam o quadro.
 */
export function cord(ctx, pts, w, palette, { twist = true, detail = true } = {}) {
  if (pts.length < 2 || !palette) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const { rgb, lightRgb, edgeRgb } = palette;

  // Sombra projetada: separa a corda do fundo e diz que ela está na frente.
  ctx.save();
  ctx.translate(w * 0.13, w * 0.2);
  trace(ctx, pts);
  ctx.strokeStyle = palette.shadow;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = w * 1.02;
  ctx.stroke();
  ctx.restore();

  // Penugem: halo de fibra solta, mais largo que a corda e quase transparente.
  if (detail) {
    for (const [k, a] of [[1.5, 0.06], [1.28, 0.09], [1.12, 0.12]]) {
      trace(ctx, pts);
      ctx.strokeStyle = css(rgb, a);
      ctx.lineWidth = w * k;
      ctx.stroke();
    }
  }

  // O cilindro: da borda escura ao alto claro, em camadas concêntricas
  // deslocadas para a luz. É isto que tira a corda do plano.
  const camadas = detail ? 7 : 3;
  for (let i = 0; i < camadas; i += 1) {
    const t = i / (camadas - 1);
    const cor = t < 0.62 ? lerp(edgeRgb, rgb, t / 0.62) : lerp(rgb, lightRgb, (t - 0.62) / 0.38);
    ctx.save();
    ctx.translate(-w * 0.1 * t, -w * 0.16 * t);
    trace(ctx, pts);
    ctx.strokeStyle = css(cor);
    ctx.lineWidth = w * (1 - 0.78 * t);
    ctx.stroke();
    ctx.restore();
  }

  if (twist && detail) sulcos(ctx, pts, w, palette);
  if (detail && w >= 14) fibras(ctx, pts, w, palette);
  if (detail) penugem(ctx, pts, w, palette);
}

/**
 * Os sulcos da torção. Cada um tem um lado escuro e um lado claro — sulco sem
 * o lado claro vira listra pintada.
 */
function sulcos(ctx, pts, w, palette) {
  ctx.save();
  ctx.lineCap = "butt";

  // Algodão torcido de três fios dá cerca de dois sulcos por diâmetro.
  const step = w * 0.46;
  const lean = w * 0.38;

  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    for (let d = 0; d < len; d += step) {
      const cx = a.x + ux * d;
      const cy = a.y + uy * d;
      const risca = (off, cor, alpha, lw) => {
        ctx.beginPath();
        ctx.strokeStyle = cor;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = lw;
        ctx.moveTo(cx - nx * w * 0.45 - ux * lean + ux * off, cy - ny * w * 0.45 - uy * lean + uy * off);
        ctx.lineTo(cx + nx * w * 0.45 + ux * lean + ux * off, cy + ny * w * 0.45 + uy * lean + uy * off);
        ctx.stroke();
      };
      risca(0, css(palette.edgeRgb), 0.32, Math.max(0.7, w * 0.12));
      risca(w * 0.17, css(palette.lightRgb), 0.3, Math.max(0.5, w * 0.1));
    }
  }
  ctx.restore();
}

/**
 * A penugem da borda: fibra solta escapando do corpo. Curta e densa — fiapo
 * comprido e esparso vira bigode, não algodão.
 */
function penugem(ctx, pts, w, palette) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(0.4, w * 0.04);

  const step = Math.max(3.5, w * 0.4);
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const ux = dx / len;
    const uy = dy / len;

    for (let d = 0; d < len; d += step) {
      const r = noise(a.x + d * 1.3, a.y + d * 2.1);
      if (r > 0.62) continue;
      const cx = a.x + ux * d;
      const cy = a.y + uy * d;
      const lado = r < 0.31 ? 1 : -1;
      const nx = -uy * lado;
      const ny = ux * lado;
      const comp = w * (0.06 + r * 0.28);
      const inclina = (r - 0.31) * 3;

      ctx.strokeStyle = css(palette.lightRgb, 0.1 + r * 0.35);
      ctx.beginPath();
      ctx.moveTo(cx + nx * w * 0.4, cy + ny * w * 0.4);
      ctx.lineTo(
        cx + nx * (w * 0.4 + comp) + ux * comp * inclina,
        cy + ny * (w * 0.4 + comp) + uy * comp * inclina,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * A fibra da superfície. É o que separa algodão de tubo liso: sulco periódico
 * dá a torção, mas sem fibra por cima a corda continua sendo um cilindro
 * renderizado. Só vale a pena acima de certa espessura — abaixo dela a fibra
 * some no pixel e só custa quadro.
 */
function fibras(ctx, pts, w, palette) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(0.6, w * 0.055);

  const step = Math.max(2.2, w * 0.14);
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    for (let d = 0; d < len; d += step) {
      const r = noise(a.x * 0.7 + d * 3.1, a.y * 1.9 + d);
      const off = (r - 0.5) * w * 0.62;
      const cx = a.x + ux * d + nx * off;
      const cy = a.y + uy * d + ny * off;
      // A fibra corre no sentido da torção, não no do eixo.
      const comp = w * (0.18 + r * 0.3);
      const ex = ux * comp * 0.55 + nx * comp * 0.85;
      const ey = uy * comp * 0.55 + ny * comp * 0.85;

      ctx.strokeStyle = css(r > 0.5 ? palette.lightRgb : palette.edgeRgb, 0.16 + r * 0.26);
      ctx.beginPath();
      ctx.moveTo(cx - ex * 0.5, cy - ey * 0.5);
      ctx.lineTo(cx + ex * 0.5, cy + ey * 0.5);
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
      { x: x + spread + drift, y: yBottom - rand() * (yBottom - yTop) * 0.22 },
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
