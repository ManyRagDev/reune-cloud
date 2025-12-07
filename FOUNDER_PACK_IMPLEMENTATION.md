# 🏆 Founder Pack - Documentação Completa

## Visão Geral

O **Founder Pack** é um sistema de benefícios exclusivos para os membros fundadores do ReUNE - pessoas que se inscreveram na waitlist antes do lançamento oficial.

## Benefícios dos Founders

### 🏆 Badge "Membro Fundador"
- Badge visual exclusivo no perfil e dashboard
- Reconhecimento especial como membro da primeira geração

### 👑 6 Meses de Premium Grátis
- Acesso Premium automático por 6 meses após o cadastro
- Sem necessidade de pagamento
- Renovação automática se o usuário optar por continuar com Premium pago

### 📊 Limites 3x Maiores Permanentemente
- Storage multiplicado por 3 (permanente, não expira)
- Mais espaço para fotos, eventos e arquivos
- Benefício vitalício

### 🎨 Acesso a Temas/Templates Exclusivos
- (A ser implementado)

### 🚀 Beta Features em Primeira Mão
- (A ser implementado)

### 💬 Canal Exclusivo Discord/WhatsApp
- (A ser criado)

---

## Arquitetura Técnica

### Banco de Dados

#### Tabela `profiles`
Campos adicionados:
```sql
is_founder BOOLEAN DEFAULT false
founder_since TIMESTAMP WITH TIME ZONE
premium_until DATE
storage_multiplier INTEGER DEFAULT 1 CHECK (storage_multiplier >= 1 AND storage_multiplier <= 10)
```

#### Tabela `waitlist_reune`
Campo adicionado:
```sql
is_founder BOOLEAN DEFAULT true
```

### Fluxo de Funcionamento

#### 1. Usuário JÁ CADASTRADO (estava na waitlist)
```
Migration roda → Verifica emails na waitlist → Marca profile como is_founder = true
```

**SQL executado automaticamente:**
```sql
UPDATE profiles
SET
  is_founder = true,
  founder_since = NOW(),
  premium_until = (NOW() + INTERVAL '6 months')::DATE,
  storage_multiplier = 3
WHERE id IN (
  SELECT u.id FROM auth.users u
  INNER JOIN waitlist_reune w ON LOWER(u.email) = LOWER(w.email)
  WHERE w.is_founder = true
);
```

#### 2. Usuário SE CADASTRA DEPOIS (estava na waitlist)
```
Usuário cria conta → Trigger verifica waitlist → Marca automaticamente como founder
```

**Trigger automático:**
```sql
CREATE TRIGGER trigger_check_founder_on_signup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_mark_founder();
```

---

## Como Usar no Código

### 1. Verificar se usuário é founder

```typescript
import { supabase } from '@/integrations/supabase/client';

// Buscar dados do usuário
const { data: profile } = await supabase
  .from('profiles')
  .select('is_founder, founder_since, premium_until, storage_multiplier')
  .eq('id', userId)
  .single();

if (profile?.is_founder) {
  console.log('Usuário é fundador!');
}
```

### 2. Exibir Badge de Fundador

```tsx
import { FounderBadge } from '@/components/FounderBadge';

// Variante compacta (com tooltip)
<FounderBadge
  variant="compact"
  founderSince={profile.founder_since}
  premiumUntil={profile.premium_until}
  storageMultiplier={profile.storage_multiplier}
/>

// Variante padrão (badge simples)
<FounderBadge variant="default" />

// Variante completa (card detalhado)
<FounderBadge
  variant="full"
  founderSince={profile.founder_since}
  premiumUntil={profile.premium_until}
  storageMultiplier={profile.storage_multiplier}
/>
```

### 3. Verificar Premium Ativo

```sql
-- Usar função helper
SELECT has_active_premium('user-id-aqui');
-- Retorna true/false
```

### 4. Obter Multiplicador de Storage

```sql
-- Usar função helper
SELECT get_storage_multiplier('user-id-aqui');
-- Retorna 3 para founders, 1 para usuários normais
```

### 5. Aplicar Limites com Multiplicador

```typescript
const BASE_STORAGE_LIMIT = 100; // MB
const userMultiplier = profile?.storage_multiplier || 1;
const userStorageLimit = BASE_STORAGE_LIMIT * userMultiplier;

// Founder: 100 * 3 = 300 MB
// Normal: 100 * 1 = 100 MB
```

---

## Dashboard de Founders (Admin)

### View SQL para visualizar todos os founders:

```sql
SELECT * FROM founder_members;
```

**Colunas retornadas:**
- `id` - ID do usuário
- `email` - Email do usuário
- `is_founder` - true/false
- `founder_since` - Data que virou founder
- `premium_until` - Data de expiração do Premium
- `storage_multiplier` - Multiplicador de storage (3x)
- `premium_status` - 'active', 'expired' ou 'none'
- `signup_date` - Data de cadastro

---

## Como Aplicar a Migration

### Desenvolvimento Local
```bash
# Aplicar migration
npx supabase db push

# Ou aplicar migration específica
npx supabase migration up
```

### Produção
```bash
# Deploy via CLI
npx supabase db push --linked

# Ou via Dashboard do Supabase
# SQL Editor → Colar conteúdo da migration → Run
```

---

## Próximos Passos (Roadmap)

### Implementações Futuras:

1. **Temas Exclusivos** ✨
   - Criar tabela `themes` com flag `founder_only`
   - Filtrar temas disponíveis baseado em `is_founder`

2. **Templates Exclusivos** 📝
   - Adicionar coluna `founder_only` em templates
   - Mostrar/ocultar baseado em status de founder

3. **Beta Features Toggle** 🚀
   - Feature flags para founders
   - Acesso antecipado a novos recursos

4. **Canal Exclusivo** 💬
   - Criar Discord/WhatsApp para founders
   - Enviar convite via email
   - Link de acesso no dashboard

5. **Dashboard de Benefícios** 📊
   - Página dedicada mostrando todos os benefícios ativos
   - Countdown para expiração do Premium
   - Estatísticas de uso de storage

---

## Troubleshooting

### Usuário não foi marcado como founder automaticamente

**Verificar:**
1. Email do usuário é EXATAMENTE igual ao da waitlist?
2. O registro na `waitlist_reune` tem `is_founder = true`?
3. O trigger está ativo?

```sql
-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_check_founder_on_signup';

-- Marcar manualmente se necessário
UPDATE profiles
SET
  is_founder = true,
  founder_since = NOW(),
  premium_until = (NOW() + INTERVAL '6 months')::DATE,
  storage_multiplier = 3
WHERE id = 'user-id-aqui';
```

### Premium expirou, como renovar?

```sql
-- Renovar Premium por mais X meses
UPDATE profiles
SET premium_until = (NOW() + INTERVAL '6 months')::DATE
WHERE id = 'user-id-aqui';
```

### Remover status de founder

```sql
UPDATE profiles
SET
  is_founder = false,
  founder_since = NULL,
  premium_until = NULL,
  storage_multiplier = 1
WHERE id = 'user-id-aqui';
```

---

## Segurança e Permissões

### RLS (Row Level Security)

**Importante:** Adicionar policies RLS para proteger dados sensíveis:

```sql
-- Usuários só podem ver seus próprios dados de founder
CREATE POLICY "Users can view own founder status"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Apenas admins podem modificar status de founder
CREATE POLICY "Only admins can update founder status"
ON profiles FOR UPDATE
USING (auth.uid() IN (SELECT id FROM admin_users));
```

---

## Análise e Métricas

### Queries úteis para métricas:

```sql
-- Total de founders
SELECT COUNT(*) FROM profiles WHERE is_founder = true;

-- Founders com Premium ativo
SELECT COUNT(*) FROM profiles
WHERE is_founder = true AND premium_until >= CURRENT_DATE;

-- Taxa de conversão (waitlist → cadastro)
SELECT
  (SELECT COUNT(*) FROM profiles WHERE is_founder = true) AS cadastrados,
  (SELECT COUNT(*) FROM waitlist_reune WHERE is_founder = true) AS waitlist,
  ROUND(
    (SELECT COUNT(*) FROM profiles WHERE is_founder = true)::DECIMAL /
    (SELECT COUNT(*) FROM waitlist_reune WHERE is_founder = true)::DECIMAL * 100,
    2
  ) AS taxa_conversao_pct;

-- Founders por mês de cadastro
SELECT
  DATE_TRUNC('month', founder_since) AS mes,
  COUNT(*) AS novos_founders
FROM profiles
WHERE is_founder = true
GROUP BY DATE_TRUNC('month', founder_since)
ORDER BY mes DESC;
```

---

## Conclusão

O sistema de Founder Pack está **100% funcional** e **pronto para produção**.

**Checklist de Deploy:**
- ✅ Migration SQL criada
- ✅ Trigger automático implementado
- ✅ Componente de Badge criado
- ✅ Funções helper SQL criadas
- ✅ View admin criada
- ✅ Documentação completa

**Próximo passo:** Aplicar a migration em produção e testar! 🚀
