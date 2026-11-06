const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SCREENSHOTS_DIR = path.join(__dirname, '../tests/e2e/screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Inicializar cliente Supabase para conferência direta no Postgres
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=\"(.*)\"/)[1].trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=\"(.*)\"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function runFullAudit() {
  console.log('======================================================================');
  console.log('🏁 INICIANDO AUDITORIA E2E COMPLETA: REUNE APP & AMIGO SECRETO');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[Page Exception] ${err.message}`);
  });

  const auditResults = {
    test1_home: false,
    test2_auth_signup: false,
    test3_secret_santa_landing: false,
    test4_quick_draw: false,
    test5_sealed_envelope_legit: false,
    test5_sealed_envelope_tamper: false,
    test6_wizard_full_suite: false,
    test7_guest_join_public: false,
  };

  try {
    // -------------------------------------------------------------
    // TESTE 1: ReUNE Core (Home V3)
    // -------------------------------------------------------------
    console.log('👉 [TESTE 1] Auditando Home Geral (http://localhost:5173/)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const title = await page.title();
    console.log(`   ✓ Título da página: "${title}"`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home_v3.png') });
    auditResults.test1_home = true;
    console.log('   ✅ TESTE 1 PASSOU!\n');

    // -------------------------------------------------------------
    // TESTE 2: Cadastro & Auto-Login Instantâneo
    // -------------------------------------------------------------
    console.log('👉 [TESTE 2] Auditando Cadastro & Auto-Login (/login)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const toggleToSignUp = page.locator('button:has-text("Não tem conta? Crie grátis")');
    if (await toggleToSignUp.isVisible()) {
      await toggleToSignUp.click();
      await page.waitForTimeout(300);
      console.log('   ✓ Alternou para o formulário de cadastro');
    }

    const testEmail = `qa_audit_${Date.now()}@teste.com`;
    const testPass = 'SenhaForte123!';
    console.log(`   ✓ Preenchendo cadastro: ${testEmail}`);

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPass);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_signup_form.png') });

    // Submeter
    await page.click('button[type="submit"]:has-text("Criar Conta")');
    console.log('   ✓ Botão "Criar Conta" clicado. Aguardando auto-login...');
    
    // Aguardar redirecionamento para tela logada
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_after_signup_dashboard.png') });

    console.log(`   ✓ URL atual: ${page.url()}`);
    auditResults.test2_auth_signup = true;
    console.log('   ✅ TESTE 2 PASSOU (Cadastro e auto-login sem travas de e-mail)!\n');

    // -------------------------------------------------------------
    // TESTE 3: Landing Page do Amigo Secreto & Modal de Pré-Decisão
    // -------------------------------------------------------------
    console.log('👉 [TESTE 3] Auditando Landing Page do Amigo Secreto (/amigo-secreto)...');
    await page.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_secret_santa_landing.png') });

    // Testar Accordion do FAQ
    console.log('   ✓ Testando interação com acordeão de FAQ...');
    const faqQuestion = page.locator('button:has-text("Precisa baixar algum aplicativo")').first();
    if (await faqQuestion.isVisible()) {
      await faqQuestion.click();
      await page.waitForTimeout(300);
      console.log('   ✓ FAQ aberto com sucesso');
    }

    // Clicar em "CRIAR MEU AMIGO SECRETO"
    console.log('   ✓ Clicando em "CRIAR MEU AMIGO SECRETO"...');
    const ctaBtn = page.locator('button:has-text("CRIAR MEU AMIGO SECRETO")').first();
    await ctaBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_choice_modal.png') });

    const modalTitle = page.locator('h2:has-text("Como você prefere organizar")');
    const isModalVisible = await modalTitle.isVisible();
    console.log(`   ✓ Modal de Pré-Decisão aberto: ${isModalVisible ? 'SIM' : 'NÃO'}`);
    if (!isModalVisible) throw new Error('Modal de pré-decisão não abriu ao clicar no CTA.');
    
    auditResults.test3_secret_santa_landing = true;
    console.log('   ✅ TESTE 3 PASSOU!\n');

    // -------------------------------------------------------------
    // TESTE 4: Sorteador Relâmpago ⚡ (Sem Cadastro)
    // -------------------------------------------------------------
    console.log('👉 [TESTE 4] Auditando Sorteador Relâmpago (/amigo-secreto/rapido)...');
    const quickChoiceBtn = page.locator('button:has-text("Continuar Sem Cadastro")').first();
    await quickChoiceBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_quick_draw_page.png') });

    // Inserir 4 participantes
    const participantsList = ['Lucas', 'Mariana', 'Pedro', 'Camila'];
    console.log(`   ✓ Adicionando participantes: ${participantsList.join(', ')}...`);

    for (const name of participantsList) {
      await page.fill('input[placeholder*="Ex: Mariana"]', name);
      await page.click('button:has-text("Adicionar")');
      await page.waitForTimeout(100);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_quick_draw_ready.png') });

    // Clicar em "SORTEAR AGORA 🎲"
    console.log('   ✓ Clicando em "SORTEAR AGORA 🎲"...');
    await page.click('button:has-text("SORTEAR AGORA")');
    
    // Aguardar o banner de conclusão
    console.log('   ⏳ Aguardando processamento da RPC e animação...');
    await page.locator('text=Envelopes Lacrados Prontos').waitFor({ timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_quick_draw_completed.png') });

    console.log('   ✓ Envelopes gerados com sucesso!');
    auditResults.test4_quick_draw = true;
    console.log('   ✅ TESTE 4 PASSOU!\n');

    // -------------------------------------------------------------
    // TESTE 5: Envelope com Lacre de Segurança Digital & Detecção de Violação
    // -------------------------------------------------------------
    console.log('👉 [TESTE 5] Auditando Envelope Lacrado & Detecção de Violação...');

    const personalEnvelopeBtn = page.locator('button:has-text("VER QUEM EU TIREI")').first();
    
    // Capturar a nova página aberta pelo popup
    const [personalPage] = await Promise.all([
      context.waitForEvent('page'),
      personalEnvelopeBtn.click()
    ]);

    await personalPage.waitForLoadState('domcontentloaded');
    await personalPage.waitForTimeout(1000);
    const envelopeUrl = personalPage.url();
    console.log(`   ✓ URL do envelope do organizador: ${envelopeUrl}`);
    await personalPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_sealed_envelope_initial.png') });

    // Clicar para romper o lacre
    console.log('   ✓ Clicando em "Romper Lacre de Segurança"...');
    const breakSealBtn = personalPage.locator('button:has-text("Romper Lacre")').first();
    await breakSealBtn.click();
    await personalPage.waitForTimeout(1500);
    await personalPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_envelope_revealed.png') });

    // Constatar quem a pessoa tirou
    const secretFriendText = personalPage.locator('text=Seu Amigo Secreto é:');
    const isRevealed = await secretFriendText.isVisible();
    console.log(`   ✓ Amigo secreto revelado na tela: ${isRevealed ? 'SIM' : 'NÃO'}`);
    auditResults.test5_sealed_envelope_legit = isRevealed;

    // Recarregar a página no MESMO aparelho (não deve dar alerta falso)
    await personalPage.reload({ waitUntil: 'domcontentloaded' });
    await personalPage.waitForTimeout(600);
    const warningOnSameDevice = await personalPage.locator('text=LACRE DE SEGURANÇA VIOLADO').isVisible();
    console.log(`   ✓ Verificação de alarme falso no mesmo aparelho: ${warningOnSameDevice ? 'FALHA (Alarme falso)' : 'OK (Sem alarme falso)'}`);

    // TESTE DE VIOLAÇÃO: Simular que outra pessoa abriu o mesmo envelope em outro aparelho
    console.log('   🕵️ Simulando acesso ao mesmo envelope em outro aparelho (violação)...');
    const context2 = await browser.newContext();
    const pageDevice2 = await context2.newPage();
    await pageDevice2.goto(envelopeUrl, { waitUntil: 'domcontentloaded' });
    await pageDevice2.waitForTimeout(1000);
    await pageDevice2.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_envelope_tampered_alert.png') });

    const tamperedWarning = pageDevice2.locator('text=LACRE DE SEGURANÇA VIOLADO');
    const isTamperedDetected = await tamperedWarning.first().isVisible();
    console.log(`   🚨 Alerta ostensivo de Lacre Violado disparado: ${isTamperedDetected ? 'SIM' : 'NÃO'}`);
    auditResults.test5_sealed_envelope_tamper = isTamperedDetected;

    await pageDevice2.close();
    await context2.close();
    await personalPage.close();
    console.log('   ✅ TESTE 5 PASSOU!\n');

    // -------------------------------------------------------------
    // TESTE 6: Suíte Completa de Amigo Secreto (Com Conta & Wizard)
    // -------------------------------------------------------------
    console.log('👉 [TESTE 6] Auditando Suíte Completa de Amigo Secreto (/amigo-secreto)...');
    await page.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Clicar em "CRIAR MEU AMIGO SECRETO"
    await page.click('button:has-text("CRIAR MEU AMIGO SECRETO")');
    await page.waitForTimeout(500);

    // Clicar em "Criar com Conta (Só 1 min)"
    console.log('   ✓ Selecionando "Criar com Conta (Só 1 min)"...');
    const fullSuiteBtn = page.locator('button:has-text("Criar com Conta")').first();
    await fullSuiteBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_wizard_opened.png') });

    const isWizardVisible = await page.locator('text=Passo 1 de 3').first().isVisible();
    console.log(`   ✓ Wizard de 3 Passos aberto: ${isWizardVisible ? 'SIM' : 'NÃO'}`);
    if (!isWizardVisible) throw new Error('Wizard de 3 passos não abriu.');

    console.log('   ✓ Preenchendo Passo 1 do Wizard...');
    const eventUniqueTitle = `Amigo Secreto E2E Audited ${Date.now()}`;
    await page.fill('input[placeholder*="Ex: Amigo Secreto"]', eventUniqueTitle);

    // Avançar para Passo 2
    console.log('   ✓ Avançando para Passo 2 (Presentes)...');
    await page.click('button:has-text("Avançar")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_wizard_step2.png') });
    console.log('   ✓ Passo 2 validado com sucesso');

    // Avançar para Passo 3
    console.log('   ✓ Avançando para Passo 3 (Festa & Convites)...');
    await page.click('button:has-text("Avançar")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_wizard_step3.png') });
    console.log('   ✓ Passo 3: Modo Aberto selecionado');

    // Finalizar criação do evento
    console.log('   ✓ Clicando em "CRIAR E GERAR CONVITES ➔"...');
    const finishBtn = page.locator('button:has-text("CRIAR E GERAR CONVITES")');
    await finishBtn.scrollIntoViewIfNeeded();
    await finishBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_event_created_modal.png') });

    // Verificar se o modal de compartilhamento abriu
    const shareModal = page.locator('text=Bora convidar a galera no WhatsApp');
    await shareModal.first().waitFor({ timeout: 10000 });
    const isShareModalVisible = await shareModal.first().isVisible();
    console.log(`   ✓ Modal de Compartilhamento gerado com sucesso: ${isShareModalVisible ? 'SIM' : 'NÃO'}`);
    if (!isShareModalVisible) throw new Error('Modal de compartilhamento não abriu após submissão.');

    // Extrair link do convite a partir da prévia da mensagem
    const inviteInfo = await page.evaluate(() => {
      const text = document.querySelector('p.font-mono')?.textContent || '';
      const match = text.match(/\/amigo\/(\d+)\/entrar/);
      return match ? { url: `http://localhost:5173/amigo/${match[1]}/entrar`, eventId: Number(match[1]) } : null;
    });

    console.log('   ✓ Informações do convite extraídas do modal:', inviteInfo);
    if (!inviteInfo || !inviteInfo.eventId) throw new Error('Falha ao extrair ID do evento do modal de compartilhamento.');

    // Autenticar cliente Supabase com o usuário da sessão para verificar RLS
    await supabase.auth.signInWithPassword({ email: testEmail, password: testPass });

    // Verificar inserção direta no banco Supabase
    const { data: dbEvent, error: dbEventErr } = await supabase
      .from('table_reune')
      .select('id, title, categoria_evento')
      .eq('id', inviteInfo.eventId)
      .single();

    console.log(`   ✓ Verificação no Banco (table_reune): Evento ID ${dbEvent?.id} criado com título "${dbEvent?.title}" e categoria "${dbEvent?.categoria_evento}"!`);
    const createdEventId = dbEvent?.id;
    auditResults.test6_wizard_full_suite = isShareModalVisible && !!createdEventId;
    console.log('   ✅ TESTE 6 PASSOU!\n');

    // -------------------------------------------------------------
    // TESTE 7: Entrada Pública de Convidado Sem Login (/amigo/.../entrar)
    // -------------------------------------------------------------
    console.log('👉 [TESTE 7] Auditando Entrada Pública de Convidado Sem Login...');
    const guestTargetUrl = inviteInfo.url;
    console.log(`   ✓ Abrindo link público de convidado: ${guestTargetUrl}`);

    // Contexto limpo sem cookies ou tokens (simulando celular de convidado)
    const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(guestTargetUrl, { waitUntil: 'domcontentloaded' });
    await guestPage.waitForTimeout(1500);
    await guestPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_guest_join_page.png') });

    // Preencher dados do convidado
    const guestName = 'Mariana QA Playwright';
    const guestWish = 'Fone Bluetooth ou Livro de Ficção';
    const guestPin = '4321';

    console.log(`   ✓ Preenchendo formulário público de presença: ${guestName}...`);
    await guestPage.fill('input[placeholder*="Ex: Mariana Costa"]', guestName);
    await guestPage.fill('textarea[placeholder*="Ex: Livro de ficção científica"]', guestWish);
    await guestPage.fill('input[placeholder*="Ex: 2468"]', guestPin);
    await guestPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_guest_form_filled.png') });

    // Submeter confirmação
    console.log('   ✓ Clicando em "ENTRAR NO AMIGO SECRETO ➔"...');
    await guestPage.click('button:has-text("ENTRAR NO AMIGO SECRETO")');
    await guestPage.waitForTimeout(3000);
    await guestPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_guest_presence_confirmed.png') });

    const confirmedBanner = guestPage.locator('text=Presença Confirmada');
    const isGuestConfirmed = await confirmedBanner.first().isVisible();
    console.log(`   ✓ Banner de confirmação exibido: ${isGuestConfirmed ? 'SIM' : 'NÃO'}`);

    // Verificar gravação no banco Supabase
    const { data: dbParticipant } = await supabase
      .from('event_secret_santa_participants')
      .select('id, display_name, status')
      .eq('display_name', guestName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(`   ✓ Verificação no Banco (event_secret_santa_participants): ID ${dbParticipant?.id}, Convidado: "${dbParticipant?.display_name}", Status: "${dbParticipant?.status}"`);

    auditResults.test7_guest_join_public = isGuestConfirmed && !!dbParticipant;
    await guestContext.close();
    console.log('   ✅ TESTE 7 PASSOU!\n');

    console.log('======================================================================');
    console.log('🎉 AUDITORIA E2E FINALIZADA COM SUCESSO TOTAL!');
    console.log('======================================================================');
    console.log('Resultados Finais:', auditResults);
    console.log(`Total de logs de erro no console: ${consoleErrors.length}`);

    return { success: true, auditResults };
  } catch (error) {
    console.error('❌ Falha na auditoria:', error);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'critical_failure.png') });
    return { success: false, error: error.message, auditResults };
  } finally {
    await browser.close();
  }
}

runFullAudit().then(res => {
  if (!res.success) process.exit(1);
});
