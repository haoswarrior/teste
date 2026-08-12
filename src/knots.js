import { cord } from "./cord.js";

/**
 * Os quatro nós, mostrados pelo que produzem.
 *
 * Um diagrama de construção não sobrevive a 230 px de largura — vira rabisco.
 * O que se reconhece nesse tamanho é a amostra: a malha do nó quadrado, a
 * coluna torcida do meio nó, a diagonal do festonê. É também a informação que
 * importa, porque é assim que o nó aparece na peça.
 */

function setup(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return null;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/** O colar que fecha o nó: um arco curto e mais grosso que a corda. */
function collar(ctx, cx, cy, half, cw, palette, angle = 0) {
  const dx = Math.cos(angle) * half;
  const dy = Math.sin(angle) * half;
  cord(
    ctx,
    [
      { x: cx - dx, y: cy - dy },
      { x: cx, y: cy + cw * 0.12 },
      { x: cx + dx, y: cy + dy },
    ],
    cw * 1.3,
    palette,
    { twist: false },
  );
}

/** Cabeça de cotovia: a alça abraça o bastão e as pontas descem por dentro. */
export function larksHead(canvas, palette) {
  const s = setup(canvas);
  if (!s) return;
  const { ctx, w, h } = s;
  const cw = w * 0.062;
  const barY = h * 0.22;
  const pairs = 2;
  const step = w * 0.34;
  const x0 = w / 2 - (step * (pairs - 1)) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(w * 0.07, barY - cw * 0.8, w * 0.86, cw * 1.6, cw);
  ctx.fillStyle = palette.wood;
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < pairs; i += 1) {
    const cx = x0 + i * step;
    const gap = w * 0.075;
    cord(
      ctx,
      [
        { x: cx - gap, y: h * 0.94 },
        { x: cx - gap, y: barY + h * 0.14 },
        { x: cx - gap * 1.25, y: barY - cw * 0.1 },
        { x: cx, y: barY - cw * 1.35 },
        { x: cx + gap * 1.25, y: barY - cw * 0.1 },
        { x: cx + gap, y: barY + h * 0.14 },
        { x: cx + gap, y: h * 0.94 },
      ],
      cw,
      palette,
    );
    collar(ctx, cx, barY + h * 0.14, gap * 1.6, cw, palette);
  }
}

/** Nó quadrado: alternado, abre a malha de losangos. É a base de tudo. */
export function squareKnot(canvas, palette) {
  const s = setup(canvas);
  if (!s) return;
  const { ctx, w, h } = s;

  const count = 6;
  const spacing = w * 0.145;
  const cw = spacing * 0.32;
  const x0 = (w - (count - 1) * spacing) / 2;
  const rows = 3;
  const rowH = h * 0.2;
  const top = h * 0.14;

  const baseX = (j) => x0 + j * spacing;
  const rowY = (r) => top + rowH * (r + 1);
  const pairOf = (j, r) => {
    const off = r % 2;
    const idx = j - off;
    if (idx < 0) return null;
    const a = off + Math.floor(idx / 2) * 2;
    if (a + 1 >= count) return null;
    return { a, cx: (baseX(a) + baseX(a + 1)) / 2 };
  };

  for (let j = 0; j < count; j += 1) {
    const pts = [{ x: baseX(j), y: top - rowH * 0.5 }];
    for (let r = 0; r < rows; r += 1) {
      const p = pairOf(j, r);
      pts.push({ x: p ? p.cx : baseX(j), y: rowY(r) });
    }
    pts.push({ x: baseX(j), y: h * 0.95 });
    cord(ctx, pts, cw, palette);
  }

  for (let r = 0; r < rows; r += 1) {
    for (let j = r % 2; j + 1 < count; j += 2) {
      const p = pairOf(j, r);
      if (p && p.a === j) collar(ctx, p.cx, rowY(r), spacing * 0.3, cw, palette);
    }
  }
}

/** Meio nó: sempre o mesmo lado, e a coluna torce. Daí a espiral. */
export function spiral(canvas, palette) {
  const s = setup(canvas);
  if (!s) return;
  const { ctx, w, h } = s;

  const cx = w / 2;
  const cw = w * 0.058;
  const amp = w * 0.17;
  const top = h * 0.1;
  const bottom = h * 0.94;
  const turns = 2.4;

  // As duas cordas de dentro descem retas; as de fora giram em volta delas.
  [-cw * 0.62, cw * 0.62].forEach((dx) => {
    cord(ctx, [{ x: cx + dx, y: top }, { x: cx + dx, y: bottom }], cw, palette);
  });

  const samples = 40;
  const path = (phase) => {
    const pts = [];
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const y = top + (bottom - top) * t;
      pts.push({ x: cx + Math.sin(t * Math.PI * 2 * turns + phase) * amp, y });
    }
    return pts;
  };

  cord(ctx, path(0), cw, palette);
  cord(ctx, path(Math.PI), cw, palette);

  // Os colares giram junto: é o que faz a coluna ler como espiral e não como
  // duas ondas soltas.
  const knots = 6;
  for (let i = 0; i < knots; i += 1) {
    const t = (i + 0.5) / knots;
    const y = top + (bottom - top) * t;
    const angle = t * Math.PI * 2 * turns;
    collar(ctx, cx, y, amp * 0.92, cw, palette, Math.sin(angle) * 0.42);
  }
}

/** Festonê: a guia inclinada manda na direção, e a linha vira diagonal. */
export function hitch(canvas, palette) {
  const s = setup(canvas);
  if (!s) return;
  const { ctx, w, h } = s;

  const count = 6;
  const spacing = w * 0.145;
  const cw = spacing * 0.32;
  const x0 = (w - (count - 1) * spacing) / 2;

  for (let j = 0; j < count; j += 1) {
    cord(ctx, [{ x: x0 + j * spacing, y: h * 0.08 }, { x: x0 + j * spacing, y: h * 0.94 }], cw, palette);
  }

  // A guia desce em vê, que é o desenho mais comum feito com este nó.
  const apex = { x: w / 2, y: h * 0.72 };
  const legs = [
    [{ x: x0 - spacing * 0.5, y: h * 0.28 }, apex],
    [apex, { x: x0 + (count - 0.5) * spacing, y: h * 0.28 }],
  ];
  legs.forEach((leg) => cord(ctx, leg, cw * 1.05, palette));

  // Cada corda dá duas voltas na guia, no ponto em que cruza com ela.
  for (let j = 0; j < count; j += 1) {
    const x = x0 + j * spacing;
    const t = Math.abs(x - apex.x) / (apex.x - (x0 - spacing * 0.5));
    const y = apex.y - (apex.y - h * 0.28) * t;
    [-cw * 0.5, cw * 0.5].forEach((dy) => {
      collar(ctx, x, y + dy, cw * 1.1, cw * 0.78, palette);
    });
  }
}

export const KNOTS = { larksHead, squareKnot, spiral, hitch };
