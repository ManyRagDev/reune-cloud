# Track 025: Redesign de UX do Modal de Escolha de Amigo Secreto (Link de Grupo vs Sorteador Relâmpago)

## 🎯 Objetivo
Eliminar a ambiguidade de experiência identificada pelo usuário no modal de pré-decisão (`SecretSantaChoiceModal.tsx`).
Atualmente, usuários que buscam a praticidade de "gerar 1 link para colar no grupo do WhatsApp" acabam clicando na opção "Sem cadastro" (por estar à esquerda e parecer a mais rápida), frustrando-se ao descobrir que ela exige digitar todos os nomes e enviar links individuais no privado.

O objetivo é:
1. Reordenar a hierarquia visual (colocar a Suíte Completa com Link de Grupo em primeiro lugar / topo).
2. Esclarecer a mecânica exata de cada fluxo com um micro-passo a passo visual (1-2-3).
3. Mostrar que o ReUNE é muito mais do que um "sorteador básico de papelzinho" (apresentando lista de desejos, festa com mapa no Uber/Waze e painel de confirmações).
4. Manter a opção "Chega e Faz" (Sorteador Relâmpago) acessível e transparente como uma alternativa para quem já tem a lista de nomes pronta.

---

## 📐 Alterações de Interface (`SecretSantaChoiceModal.tsx`)

### 1. Inversão e Destaque da Suíte Completa (Card 1 - Esquerda / Topo):
- **Badge:** `⭐ MAIS USADO EM GRUPOS • 1 LINK`
- **Título:** `Link Único para o Grupo`
- **Subtítulo:** `A galera entra sozinha pelo WhatsApp e escolhe o que quer ganhar.`
- **Micro-Passo a Passo (Como funciona):**
  - `1. Crie o evento em 1 min (com valor e local da festa)`
  - `2. Cole 1 ÚNICO LINK no grupo do WhatsApp`
  - `3. Amigos entram sozinhos, põem lista de presentes e criam PIN`
  - `4. Você aperta "Sortear" quando todos entrarem`
- **Destaques de Valor do ReUNE:**
  - `✓ Lista de desejos (ninguém ganha meia repetida!)`
  - `✓ Festa da revelação com mapa integrado ao Uber/Waze`
  - `✓ Painel em tempo real para ver quem já confirmou`
- **CTA:** `Criar e Gerar Link do Grupo ➔` (Leva só 1 minuto • Amigos não precisam de conta)

### 2. Transparência do Sorteador Relâmpago (Card 2 - Direita / Abaixo):
- **Badge:** `⚡ CHEGA E FAZ • SEM CADASTRO`
- **Título:** `Sorteador Relâmpago`
- **Subtítulo:** `Para quem já tem a lista de nomes pronta e quer sortear agora.`
- **Micro-Passo a Passo (Como funciona):**
  - `1. Você digita a lista de nomes agora na tela`
  - `2. O sorteio acontece na hora (na tela do seu celular)`
  - `3. Você despacha o envelope individual no privado de cada um`
- **Destaques de Valor:**
  - `✓ Zero cadastro para você e amigos`
  - `✓ Envelopes digitais com selo de cera anti-espião`
  - `✓ Nem você sabe quem eles tiraram`
- **CTA:** `Digitar Nomes e Sortear na Hora ➔` (Envelopes individuais no privado)

---

## 📋 Checklist de Validação
- [ ] Compilação limpa via `npm run build`
- [ ] Teste visual de responsividade (Desktop centralizado e Mobile bottom-sheet)
- [ ] Teste dos botões de redirecionamento (`onSelectFull` e `onSelectQuick`)
- [ ] Commit e deploy na Vercel
