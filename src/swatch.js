import { cord, fray, seeded } from "./cord.js";

/**
 * A amostra de cada peça, gerada da ficha técnica dela.
 *
 * Não é foto nem ilustração: é a mesma malha de nó quadrado do topo, com os
 * parâmetros que a peça declara — quantas fileiras fecham, onde a trama abre,
 * e quanto sobra de franja. Se a ficha mudar, a amostra muda junto.
 */
export function drawSwatch(canvas, { palette, rows = 5, openFrom = 1, arc = 0 } = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const rand = seeded(4711);
  const count = 8;
  const spacing = w / (count + 0.6);
  const cw = spacing * 0.3;
  const x0 = (w - (count - 1) * spacing) / 2;
  const baseX = (j) => x0 + j * spacing;

  const barY = Math.max(9, h * 0.045);
  const rowH = spacing * 1.12;
  // A partir de `openFrom` as fileiras espaçam: é assim que a trama "abre".
  const rowY = (r) => {
    let y = barY + rowH;
    for (let i = 1; i <= r; i += 1) y += rowH * (i >= openFrom ? 1.75 : 1);
    return y;
  };

  const pairOf = (j, r) => {
    const off = r % 2;
    const idx = j - off;
    if (idx < 0) return null;
    const a = off + Math.floor(idx / 2) * 2;
    if (a + 1 >= count) return null;
    return { a, cx: (baseX(a) + baseX(a + 1)) / 2 };
  };

  const lastRow = rowY(rows - 1);
  // O arco da barra não é corte: sai da diferença de comprimento das cordas.
  const hemAt = (j) => {
    const t = (j / (count - 1)) * 2 - 1;
    return lastRow + spacing * 0.9 + arc * (1 - t * t);
  };

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(spacing * 0.2, barY - cw * 0.75, w - spacing * 0.4, cw * 1.5, cw);
  ctx.fillStyle = palette.wood;
  ctx.fill();
  ctx.restore();

  for (let j = 0; j < count; j += 1) {
    const pts = [{ x: baseX(j), y: barY }];
    for (let r = 0; r < rows; r += 1) {
      const p = pairOf(j, r);
      pts.push({ x: p ? p.cx : baseX(j), y: rowY(r) });
    }
    pts.push({ x: baseX(j), y: hemAt(j) });
    cord(ctx, pts, cw, palette, { twist: false });
  }

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
        { twist: false },
      );
    }
  }

  for (let j = 0; j < count; j += 1) {
    fray(ctx, baseX(j), hemAt(j), h - 4, cw, palette, rand);
  }
}
