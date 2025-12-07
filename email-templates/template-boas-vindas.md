# 📧 Template: Boas-Vindas ReUNE

## Metadados

- **Nome:** `boas_vindas`
- **Assunto:** Bem-vindo ao ReUNE! 🎉
- **Descrição:** E-mail de boas-vindas para novos leads da waitlist
- **Variáveis:** `{{nome}}`, `{{email}}`

---

## 📝 HTML Editável

Edite o conteúdo abaixo e depois use no Lovable ou no SQL:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- CABEÇALHO -->
          <tr>
            <td align="center" style="padding: 32px 20px 0;">
              <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">
                Olá{{#if nome}}, {{nome}}{{/if}}! 👋
              </h1>
            </td>
          </tr>

          <!-- CONTEÚDO PRINCIPAL -->
          <tr>
            <td style="padding: 24px 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Seja muito bem-vindo(a) ao <strong>ReUNE</strong>! 🎉
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Estamos muito felizes em ter você na nossa lista de espera. Em breve, você terá acesso à plataforma que vai revolucionar a forma de organizar eventos entre amigos!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">
                Fique de olho no seu e-mail ({{email}}) para novidades exclusivas e benefícios pelo seu acesso antecipado. ✨
              </p>
            </td>
          </tr>

          <!-- BOTÃO CTA -->
          <tr>
            <td align="center" style="padding: 8px 20px 32px;">
              <a href="https://reuneapp.com.br" style="display: inline-block; background-color: #f59e0b; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">
                Acessar o ReUNE
              </a>
            </td>
          </tr>

          <!-- RODAPÉ -->
          <tr>
            <td align="center" style="padding: 24px 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0;">
                <strong>ReUNE</strong> - Planejamento de eventos simplificado
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 4px 0;">
                reuneapp.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🎨 Guia de Estilo

### Cores
- **Amber (principal):** `#f59e0b` - Usado no botão CTA
- **Purple (secundária):** `#a855f7` - Disponível para destaques
- **Texto escuro:** `#1a1a1a` - Títulos e cabeçalhos
- **Texto médio:** `#374151` - Corpo do texto
- **Texto claro:** `#6b7280`, `#9ca3af` - Rodapé
- **Fundo página:** `#f6f9fc`
- **Fundo card:** `#ffffff`
- **Bordas:** `#e5e7eb`

### Tipografia
- **Font family:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Título (h1):** 28px, bold (700)
- **Corpo:** 16px, line-height 24px
- **Rodapé:** 14px e 12px

### Espaçamento
- **Padding externo:** 40px vertical, 20px horizontal
- **Padding card:** 32px, 24px, 20px
- **Margin entre parágrafos:** 16px

---

## 🔧 Variáveis Disponíveis

### `{{nome}}`
- **Tipo:** String (opcional)
- **Exemplo:** "Maria Silva"
- **Uso condicional:** `{{#if nome}}texto{{/if}}`
- **Fallback:** Se vazio, mostra só "Olá!"

### `{{email}}`
- **Tipo:** String (obrigatório)
- **Exemplo:** "maria@exemplo.com"
- **Uso:** Sempre presente, vem da waitlist

---

## 📋 Checklist de Edição

Antes de salvar as mudanças, verifique:

- [ ] Texto está claro e amigável
- [ ] Não há erros de português
- [ ] Variáveis `{{nome}}` e `{{email}}` estão nos lugares certos
- [ ] Botão CTA tem link correto (https://reuneapp.com.br)
- [ ] Cores seguem a identidade visual (amber/purple)
- [ ] E-mail é responsivo (largura máxima 600px)
- [ ] Emojis estão funcionando (👋 🎉 ✨)
- [ ] Rodapé tem informações corretas

---

## 🚀 Como Aplicar as Mudanças

### Método 1: Lovable
1. Copie o HTML editado acima
2. Cole no prompt do Lovable junto com as outras instruções
3. O Lovable criará a tabela com seu template atualizado

### Método 2: SQL Direto
1. Abra `SETUP_ADMIN_EMAIL_CENTER.sql`
2. Localize a linha 86 (início do template boas_vindas)
3. Substitua o HTML entre as aspas simples
4. Execute no Supabase SQL Editor

### Método 3: Via Admin (depois de configurado)
1. Acesse o Admin Email Center
2. Vá na tab "Templates"
3. Clique em "Editar" no template "boas_vindas"
4. Cole o novo HTML
5. Salve!

---

## 💡 Sugestões de Personalização

### Tom de Voz
- **Atual:** Profissional e acolhedor
- **Alternativa informal:** "E aí, {{nome}}! 🤙"
- **Alternativa formal:** "Prezado(a) {{nome}},"

### CTA (Call-to-Action)
- **Atual:** "Conhecer o ReUNE"
- **Alternativas:**
  - "Explorar a Plataforma"
  - "Saiba Mais"
  - "Ver Como Funciona"
  - "Começar Agora"

### Conteúdo Adicional
Você pode adicionar:
- 📸 Logo do ReUNE (imagem hospedada)
- 📊 Estatísticas/benefícios em bullets
- 🎁 Bônus para early adopters
- 📱 Links para redes sociais
- 🎬 GIF ou vídeo de demonstração

---

**✨ Quando terminar de editar, me avise para atualizarmos os arquivos!**
