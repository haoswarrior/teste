# Meia-secção

Um sino de bronze, do desenho ao toque. **Vite + GSAP (ScrollTrigger) + Three.js**.

A página tem dois campos: à esquerda a chapa técnica em barro claro, à direita o
chão de fundição em grafite. O sino fica na divisa, e as guias dos cinco
parciais atravessam de um campo ao outro — cada uma parando na altura exata em
que o afinador tira metal.

O ponto é que o desenho e a peça não são duas coisas parecidas: `src/profile.js`
é lido pelo `LatheGeometry` do Three.js e pelo `<path>` do SVG. Um array, duas
leituras.

## Rodando

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # serve o build
```

## Estrutura

| Arquivo          | Papel                                                          |
| ---------------- | -------------------------------------------------------------- |
| `src/profile.js` | O perfil do sino e os cinco parciais — a fonte única            |
| `src/world.js`   | Cena Three.js: torno, bronze, anéis dos parciais, luz de forja  |
| `src/drawing.js` | A chapa em SVG e a projeção que alinha guia e peça em pixels    |
| `src/main.js`    | ScrollTrigger: rotação, o momento da fusão, os parciais acesos  |
| `src/styles.css` | Os dois campos, tipografia e a chapa                            |

## Design

Passado pela skill `frontend-design` (ver abaixo). Direção: uma fundição de
sinos. A paleta sai dos materiais — barro de molde, bronze frio, pátina, e o
amarelo do metal líquido, que aparece uma vez só, na fusão. Cinzel nos títulos
porque sino se inscreve em capitulares romanas; IBM Plex Mono nos dados.

O elemento assinatura são as guias cruzando a divisa. Em retrato não há divisa,
então a meia-secção é desenhada por cima da própria peça — que é literalmente o
que o termo quer dizer.

## Skill de design

`.claude/skills/frontend-design/` traz a skill oficial `frontend-design` da
Anthropic ([anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)),
instalada como skill de projeto — ela carrega sozinha em qualquer sessão do
Claude Code aberta neste repositório, sem precisar instalar o plugin de novo.

## Notas de implementação

- O `render` do Three.js roda no `gsap.ticker`: um único loop de frame.
- A câmera não está no grafo da cena, então `syncMatrices()` atualiza a inversa
  dela à mão antes de projetar pontos do sino em pixels.
- `emissive` é um `THREE.Color`: os canais são animados um a um. Passar um hex
  ao GSAP substituiria o objeto por um número e apagaria o material.
- `PLATE_FRACTION` em `drawing.js` é a única definição da divisa; o CSS recebe
  o valor por custom property.
- `prefers-reduced-motion` desliga o scrub suave e a curva já entra desenhada.
