# Scroll World

Experimento com a stack de frontend design: **Vite + GSAP (ScrollTrigger) + Three.js**.

Uma cena WebGL fixa no fundo, dirigida por uma única timeline do GSAP que é
"scrubbed" pelo scroll da página — câmera, malha, wireframe, campo de pontos e
neblina avançam junto com o texto.

## Rodando

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # serve o build
```

## Estrutura

| Arquivo          | Papel                                                              |
| ---------------- | ------------------------------------------------------------------ |
| `index.html`     | Canvas fixo + painéis de texto que definem a altura do scroll       |
| `src/world.js`   | Cena Three.js: geometria deformada, wireframe, pontos, luzes        |
| `src/main.js`    | ScrollTrigger, timeline única e animações de entrada dos painéis    |
| `src/styles.css` | Layout dos painéis, tipografia e barra de progresso                 |

## Skill de design

`.claude/skills/frontend-design/` traz a skill oficial `frontend-design` da
Anthropic ([anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)),
instalada como skill de projeto — ela carrega sozinha em qualquer sessão do
Claude Code aberta neste repositório, sem precisar instalar o plugin de novo.

## Notas de implementação

- O `render` do Three.js roda no `gsap.ticker`, então há um único loop de frame
  para tudo — sem `requestAnimationFrame` concorrente.
- `prefers-reduced-motion` desliga o scrub suave e a animação de respiração.
- `ScrollTrigger.refresh()` no resize mantém os pontos de trigger corretos
  quando a altura do viewport muda (barra de endereço no mobile, por exemplo).
