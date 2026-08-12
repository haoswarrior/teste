import { cord, fray, seeded } from "./cord.js";

/**
 * A amostra de cada peça, gerada da ficha técnica dela.
 *
 * Não é foto: é a mesma malha de nó quadrado alternado do topo, montada na
 * forma que a peça tem. A forma importa — desenhar um painel ao lado da
 * palavra "bolsa" seria a página mentindo sobre o produto.
 */
export function drawSwatch(canvas, { palette, forma = "painel", rows = 5, openFrom = 99, arc = 0 } = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const ctxo = { ctx, w, h, palette, rand: seeded(4711) };
  if (forma === "bolsa") return bolsa(ctxo);
  if (forma === "vaso") return vaso(ctxo);
  return painel(ctxo, { rows, openFrom, arc, cortina: forma === "cortina" });
}

/** A malha de nó quadrado alternado, comum a todas as formas. */
function malha(ctx, { count, baseX, rowY, rows, spacing, cw, palette, twist = false }) {
  const pairOf = (j, r) => {
    const off = r % 2;
    const idx = j - off;
    if (idx < 0) return null;
    const a = off + Math.floor(idx / 2) * 2;
    if (a + 1 >= count) return null;
    return { a, cx: (baseX(a) + baseX(a + 1)) / 2 };
  };

  for (let r = 0; r < rows; r += 1) {
    for (let j = r % 2; j + 1 < count; j += 2) {
      const p = pairOf(j, r);
      if (!p || p.a !== j) continue;
      cord(
        ctx,
        [
          { x: p.cx - spacing * 0.28, y: rowY(r) },
          { x: p.cx, y: rowY(r) + cw * 0.12 },
          { x: p.cx + spacing * 0.28, y: rowY(r) },
        ],
        cw * 1.3,
        palette,
        { twist },
      );
    }
  }
  return pairOf;
}

/** Painel de parede e cortina: bastão em cima, trama, franja embaixo. */
function painel({ ctx, w, h, palette, rand }, { rows, openFrom, arc, cortina }) {
  const count = 8;
  const spacing = w / (count + 0.6);
  const cw = spacing * 0.3;
  const x0 = (w - (count - 1) * spacing) / 2;
  const baseX = (j) => x0 + j * spacing;

  const barY = Math.max(9, h * 0.045);
  const rowH = spacing * 1.12;
  const rowY = (r) => {
    let y = barY + rowH;
    for (let i = 1; i <= r; i += 1) y += rowH * (i >= openFrom ? 1.75 : 1);
    return y;
  };

  const lastRow = rowY(rows - 1);
  // O arco não é corte: sai da diferença de comprimento das cordas.
  const hem = (j) => {
    const t = (j / (count - 1)) * 2 - 1;
    return lastRow + spacing * (cortina ? 0.5 : 0.9) + arc * (1 - t * t);
  };

  bastao(ctx, w, barY, cw, palette);

  const pairOf = (j, r) => {
    const off = r % 2;
    const idx = j - off;
    if (idx < 0) return null;
    const a = off + Math.floor(idx / 2) * 2;
    if (a + 1 >= count) return null;
    return { cx: (baseX(a) + baseX(a + 1)) / 2 };
  };

  for (let j = 0; j < count; j += 1) {
    const pts = [{ x: baseX(j), y: barY }];
    for (let r = 0; r < rows; r += 1) {
      const p = pairOf(j, r);
      pts.push({ x: p ? p.cx : baseX(j), y: rowY(r) });
    }
    pts.push({ x: baseX(j), y: hem(j) });
    cord(ctx, pts, cw, palette, { twist: false });
  }

  malha(ctx, { count, baseX, rowY, rows, spacing, cw, palette });

  for (let j = 0; j < count; j += 1) fray(ctx, baseX(j), hem(j), h - 4, cw, palette, rand);
}

/** Bolsa: alça em arco, corpo em trama fechada, franja curta na base. */
function bolsa({ ctx, w, h, palette, rand }) {
  const count = 7;
  const spacing = (w * 0.78) / (count - 1);
  const cw = spacing * 0.3;
  const x0 = (w - (count - 1) * spacing) / 2;
  const baseX = (j) => x0 + j * spacing;

  const strapTop = h * 0.06;
  const mouth = h * 0.42;
  const rows = 3;
  const rowH = spacing * 1.05;
  const rowY = (r) => mouth + rowH * (r + 1);

  // A alça: uma corda só, subindo de um lado da boca ao outro.
  cord(
    ctx,
    [
      { x: baseX(0), y: mouth },
      { x: w * 0.5 - spacing * 1.6, y: strapTop + spacing * 0.5 },
      { x: w * 0.5, y: strapTop },
      { x: w * 0.5 + spacing * 1.6, y: strapTop + spacing * 0.5 },
      { x: baseX(count - 1), y: mouth },
    ],
    cw * 1.15,
    palette,
    { twist: false },
  );

  // A boca da bolsa, onde as cordas do corpo são montadas.
  cord(
    ctx,
    [
      { x: baseX(0) - cw, y: mouth },
      { x: baseX(count - 1) + cw, y: mouth },
    ],
    cw * 1.25,
    palette,
    { twist: false },
  );

  const pairOf = (j, r) => {
    const off = r % 2;
    const idx = j - off;
    if (idx < 0) return null;
    const a = off + Math.floor(idx / 2) * 2;
    if (a + 1 >= count) return null;
    return { cx: (baseX(a) + baseX(a + 1)) / 2 };
  };

  const fundo = rowY(rows - 1) + rowH * 0.7;
  for (let j = 0; j < count; j += 1) {
    const pts = [{ x: baseX(j), y: mouth }];
    for (let r = 0; r < rows; r += 1) {
      const p = pairOf(j, r);
      pts.push({ x: p ? p.cx : baseX(j), y: rowY(r) });
    }
    pts.push({ x: baseX(j), y: fundo });
    cord(ctx, pts, cw, palette, { twist: false });
  }

  malha(ctx, { count, baseX, rowY, rows, spacing, cw, palette });

  // O fundo fechado, e a franja curta que sobra dele.
  cord(
    ctx,
    [
      { x: baseX(0) - cw * 0.5, y: fundo },
      { x: w * 0.5, y: fundo + cw * 0.5 },
      { x: baseX(count - 1) + cw * 0.5, y: fundo },
    ],
    cw * 1.35,
    palette,
    { twist: false },
  );
  for (let j = 0; j < count; j += 1) {
    fray(ctx, baseX(j), fundo + cw * 0.4, Math.min(h - 4, fundo + h * 0.14), cw, palette, rand);
  }
}

/** Suporte para vaso: argola em cima, coluna de nós, berço e borla. */
function vaso({ ctx, w, h, palette, rand }) {
  const cx = w / 2;
  const cw = w * 0.045;
  const ringY = h * 0.08;
  const ringR = w * 0.09;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, ringY, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = palette.wood;
  ctx.lineWidth = cw * 1.1;
  ctx.stroke();
  ctx.restore();

  const colTop = ringY + ringR;
  const colBottom = h * 0.36;
  const berco = h * 0.62;
  const base = h * 0.74;
  const braco = w * 0.3;

  // Quatro braços: descem juntos, abrem no berço e voltam a se juntar embaixo.
  for (const s of [-1, 1]) {
    for (const inner of [0.45, 1]) {
      const dx = braco * inner * s;
      cord(
        ctx,
        [
          { x: cx + dx * 0.12, y: colTop },
          { x: cx + dx * 0.2, y: colBottom },
          { x: cx + dx, y: berco },
          { x: cx + dx * 0.55, y: base },
          { x: cx, y: base + cw * 1.2 },
        ],
        cw,
        palette,
        { twist: false },
      );
    }
  }

  // A coluna de nó quadrado logo abaixo da argola.
  for (let i = 0; i < 3; i += 1) {
    const y = colTop + ((colBottom - colTop) * (i + 0.5)) / 3;
    cord(
      ctx,
      [
        { x: cx - w * 0.075, y },
        { x: cx, y: y + cw * 0.15 },
        { x: cx + w * 0.075, y },
      ],
      cw * 1.35,
      palette,
      { twist: false },
    );
  }

  // O vaso que o berço segura.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - braco * 0.72, berco - h * 0.05);
  ctx.lineTo(cx + braco * 0.72, berco - h * 0.05);
  ctx.lineTo(cx + braco * 0.5, base - cw);
  ctx.lineTo(cx - braco * 0.5, base - cw);
  ctx.closePath();
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.restore();

  // Os nós do berço, que cruzam por cima do vaso e o seguram.
  for (const s of [-1, 1]) {
    const y = berco - h * 0.01;
    cord(
      ctx,
      [
        { x: cx + s * braco * 0.28, y },
        { x: cx + s * braco * 0.55, y: y + cw * 0.4 },
        { x: cx + s * braco * 0.82, y },
      ],
      cw * 1.2,
      palette,
      { twist: false },
    );
  }

  // A borla embaixo, onde os quatro braços se encontram.
  cord(
    ctx,
    [
      { x: cx - w * 0.06, y: base + cw * 1.2 },
      { x: cx, y: base + cw * 1.6 },
      { x: cx + w * 0.06, y: base + cw * 1.2 },
    ],
    cw * 1.5,
    palette,
    { twist: false },
  );
  for (let i = -2; i <= 2; i += 1) {
    fray(ctx, cx + i * cw * 1.1, base + cw * 1.8, h - 4, cw * 0.95, palette, rand);
  }
}

function bastao(ctx, w, y, cw, palette) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(w * 0.06, y - cw * 0.75, w * 0.88, cw * 1.5, cw);
  ctx.fillStyle = palette.wood;
  ctx.fill();
  ctx.restore();
}
