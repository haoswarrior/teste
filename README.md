# Nó Cru

Site de um ateliê de macramé. **Vite + GSAP (ScrollTrigger) + Canvas 2D**.

A tese da página é que macramé é feito de quatro nós e nada mais — então nada
aqui é imagem: o painel do topo, os quatro diagramas e as amostras das peças
são todos gerados pelo mesmo algoritmo de nó quadrado alternado.

## Rodando

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # serve o build
```

## Estrutura

| Arquivo           | Papel                                                        |
| ----------------- | ------------------------------------------------------------ |
| `src/cord.js`     | A primitiva: corda de algodão torcido, com sombra e torção    |
| `src/panel.js`    | O painel do topo — duas peças no mesmo bastão, com vão        |
| `src/knots.js`    | Os quatro nós, mostrados pelo que produzem                    |
| `src/swatch.js`   | A amostra de cada peça, gerada da ficha técnica dela          |
| `src/divider.js`  | A transição: corda esticada com os nós se dando ao longo dela |
| `src/main.js`     | GSAP: a sequência de amarração e as transições                |
| `src/styles.css`  | Paleta, tipografia e layout                                   |

## Design

Passado pela skill `frontend-design`.

**Paleta.** Boho tem um padrão de fábrica — fundo creme, serifada de alto
contraste, acento terracota — que é exatamente o visual que sai quando ninguém
decide nada. Aqui os pigmentos são os mesmos (barro, ocre, sálvia), mas a
estrutura de valor está invertida: fundo nogueira escura, e o algodão cru é que
carrega a luz. É como macramé de verdade se vê, numa parede escura, e é o que
atende o pedido de "vigoroso" sem deixar de ser boho.

**Tipografia.** Fraunces variável nos títulos, com os eixos `SOFT` e `WONK`
abertos — é o que tira a serifada do lugar editorial e a deixa feita à mão.
Karla no corpo. As fichas técnicas usam `tabular-nums`, porque são números que
se comparam entre peças.

**Movimento.** Um só vocabulário: nó sendo dado. Na chegada, a peça se amarra
de cima para baixo; entre as seções, a corda esticada recebe os nós da esquerda
para a direita. Não há fade de entrada em card nem em seção — eles diluiriam os
dois momentos que importam.

## Notas de implementação

- O vão do topo não é um buraco na trama: são duas peças no mesmo bastão.
  Nenhuma corda o atravessa, porque nenhuma corda atravessaria 40 cm de lado
  numa peça real. As primeiras versões desviavam as cordas em volta do vazio e
  produziam leques densos que não pareciam macramé.
- Os quatro nós são amostras do resultado, não diagramas de construção:
  diagrama não sobrevive a 230 px de largura.
- Durante a amarração as marcas de torção são desligadas — são o custo do
  frame, e ninguém as vê em movimento. Voltam no desenho final.
- A paleta da corda sai das mesmas custom properties do CSS, lidas em
  `main.js`: um só lugar define a cor.
- `prefers-reduced-motion` entrega tudo já amarrado.

## Skill de design

`.claude/skills/frontend-design/` traz a skill oficial `frontend-design` da
Anthropic ([anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)),
instalada como skill de projeto — carrega sozinha em qualquer sessão do Claude
Code aberta neste repositório.

## Antes disto

O commit `36cf761` traz outra página no mesmo repositório: **Meia-secção**, um
sino de bronze do desenho ao toque, em Three.js. Foi substituída, não perdida.
