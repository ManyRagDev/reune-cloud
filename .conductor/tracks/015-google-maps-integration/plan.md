# Track 015 — Integração com Google Maps (Autocomplete, Mapa e Rotas)

## Objetivo
Permitir que organizadores encontrem e selecionem locais com autocompletar do Google Places, visualizem a localização em um mapa com marcador interativo ao criar/editar eventos, e que convidados possam traçar rotas com um clique (Google Maps, Waze e Uber).

---

## Arquivos & Recursos Impactados
- **Banco de Dados (Supabase via MCP):**
  - Adição de `latitude` (`double precision`), `longitude` (`double precision`) e `place_id` (`text`) na `table_reune`.
- **Dependências Frontend:**
  - `@react-google-maps/api` (biblioteca React oficial e tipada para Google Maps & Places).
- **Novos Componentes (`src/components/maps/`):**
  - `GoogleAddressAutocomplete.tsx`: Input de busca com autocompletar do Google Places (com fallback gracioso para input comum caso a chave não carregue).
  - `EventMapPreview.tsx`: Container do mapa com pino no local do evento (estilizado no design system do app).
  - `DirectionsActions.tsx`: Botões "Como Chegar" (Google Maps Directions), "Waze" e "Pedir Uber".
- **Telas Impactadas:**
  - `src/hooks/useEvent.tsx`: Atualizar a interface `Event` com `latitude`, `longitude`, `place_id`.
  - `src/pages/CreateEvent.tsx`: Substituição do input de endereço pelo autocompletar do Google Maps + exibição do mapa dinâmico + persistência das coordenadas.
  - `src/pages/EventDetails.tsx`: Exibição do mapa interativo na seção de Local e botões de rota para convidados e organizadores.
  - Respeito à privacidade: ocultar o pino exato se o evento for público com endereço residencial não confirmado.

---

## Plano de Execução Detalhado

### Fase 1: Schema do Banco e Instalação de Dependências
- [x] **1.1 Migração no Supabase (via MCP):**
  - Adicionar colunas `latitude`, `longitude`, `place_id` na `table_reune`.
- [x] **1.2 Instalação e Configuração:**
  - Instalar `@react-google-maps/api` e `@types/google.maps`.
  - Configurar carregamento de bibliotecas (`places`, `geometry`).
- [x] **1.3 Tipagem:**
  - Atualizar interface `Event` em `src/hooks/useEvent.tsx`.

### Fase 2: Componentes Reutilizáveis de Mapas
- [x] **2.1 Criar `GoogleAddressAutocomplete`:**
  - Carregamento da Places API com restrição para o Brasil e suporte global.
  - Extração de endereço completo, cidade, bairro, latitude, longitude e place_id.
- [x] **2.2 Criar `EventMapPreview`:**
  - Renderização do mapa Google Maps com suporte a tema Dark/Light.
  - Marcador centralizado com pino personalizado.
- [x] **2.3 Criar `DirectionsActions`:**
  - Deeplinks universais para Google Maps (com coordenadas e place_id), Waze e Uber.

### Fase 3: Integração no Formulário e na Tela de Detalhes
- [x] **3.1 Atualizar `CreateEvent.tsx`:**
  - Conectar autocomplete ao estado de endereço, latitude e longitude.
  - Exibir mapa responsivo ao selecionar o local.
  - Gravar `latitude`, `longitude`, `place_id` no insert do Supabase.
- [x] **3.2 Atualizar `EventDetails.tsx`:**
  - Renderizar o mapa e os botões de traçar rota no modo de visualização.
  - Permitir edição de coordenadas no modo de edição do evento.
- [x] **3.3 Validação e Testes:**
  - Executar `npm run type-check`.
  - Executar `npm run test:unit`.
  - Executar `npm run build`.

---

## Critérios de Aceite (Definition of Done)
1. Ao digitar o endereço no `CreateEvent`, sugestões reais do Google Places aparecem e preenchem o endereço e coordenadas.
2. O mapa renderiza o pino exatamente no local selecionado.
3. As coordenadas (`latitude`, `longitude`, `place_id`) são salvas na `table_reune`.
4. Na tela `EventDetails`, o convidado/organizador visualiza o mapa e consegue clicar em "Como Chegar" abrindo o Google Maps com rota traçada.
5. `type-check`, `test:unit` e `build` compilam com 100% de sucesso.
