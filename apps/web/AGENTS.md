<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Session Summary — Gráfico Premium

### What changed
- **`apps/web/src/app/dashboard/page.tsx`**: Gráfico de projeção de preços melhorado:
  - Curva suave (Catmull-Rom → cubic bezier) no lugar de linhas retas
  - Animação de desenho da linha (`pathLength` do framer-motion)
  - Efeito glow atrás da linha via SVG `<filter>` com GaussianBlur
  - Marcadores de pontos com entrada escalonada (staggered) com efeito `backOut`
  - Tooltip animado com `AnimatePresence` + indicador de variação percentual (▲/▼)
  - Linha guia vertical com `strokeDasharray` e animação suave
  - Círculo de hover com pulso/anel ao redor (spring animation)
  - Área preenchida com fade-in animado

### Próximos passos sugeridos
- Testar seleção de insumo e verificar gráfico reflete o preço correto
- Verificar "Disparar Varredura Preditiva" com DeepSeek + dados reais
