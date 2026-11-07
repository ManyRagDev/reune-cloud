# Track 030: Integração com Google Analytics 4 (GA4)

## Contexto & Objetivo
Integrar o Google Analytics 4 (ID de Medição: `G-KKX5FSRGFP`) de forma nativa e performática no ecossistema ReUNE e Amigo Secreto, garantindo rastreamento automático de navegação em Single Page Application (SPA) e eventos-chave de conversão.

---

## Fases de Execução

### Fase 1: Configuração Base & Tipagem
- [x] 1.1 Inserir script oficial do Google Analytics (`gtag.js`) no `<head>` do `index.html` e `amigo-secreto.html` com o ID `G-KKX5FSRGFP`.
- [x] 1.2 Criar utilitário `src/lib/analytics.ts` com tipagem TypeScript para `window.gtag`, suporte a `pageview` e envio de eventos customizados (`trackEvent`).

### Fase 2: Rastreamento SPA (Rotas)
- [x] 2.1 Criar componente `src/components/AnalyticsTracker.tsx` utilizando `useLocation` do `react-router-dom`.
- [x] 2.2 Integrar `AnalyticsTracker` dentro do `<BrowserRouter>` em `src/App.tsx` para disparar `page_view` a cada mudança de rota (ReUNE `/`, `/amigo-secreto`, `/sorteio-rapido`, etc.).

### Fase 3: Rastreamento de Eventos-Chave (Conversões)
- [x] 3.1 Rastrear interações na Landing Page de Amigo Secreto (`SecretSantaLanding.tsx`): clique nos botões de CTA principais e aberturas de modal.
- [x] 3.2 Rastrear escolhas no Modal de Decisão (`SecretSantaChoiceModal.tsx`): escolha do modo Relâmpago vs Modo Completo (Com Conta).
- [x] 3.3 Rastrear conclusões de sorteio no Sorteador Relâmpago (`QuickSecretSanta.tsx`), envelopes lacrados (`QuickSecretSantaEnvelope.tsx`) e cliques no envio de WhatsApp (`SecretSantaShareModal.tsx`).
- [x] 3.4 Rastrear cliques nos CTAs principais do ReUNE na landing page (`LandingV3.tsx`).

### Fase 4: Verificação & Qualidade
- [x] 4.1 Criar testes unitários automatizados para a suíte de analytics (`tests/unit/analytics.test.ts`).
- [x] 4.2 Executar `npm run type-check` para garantir integridade do TypeScript.
- [x] 4.3 Executar `npm run test:unit` (194 testes passando).
- [x] 4.4 Executar `npm run build` para validar que o build do Vite passa sem erros.
