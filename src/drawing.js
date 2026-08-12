import * as THREE from "three";
import { OUTER, PARTIALS, BELL_HEIGHT, MOUTH_RADIUS } from "./profile.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Onde a chapa clara termina e o chão de fundição começa. O CSS lê daqui. */
export const PLATE_FRACTION = 0.34;

function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

/**
 * Desenha a chapa técnica à esquerda e liga cada parcial ao ponto do sino em
 * que ele é afinado. As linhas atravessam a divisa dos campos porque é esse o
 * ponto da página: o desenho e a peça são a mesma coisa, vista duas vezes.
 */
export function createDrawing(svg, world) {
  const layer = {
    axis: el("line", { class: "axis" }),
    curve: el("path", { class: "curve" }),
    mouth: el("line", { class: "mouth" }),
  };

  svg.append(layer.axis, layer.mouth, layer.curve);

  const marks = PARTIALS.map((partial) => {
    const group = el("g", { class: "mark", "data-partial": partial.name });
    // A guia é cortada na divisa: tinta sobre o barro, giz sobre o escuro.
    const leadIn = el("line", { class: "lead lead-in" });
    const leadOut = el("line", { class: "lead lead-out" });
    const dot = el("circle", { class: "dot", r: 2.5 });
    const name = el("text", { class: "mark-name" });
    const value = el("text", { class: "mark-value" });
    name.textContent = partial.name;
    value.textContent = `${partial.note} · ${partial.hz.toFixed(2)} Hz`;
    group.append(leadIn, leadOut, dot, name, value);
    svg.append(group);
    return { partial, group, leadIn, leadOut, dot, name, value };
  });

  const point = new THREE.Vector3();

  /** Um ponto do sino (raio, altura) em pixels de tela. */
  function project(radius, height) {
    point.set(radius, height, 0).applyMatrix4(world.bell.matrixWorld);
    point.project(world.camera);
    return {
      x: ((point.x + 1) / 2) * window.innerWidth,
      y: ((1 - point.y) / 2) * window.innerHeight,
    };
  }

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    document.documentElement.style.setProperty(
      "--plate-w",
      `${PLATE_FRACTION * 100}vw`,
    );

    const narrow = w / h < 1;
    svg.classList.toggle("is-narrow", narrow);

    world.syncMatrices();

    // A escala vertical do desenho é a do sino projetado, para as linhas dos
    // parciais saírem horizontais e caírem no ponto certo da peça.
    const base = project(0, 0);
    const top = project(0, BELL_HEIGHT);
    const pxPerUnit = (base.y - top.y) / BELL_HEIGHT;
    // No retrato não há dois campos: a meia-secção é desenhada sobre a peça,
    // com o eixo no eixo do sino — que é literalmente o que "meia-secção" quer
    // dizer. As legendas saem, porque não há vão para elas.
    const axisX = narrow ? base.x : Math.max(88, w * 0.075);
    const seam = w * PLATE_FRACTION;

    const toX = (radius) => axisX + radius * pxPerUnit;
    const toY = (height) => base.y - height * pxPerUnit;
    // Coluna única para as legendas, à direita de toda a curva.
    const labelX = toX(MOUTH_RADIUS) + 20;

    layer.axis.setAttribute("x1", axisX);
    layer.axis.setAttribute("x2", axisX);
    layer.axis.setAttribute("y1", toY(BELL_HEIGHT + 0.2));
    layer.axis.setAttribute("y2", toY(-0.24));

    layer.mouth.setAttribute("x1", axisX);
    layer.mouth.setAttribute("x2", toX(1.14));
    layer.mouth.setAttribute("y1", base.y);
    layer.mouth.setAttribute("y2", base.y);

    const d = OUTER.map(
      ([r, y], i) => `${i === 0 ? "M" : "L"}${toX(r).toFixed(1)} ${toY(y).toFixed(1)}`,
    ).join(" ");
    layer.curve.setAttribute("d", d);
    layer.curve.style.setProperty("--len", layer.curve.getTotalLength());

    if (narrow) return;

    marks.forEach(({ partial, leadIn, leadOut, dot, name, value }) => {
      const y = toY(partial.height);
      const from = toX(radiusAt(partial.height));
      // A guia morre na silhueta do sino: é ali que o afinador tira metal.
      const to = project(-radiusAt(partial.height), partial.height).x - 5;

      leadIn.setAttribute("x1", from + 7);
      leadIn.setAttribute("x2", seam);
      leadIn.setAttribute("y1", y);
      leadIn.setAttribute("y2", y);

      leadOut.setAttribute("x1", seam);
      leadOut.setAttribute("x2", Math.max(seam + 24, to));
      leadOut.setAttribute("y1", y);
      leadOut.setAttribute("y2", y);

      dot.setAttribute("cx", from);
      dot.setAttribute("cy", y);
      name.setAttribute("x", labelX);
      name.setAttribute("y", y - 8);
      value.setAttribute("x", labelX);
      value.setAttribute("y", y + 15);
    });
  }

  return { layout, marks };
}

/** Raio do contorno externo numa altura, interpolado. */
function radiusAt(height) {
  for (let i = 0; i < OUTER.length - 1; i += 1) {
    const [x1, y1] = OUTER[i];
    const [x2, y2] = OUTER[i + 1];
    if ((height >= y1 && height <= y2) || (height <= y1 && height >= y2)) {
      const t = y2 === y1 ? 0 : (height - y1) / (y2 - y1);
      return x1 + (x2 - x1) * t;
    }
  }
  return 0.5;
}
