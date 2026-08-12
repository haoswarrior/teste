import { cord, fray, seeded } from "./cord.js";

/**
 * O painel do topo, gerado a partir de nós de verdade.
 *
 * A trama é nó quadrado alternado: a cada fileira o par de cordas muda de
 * lado, e é essa alternância — não um desenho — que abre os losangos.
 *
 * O vão do meio não é um buraco na trama: são duas peças montadas no mesmo
 * bastão, com espaço entre elas. Nenhuma corda atravessa o vão, porque nenhuma
 * corda atravessaria 40 cm de lado numa peça real.
 */
export function drawPanel(canvas, { gap, paletas, reveal = 1, detail = true, faixa = 3 } = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const rand = seeded(20260812);
  // A cor anda em faixas verticais, que é como um painel multicolor é montado:
  // o fio muda a cada punhado de cordas, não a cada corda.
  const pal = (j) => paletas[Math.floor(j / faixa) % paletas.length];

  const spacing = w < 700 ? 24 : Math.min(44, Math.max(30, w / 36));
  const cw = spacing * 0.3;
  const rowH = spacing * 1.12;

  const dowelY = Math.max(52, h * 0.08);
  const fringeTop = h * 0.7;
  const rows = Math.max(2, Math.floor((fringeTop - dowelY - rowH) / rowH));

  const margin = spacing * 0.8;
  const count = Math.max(4, Math.floor((w - margin * 2) / spacing));
  const x0 = (w - (count - 1) * spacing) / 2;
  const baseX = (j) => x0 + j * spacing;

  // Uma corda existe se não cai dentro do vão.
  const present = (j) => !gap || baseX(j) < gap.x1 || baseX(j) > gap.x2;
  const rowY = (r) => dowelY + rowH * (r + 1);

  /** O par de nó quadrado só se forma se as duas cordas existirem. */
  function partner(j, r) {
    const offset = r % 2;
    const idx = j - offset;
    if (idx < 0) return null;
    const a = offset + Math.floor(idx / 2) * 2;
    const b = a + 1;
    if (b >= count) return null;
    if (!present(a) || !present(b)) return null;
    return { a, b, cx: (baseX(a) + baseX(b)) / 2 };
  }

  const revealY = dowelY + (h - dowelY) * reveal;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, revealY);
  ctx.clip();

  for (let j = 0; j < count; j += 1) {
    if (!present(j)) continue;
    const pts = [{ x: baseX(j), y: dowelY }];
    for (let r = 0; r < rows; r += 1) {
      const pair = partner(j, r);
      pts.push({ x: pair ? pair.cx : baseX(j), y: rowY(r) });
    }
    pts.push({ x: baseX(j), y: fringeTop });
    // Durante a amarração as marcas de torção saem: são o custo do frame, e
    // ninguém as vê num quadro em movimento. Voltam no desenho final.
    cord(ctx, pts, cw, pal(j), { twist: detail });
  }

  // Os nós por cima, já que o nó cobre as cordas que entram nele.
  for (let r = 0; r < rows; r += 1) {
    for (let j = r % 2; j + 1 < count; j += 2) {
      const pair = partner(j, r);
      if (!pair || pair.a !== j) continue;
      square(ctx, pair.cx, rowY(r), spacing, cw, pal(pair.a));
    }
  }

  for (let j = 0; j < count; j += 1) {
    if (present(j)) fray(ctx, baseX(j), fringeTop, h - 6, cw, pal(j), rand);
  }
  ctx.restore();

  dowel(ctx, w, dowelY, spacing, paletas[0]);
}

/** O nó quadrado visto de frente: um colar horizontal sobre as duas cordas. */
function square(ctx, cx, cy, spacing, cw, palette) {
  const half = spacing * 0.3;
  cord(
    ctx,
    [
      { x: cx - half, y: cy },
      { x: cx, y: cy + cw * 0.1 },
      { x: cx + half, y: cy },
    ],
    cw * 1.25,
    palette,
    { twist: false },
  );

  // A costura no meio, onde as cordas de recheio passam por dentro.
  ctx.save();
  ctx.strokeStyle = palette.shadow;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(0.8, cw * 0.16);
  ctx.beginPath();
  ctx.moveTo(cx, cy - cw * 0.5);
  ctx.lineTo(cx, cy + cw * 0.6);
  ctx.stroke();
  ctx.restore();
}

/** O bastão de madeira de onde as duas peças penduram. */
function dowel(ctx, w, y, spacing, palette) {
  const r = spacing * 0.28;
  const inset = spacing * 0.2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(inset, y - r, w - inset * 2, r * 2, r);
  ctx.fillStyle = palette.wood;
  ctx.fill();

  ctx.clip();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = palette.woodGrain;
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    const gy = y - r + (r * 2 * (i + 0.5)) / 7;
    ctx.beginPath();
    ctx.moveTo(inset, gy);
    ctx.bezierCurveTo(w * 0.3, gy - 1.5, w * 0.6, gy + 1.5, w - inset, gy);
    ctx.stroke();
  }
  ctx.restore();
}
