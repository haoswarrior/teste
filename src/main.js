import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/archivo/400.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./styles.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createWorld } from "./world.js";
import { createDrawing } from "./drawing.js";
import { PARTIALS } from "./profile.js";

gsap.registerPlugin(ScrollTrigger);

const world = createWorld(document.querySelector("#stage"));
const drawing = createDrawing(document.querySelector("#plate"), world);

// Um único loop de frame: o Three.js renderiza dentro do ticker do GSAP.
gsap.ticker.add(world.render);
gsap.ticker.lagSmoothing(0);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let introPlayed = false;

function relayout() {
  world.resize();
  drawing.layout();
  if (introPlayed || reduceMotion) {
    gsap.set("#plate .curve", { strokeDashoffset: 0 });
  }
  ScrollTrigger.refresh();
}

relayout();
window.addEventListener("resize", relayout);

// A curva se desenha na chegada: é a tese da página, então ela abre sozinha.
if (reduceMotion) {
  gsap.set("#plate .curve", { strokeDashoffset: 0 });
  introPlayed = true;
} else {
  gsap.to("#plate .curve", {
    strokeDashoffset: 0,
    duration: 1.8,
    ease: "power2.inOut",
    delay: 0.25,
    onComplete: () => {
      introPlayed = true;
    },
  });
}

// O sino gira devagar ao longo de toda a página — uma peça de revolução vista
// por todos os lados.
gsap.to(world.bell.rotation, {
  y: Math.PI * 1.6,
  ease: "none",
  scrollTrigger: {
    trigger: "main",
    start: "top top",
    end: "bottom bottom",
    scrub: reduceMotion ? true : 0.8,
  },
});

// O momento único: na fusão, o metal líquido acende por baixo e esfria.
// `emissive` é um THREE.Color, então os canais são animados um a um — passar
// um hex aqui substituiria o objeto por um número e apagaria o material.
const emissive = world.shell.material.emissive;

gsap
  .timeline({
    scrollTrigger: {
      trigger: '[data-step="fusao"]',
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
  })
  .to(world.forge, { intensity: 22, ease: "power2.in" }, 0)
  .to(emissive, { r: 0.34, g: 0.11, b: 0.02, ease: "power2.in" }, 0)
  .to(world.forge, { intensity: 0, ease: "power2.out" }, ">")
  .to(emissive, { r: 0, g: 0, b: 0, ease: "power2.out" }, "<");

// Na afinação, os cinco parciais acendem na ordem em que o afinador os corta:
// de baixo (nominal, no cordão) para cima (hum, no ombro).
const order = [...PARTIALS].map((p) => p.name);

ScrollTrigger.create({
  trigger: '[data-step="afinacao"]',
  start: "top 65%",
  end: "bottom 35%",
  scrub: true,
  onUpdate: (self) => {
    const lit = Math.floor(self.progress * (order.length + 0.4));
    drawing.marks.forEach(({ partial, group }) => {
      const live = order.indexOf(partial.name) < lit;
      group.classList.toggle("is-live", live);
      // O anel correspondente acende na peça: a guia e o corte são o mesmo
      // ponto, um na chapa e outro no bronze.
      const ring = world.rings.find((r) => r.userData.partial === partial.name);
      if (ring) gsap.to(ring.material, { opacity: live ? 0.85 : 0.12, duration: 0.35 });
    });
  },
  onLeaveBack: () => {
    drawing.marks.forEach(({ group }) => group.classList.remove("is-live"));
    world.rings.forEach((r) => gsap.to(r.material, { opacity: 0.12, duration: 0.35 }));
  },
});

// Entrada de cada passo. Curta e igual para todos — o protagonismo é da chapa.
gsap.utils.toArray(".step").forEach((step) => {
  gsap.from(step.children, {
    y: 18,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: "power2.out",
    scrollTrigger: {
      trigger: step,
      start: "top 72%",
      toggleActions: "play none none reverse",
    },
  });
});
