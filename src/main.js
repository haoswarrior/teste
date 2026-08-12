import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createWorld } from "./world.js";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.querySelector("#scene");
const world = createWorld(canvas);

gsap.ticker.add(world.render);
gsap.ticker.lagSmoothing(0);

window.addEventListener("resize", () => {
  world.resize();
  ScrollTrigger.refresh();
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Uma timeline única, "scrubbed" pelo scroll: o progresso da página é o tempo.
const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: "main",
    start: "top top",
    end: "bottom bottom",
    scrub: reduceMotion ? true : 1,
    onUpdate: (self) => {
      gsap.set("#progress-bar", { width: `${self.progress * 100}%` });
    },
  },
  defaults: { ease: "none" },
});

// A timeline dura 1 unidade; cada painel ocupa 1/4 dela.
const STEP = 1 / 4;

timeline
  .to(world.group.rotation, { y: Math.PI * 2, x: Math.PI * 0.6, duration: 1 }, 0)
  .to(world.camera.position, { z: 5.4, y: 0.6, duration: 1 }, 0)
  .to(world.stars.rotation, { y: Math.PI * 0.8, duration: 1 }, 0)
  .to(world.wire.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 1 }, 0)
  .to(world.wire.material, { opacity: 0.75, duration: 1 }, 0)
  // O objeto troca de lado acompanhando o alinhamento de cada painel.
  .to(world.layout, { side: -1, duration: STEP, ease: "power2.inOut" }, STEP * 0.7)
  .to(world.layout, { side: 1, duration: STEP, ease: "power2.inOut" }, STEP * 1.7)
  .to(world.layout, { side: -1, duration: STEP, ease: "power2.inOut" }, STEP * 2.7)
  .to(world.scene.fog, { near: 3.5, far: 12, duration: STEP }, STEP * 3);

// Entrada de cada painel de texto, independente da timeline da cena.
gsap.utils.toArray(".panel").forEach((panel) => {
  gsap.from(panel.children, {
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: panel,
      start: "top 70%",
      toggleActions: "play none none reverse",
    },
  });
});

// Respiração leve do objeto, independente do scroll.
if (!reduceMotion) {
  gsap.to(world.solid.scale, {
    x: 1.06,
    y: 1.06,
    z: 1.06,
    duration: 3,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
  });
}
