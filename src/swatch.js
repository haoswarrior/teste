import { cord, fray, seeded } from "./cord.js";

/**
 * A amostra de cada peça, gerada da ficha técnica dela.
 *
 * Não é foto: é a mesma malha de nó quadrado alternado do topo, montada na
 * forma que a peça tem e nas cores de fio que ela usa. Forma e cor vêm da
 * ficha ao lado — mudou a ficha, muda o desenho.
 */
export function drawSwatch(
  canvas,
  { paletas, forma = "painel", rows = 5, openFrom = 99, arc = 0 } = {},
) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const o = { ctx, w, h, paletas, rand: seeded(4711) };
  if (forma === "bolsa") return bolsa(o);
  if (forma === "vaso") return vaso(o);
  return painel(o, { rows, openFrom, arc, cortina: forma === "cortina" });
}

/** Painel de parede e cortina: bastão em cima, trama, franja embaixo. */
function painel({ ctx, w, h, paletas, rand }, { rows, openFrom, arc, cortina }) {
  const count = 8;
  const spacing = w / (count + 0.6);
  const cw = spacing * 0.3;
  const x0 = (w - (count - 1) * spacing) / 2;
  const baseX = (j) => x0 + j * spacing;
  const pal = (j) => paletas[Math.floor(j / 2) % paletas.length];

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

  bastao(ctx, w, barY, cw, paletas[0]);

  const pairOf = (j, r) => {
    const off = r % 2;
    const idx = j - off;
    if (idx < 0) return null;
    const a = off + Math.floor(idx / 2) * 2;
    if (a + 1 >= count) return null;
    return { a, cx: (baseX(a) + baseX(a + 1)) / 2 };
  };

  for (let j = 0; j < count; j += 1) {
    const pts = [{ x: baseX(j), y: barY }];
    for (let r = 0; r < rows; r += 1) {
      const p = pairOf(j, r);
      pts.push({ x: p ? p.cx : baseX(j), y: rowY(r) });
    }
    pts.push({ x: baseX(j), y: hem(j) });
    cord(ctx, pts, cw, pal(j), { twist: false });
  }

  for (let r = 0; r < rows; r += 1) {
    for (let j = r % 2; j + 1 < count; j += 2) {
      const p = pairOf(j, r);
      if (p && p.a === j) colar(ctx, p.cx, rowY(r), spacing * 0.28, cw, pal(j));
    }
  }

  for (let j = 0; j < count; j += 1) fray(ctx, baseX(j), hem(j), h - 4, cw, pal(j), rand);
}

/** Bolsa: alça em arco, corpo em trama fechada, franja curta na base. */
function bolsa({ ctx, w, h, paletas, rand }) {
  const count = 7;
  const spacing = (w * 0.78) / (count - 1);
  const cw = spacing * 0.3;
  const x0 = (w - (count - 1) * spacing) / 2;
  const baseX = (j) => x0 + j * spacing;
  const pal = (j) => paletas[Math.floor(j / 2) % paletas.length];

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
    paletas[0],
    { twist: false },
  );

  cord(
    ctx,
    [
      { x: baseX(0) - cw, y: mouth },
      { x: baseX(count - 1) + cw, y: mouth },
    ],
    cw * 1.25,
    paletas[0],
    { twist: false },
  );

  const pairOf = (j, r) => {
    const off = r % 2;
    const idx = j - off;
    if (idx < 0) return null;
    const a = off + Math.floor(idx / 2) * 2;
    if (a + 1 >= count) return null;
    return { a, cx: (baseX(a) + baseX(a + 1)) / 2 };
  };

  const fundo = rowY(rows - 1) + rowH * 0.7;
  for (let j = 0; j < count; j += 1) {
    const pts = [{ x: baseX(j), y: mouth }];
    for (let r = 0; r < rows; r += 1) {
      const p = pairOf(j, r);
      pts.push({ x: p ? p.cx : baseX(j), y: rowY(r) });
    }
    pts.push({ x: baseX(j), y: fundo });
    cord(ctx, pts, cw, pal(j), { twist: false });
  }

  for (let r = 0; r < rows; r += 1) {
    for (let j = r % 2; j + 1 < count; j += 2) {
      const p = pairOf(j, r);
      if (p && p.a === j) colar(ctx, p.cx, rowY(r), spacing * 0.28, cw, pal(j));
    }
  }

  cord(
    ctx,
    [
      { x: baseX(0) - cw * 0.5, y: fundo },
      { x: w * 0.5, y: fundo + cw * 0.5 },
      { x: baseX(count - 1) + cw * 0.5, y: fundo },
    ],
    cw * 1.35,
    paletas[0],
    { twist: false },
  );
  for (let j = 0; j < count; j += 1) {
    fray(ctx, baseX(j), fundo + cw * 0.4, Math.min(h - 4, fundo + h * 0.14), cw, pal(j), rand);
  }
}

/** Suporte para vaso: argola em cima, coluna de nós, berço e borla. */
function vaso({ ctx, w, h, paletas, rand }) {
  const cx = w / 2;
  const cw = w * 0.045;
  const ringY = h * 0.08;
  const ringR = w * 0.09;
  const p0 = paletas[0];
  const p1 = paletas[1] || paletas[0];

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, ringY, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = p0.wood;
  ctx.lineWidth = cw * 1.1;
  ctx.stroke();
  ctx.restore();

  const colTop = ringY + ringR;
  const colBottom = h * 0.36;
  const berco = h * 0.62;
  const base = h * 0.74;
  const braco = w * 0.3;

  let k = 0;
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
        paletas[k++ % paletas.length],
        { twist: false },
      );
    }
  }

  for (let i = 0; i < 3; i += 1) {
    const y = colTop + ((colBottom - colTop) * (i + 0.5)) / 3;
    colar(ctx, cx, y, w * 0.075, cw, p0);
  }

  // O vaso que o berço segura.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - braco * 0.72, berco - h * 0.05);
  ctx.lineTo(cx + braco * 0.72, berco - h * 0.05);
  ctx.lineTo(cx + braco * 0.5, base - cw);
  ctx.lineTo(cx - braco * 0.5, base - cw);
  ctx.closePath();
  ctx.fillStyle = p0.accent;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.restore();

  for (const s of [-1, 1]) {
    colar(ctx, cx + s * braco * 0.55, berco - h * 0.01, braco * 0.27, cw, p1);
  }

  colar(ctx, cx, base + cw * 1.35, w * 0.06, cw * 1.15, p0);
  for (let i = -2; i <= 2; i += 1) {
    fray(ctx, cx + i * cw * 1.1, base + cw * 1.8, h - 4, cw * 0.95, paletas[(i + 2) % paletas.length], rand);
  }
}

/** O colar que fecha o nó: um arco curto e mais grosso que a corda. */
function colar(ctx, cx, cy, half, cw, palette) {
  cord(
    ctx,
    [
      { x: cx - half, y: cy },
      { x: cx, y: cy + cw * 0.12 },
      { x: cx + half, y: cy },
    ],
    cw * 1.3,
    palette,
    { twist: false },
  );
}

function bastao(ctx, w, y, cw, palette) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(w * 0.06, y - cw * 0.75, w * 0.88, cw * 1.5, cw);
  ctx.fillStyle = palette.wood;
  ctx.fill();
  ctx.restore();
}
