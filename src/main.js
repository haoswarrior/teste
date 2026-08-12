import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/karla";
import "./styles.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { drawPanel } from "./panel.js";
import { drawDivider } from "./divider.js";
import { KNOTS } from "./knots.js";
import { drawSwatch } from "./swatch.js";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A paleta da corda sai das mesmas custom properties do CSS: um só lugar
// define a cor, e o canvas e a folha de estilo leem dali.
const css = getComputedStyle(document.documentElement);
const token = (name) => css.getPropertyValue(name).trim();

const palette = {
  body: token("--corda"),
  light: token("--corda-luz"),
  shadow: token("--corda-sombra"),
  wood: token("--madeira"),
  woodGrain: token("--madeira-veio"),
};

const panel = document.querySelector("#painel");
const heroText = document.querySelector("#hero-text");

/**
 * O vão entre as duas peças, medido no texto que vive nele. Em tela estreita
 * não há vão: a peça fica inteira, com o texto abaixo dela.
 */
function gap() {
  if (window.innerWidth < 760) return null;
  const a = panel.getBoundingClientRect();
  const b = heroText.getBoundingClientRect();
  const pad = 34;
  return { x1: b.left - a.left - pad, x2: b.right - a.left + pad };
}

const state = { reveal: reduceMotion ? 1 : 0 };

function paintPanel(detail = true) {
  drawPanel(panel, { gap: gap(), palette, reveal: state.reveal, detail });
}

paintPanel();

// --- A peça se amarra ------------------------------------------------------
// O único momento orquestrado da página: o bastão desce, as cordas caem dele e
// os nós vão se dando de cima para baixo. Tudo o mais fica quieto.
if (!reduceMotion) {
  const tie = gsap.timeline({ delay: 0.15 });

  tie.from(panel, { yPercent: -4, opacity: 0, duration: 0.7, ease: "power2.out" });
  tie.to(
    state,
    {
      reveal: 1,
      duration: 2.1,
      ease: "power2.inOut",
      onUpdate: () => paintPanel(false),
      onComplete: () => paintPanel(true),
    },
    0.1,
  );

  // O texto entra depois que a trama passa por ele, não antes.
  tie.from(
    heroText.children,
    { y: 26, opacity: 0, duration: 0.8, stagger: 0.09, ease: "power3.out" },
    0.9,
  );
}

// --- As transições entre seções -------------------------------------------
document.querySelectorAll(".divider").forEach((canvas) => {
  const st = { progress: reduceMotion ? 1 : 0 };
  const paint = () => drawDivider(canvas, { palette, progress: st.progress });
  paint();

  if (reduceMotion) return;
  gsap.to(st, {
    progress: 1,
    ease: "none",
    onUpdate: paint,
    scrollTrigger: {
      trigger: canvas,
      start: "top 92%",
      end: "bottom 55%",
      scrub: 0.6,
    },
  });
});

// --- Os quatro nós ---------------------------------------------------------
const knotCanvases = [...document.querySelectorAll("[data-knot]")];
const paintKnots = () =>
  knotCanvases.forEach((c) => KNOTS[c.dataset.knot]?.(c, palette));
paintKnots();

// --- As amostras das peças -------------------------------------------------
const swatches = [...document.querySelectorAll(".swatch")];
const paintSwatches = () =>
  swatches.forEach((c) =>
    drawSwatch(c, {
      palette,
      rows: Number(c.dataset.rows),
      openFrom: Number(c.dataset.open),
      arc: Number(c.dataset.arc),
    }),
  );
paintSwatches();

// Não há entrada de seção nem fade em card: o único movimento desta página é
// nó sendo dado — no topo e nas transições. Qualquer outra animação diluiria
// os dois momentos que importam.

// --- Redesenho ------------------------------------------------------------
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    paintPanel();
    paintKnots();
    paintSwatches();
    document
      .querySelectorAll(".divider")
      .forEach((c) => drawDivider(c, { palette, progress: 1 }));
    ScrollTrigger.refresh();
  }, 120);
});
