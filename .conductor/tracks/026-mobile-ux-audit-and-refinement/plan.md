# Track 026: Auditoria Completa de UI/UX Mobile (Layout, Linhas, Colunas, Safe-Areas e Modais)

## 🎯 Objetivo
Realizar uma auditoria visual e de usabilidade estrita com foco em dispositivos móveis (smartphones com viewport 390x844 e 412x915).
Verificar:
1. Alinhamento de colunas, grades e empilhamento vertical (stacking) no mobile.
2. Comportamento do novo modal de pré-decisão (`SecretSantaChoiceModal`) no celular (altura, scroll, legibilidade dos cards, áreas de toque).
3. Espaçamento, quebra de texto, contrastes e safe-areas (iOS bottom home bar e Android).
4. Sorteador relâmpago e envelope lacrado em tela vertical.
5. Capturar screenshots reais das telas móveis e salvar no diretório de artefatos para apresentação ao usuário.

---

## 📋 Checklist de Auditoria
- [x] Script de captura Playwright com emulação mobile real (iPhone 14 / Pixel 7)
- [x] Tela 1: Landing Page do Amigo Secreto (`/amigo-secreto`)
- [x] Tela 2: Modal de Pré-Decisão aberto (`SecretSantaChoiceModal`)
- [x] Tela 3: Sorteador Relâmpago (`/amigo-secreto/rapido`)
- [x] Tela 4: Envelope Lacrado com Selo de Cera (`/envelope/:token`)
- [x] Tela 5: Home Geral (`/`)
- [x] Análise heurística detalhada dos pontos fortes e oportunidades de refinamento (Relatório em `mobile-ux-audit-report.md`)
