# Track 033: Novo Vídeo de Demonstração da Landing Page (Simulação de Criação de Evento + Notificação no Celular)

## 🎯 Objetivo
Substituir o vídeo antigo (`video_atual.mp4`) na página inicial do ReUNE (`LandingV3.tsx` na seção *"Como funciona em 30 segundos"*) por um novo vídeo moderno, dinâmico e de alta resolução (16:9 1080p).
O vídeo demonstrará o fluxo atual do ReUNE:
1. Alguém criando um evento rapidamente (ex: Churrasco para 20 pessoas no sábado).
2. A inteligência do ReUNE calculando/organizando o evento e exibindo a confirmação.
3. Um smartphone mockup ao lado recebendo a notificação instantânea do convite.
4. O convidado confirmando presença em 1 toque.
5. Fechamento com branding ReUNE.

---

## 🎬 Roteiro & Storyboard (Duração: ~25 a 30 segundos)

```
[00:00 - 00:06] CENA 1: Interface Web ReUNE (Criação Rápida)
├─ Mockup de tela limpa do ReUNE com cursor animado.
├─ Digitação: "Churrasco com a galera, sábado às 14h, 20 pessoas".
└─ A UNE.AI organiza instantaneamente as sugestões (carnes, bebidas, rateio).

[00:06 - 00:12] CENA 2: Confirmação do Evento
├─ Clique no botão "Confirmar Evento".
├─ Efeito de sucesso (badge verde, confetes sutis, link de convite gerado).
└─ Mensagem: "Evento criado com sucesso! Convites prontos para envio."

[00:12 - 00:22] CENA 3: O Smartphone do Convidado (Notificação & RSVP)
├─ Transição / Destaque para o mockup de Smartphone ao lado.
├─ Notificação estilo iOS/Android deslizando de cima com o ícone do ReUNE:
│   "🎉 Novo Convite: Churrasco com a galera! Toque para ver detalhes."
├─ Toque na notificação abre a tela do convite.
└─ Convidado clica em "Confirmar Presença" -> Check verde imediato!

[00:22 - 00:28] CENA 4: Dashboard em Tempo Real & Encerramento
├─ A tela web atualiza mostrando: "1 convidado confirmado".
├─ Logo ReUNE: "Organize seus eventos sem complicação. Crie grátis."
```

---

## 🛠️ Arquitetura & Implementação Técnica

1. **Cena de Animação em React (`src/pages/Simulations/LandingVideoScene.tsx`)**:
   - Desenvolvida com **Framer Motion + Tailwind CSS + Lucide Icons**.
   - Design moderno com mockups de alta definição (MacBook/Web Browser frame + iPhone 15 frame).
   - Linha do tempo automatizada com estado temporal (`time` / `step`) reproduzível e com botão de play/pause/reset.
   - Tipografia e cores estritamente alinhadas com a identidade visual do ReUNE.

2. **Pipeline de Gravação Automatizada (Playwright)**:
   - Script Node (`scripts/record-landing-video.mjs`) usando o Chromium do Playwright instalado no projeto.
   - Configura viewport Full HD (1920x1080), 60 FPS, gravação nativa de vídeo.
   - Roda a cena completa, grava o vídeo, otimiza e salva em `src/assets/video_atual.mp4` (e `.webm`).

3. **Integração na Landing Page (`LandingV3.tsx`)**:
   - Atualizar a tag `<video>` para ter suporte nativo moderno a `<source src={videoWebm} type="video/webm" />` e `<source src={videoMp4} type="video/mp4" />`, com autoplay quando em view ou controles fluidos, poster de alta resolução e carregamento instantâneo.

---

## 📋 Fases de Execução

- [x] **Fase 1: Cena React Motion** — Criar `LandingVideoScene.tsx` com os mockups (Browser + Smartphone), cursor animado, typing effect, notificação push e feedback de RSVP.
- [x] **Fase 2: Teste Visual Interativo** — Validar os timings, transições e legibilidade do texto na tela antes de exportar.
- [x] **Fase 3: Script de Gravação Playwright** — Executar a gravação automatizada em 1080p e gerar o arquivo de vídeo final.
- [x] **Fase 4: Substituição e Validação na Landing Page** — Integrar o novo vídeo em `LandingV3.tsx`, testar responsividade e performance de carregamento.
