import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/karla";
import "./styles.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { drawPanel } from "./panel.js";
import { drawDivider } from "./divider.js";
import { drawSwatch } from "./swatch.js";
import { drawNo } from "./no.js";
import { combinacao, nomesDe } from "./cores.js";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A paleta da corda sai das mesmas custom properties do CSS: um só lugar
// define a cor, e o canvas e a folha de estilo leem dali.
const base = {};

/** Relê os tokens a cada repintura: madeira e barro saem do CSS. */
function readPalette() {
  const css = getComputedStyle(document.documentElement);
  const token = (name) => css.getPropertyValue(name).trim();
  Object.assign(base, {
    wood: token("--madeira"),
    woodGrain: token("--madeira-veio"),
    accent: token("--barro"),
  });
}
readPalette();

/** A combinação de fios do topo: cru com barro, mostarda e oliva. */
const paletasTopo = () => combinacao(["cru", "barro", "cru", "mostarda", "oliva"], base);

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
  drawPanel(panel, { gap: gap(), paletas: paletasTopo(), reveal: state.reveal, detail });
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
  const paint = () => drawDivider(canvas, { paletas: paletasTopo(), progress: st.progress });
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

// --- WhatsApp --------------------------------------------------------------
// Único lugar a preencher: o número da Vall, só dígitos, com país e DDD.
// Ex.: "5511987654321". Enquanto estiver vazio, o botão fica marcado como
// provisório e não leva a lugar nenhum — melhor que um link quebrado.
const WHATSAPP = "";
const RECADO = "Oi, Vall! Vim pelo site e queria saber sobre uma peça.";

const zap = document.querySelector("#whatsapp");
const zapNota = document.querySelector("#whatsapp-nota");

if (WHATSAPP) {
  zap.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(RECADO)}`;
  zap.rel = "noopener";
  zap.target = "_blank";
} else {
  zap.setAttribute("aria-disabled", "true");
  zap.classList.add("is-placeholder");
  zapNota.classList.add("is-placeholder");
  zapNota.textContent = "WhatsApp a definir";
  zap.addEventListener("click", (e) => e.preventDefault());
}

// --- As amostras das peças -------------------------------------------------
const swatches = [...document.querySelectorAll(".swatch")];

// A combinação de fios é declarada uma vez por peça: ela desenha a amostra e
// preenche a linha "Fios" da ficha. Um lugar só define a cor da peça.
swatches.forEach((c) => {
  const chaves = (c.dataset.cores || "cru").split(",");
  const ficha = c.closest(".piece")?.querySelector("[data-fios]");
  if (ficha) ficha.textContent = nomesDe(chaves);
});

const paintSwatches = () =>
  swatches.forEach((c) =>
    drawSwatch(c, {
      paletas: combinacao((c.dataset.cores || "cru").split(","), base),
      forma: c.dataset.forma,
      rows: Number(c.dataset.rows) || undefined,
      openFrom: Number(c.dataset.open) || undefined,
      arc: Number(c.dataset.arc) || 0,
    }),
  );
paintSwatches();

// --- O nó grande, dando e desfazendo ---------------------------------------
const noCanvas = document.querySelector("#no");
const noPaletas = () => combinacao(["barro", "cru", "oliva"], base);
const noEstado = { t: 1 };
const paintNo = () => drawNo(noCanvas, { paletas: noPaletas(), t: noEstado.t });
paintNo();

if (!reduceMotion) {
  gsap.to(noEstado, {
    t: 0.06,
    duration: 2.4,
    ease: "power2.inOut",
    repeat: -1,
    yoyo: true,
    repeatDelay: 1.1,
    onUpdate: paintNo,
  });
}

// Não há entrada de seção nem fade em card: o único movimento desta página é
// nó sendo dado — no topo e nas transições. Qualquer outra animação diluiria
// os dois momentos que importam.

// --- Redesenho ------------------------------------------------------------
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    readPalette();
    paintPanel();
    paintSwatches();
    paintNo();
    document
      .querySelectorAll(".divider")
      .forEach((c) => drawDivider(c, { paletas: paletasTopo(), progress: 1 }));
    ScrollTrigger.refresh();
  }, 120);
});
