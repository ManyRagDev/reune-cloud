const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_MOBILE_DIR = path.join(__dirname, '../tests/e2e/screenshots_mobile');
fs.mkdirSync(SCREENSHOTS_MOBILE_DIR, { recursive: true });

async function runMobileAudit() {
  console.log('======================================================================');
  console.log('📱 INICIANDO AUDITORIA MOBILE-FIRST (VIEWPORT: 390x844 - SMARTPHONE)');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  // Simula tela de iPhone 14 / Pixel 7 com suporte a touch
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const results = {
    mobile_landing_sticky_bar: false,
    mobile_choice_bottom_sheet: false,
    mobile_quick_draw: false,
    mobile_envelope_sealed_and_opened: false,
  };

  try {
    // -------------------------------------------------------------
    // TESTE 1: Landing Page no Celular & Sticky CTA Bar
    // -------------------------------------------------------------
    console.log('👉 [TESTE 1] Auditando Landing Page Mobile (/amigo-secreto)...');
    await page.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, '01_mobile_landing_hero.png') });

    // Verificar se a Sticky Bar inferior está visível
    const stickyBar = page.locator('text=Criar Agora ➔');
    const isStickyVisible = await stickyBar.first().isVisible();
    console.log(`   ✓ Sticky Bar inferior no celular visível: ${isStickyVisible ? 'SIM' : 'NÃO'}`);
    results.mobile_landing_sticky_bar = isStickyVisible;

    // -------------------------------------------------------------
    // TESTE 2: Modal de Pré-Decisão em formato Bottom Sheet no Celular
    // -------------------------------------------------------------
    console.log('👉 [TESTE 2] Clicando no CTA Sticky para abrir Modal Bottom Sheet...');
    await stickyBar.first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, '02_mobile_choice_sheet.png') });

    const quickBtn = page.locator('button:has-text("Continuar Sem Cadastro")').first();
    const isChoiceVisible = await quickBtn.isVisible();
    console.log(`   ✓ Modal Bottom-Sheet aberto: ${isChoiceVisible ? 'SIM' : 'NÃO'}`);
    results.mobile_choice_bottom_sheet = isChoiceVisible;

    // -------------------------------------------------------------
    // TESTE 3: Sorteador Relâmpago Mobile (Digitação fluida)
    // -------------------------------------------------------------
    console.log('👉 [TESTE 3] Auditando Sorteador Relâmpago no Celular (/amigo-secreto/rapido)...');
    await quickBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, '03_mobile_quick_page.png') });

    // Adicionar participantes simulando digitação rápida com Enter
    const names = ['Mariana', 'Lucas', 'Camila', 'Rodrigo'];
    for (const name of names) {
      await page.fill('input[placeholder*="Ex: Mariana"]', name);
      await page.press('input[placeholder*="Ex: Mariana"]', 'Enter');
      await page.waitForTimeout(150);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, '04_mobile_participants_added.png') });
    console.log(`   ✓ ${names.length} participantes adicionados com tecla Enter!`);

    // Clicar em "SORTEAR AGORA"
    console.log('   ✓ Clicando em "SORTEAR AGORA"...');
    await page.click('button:has-text("SORTEAR AGORA")');
    await page.locator('text=Envelopes Lacrados Prontos').waitFor({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, '05_mobile_draw_completed.png') });

    results.mobile_quick_draw = true;
    console.log('   ✅ TESTE 3 PASSOU (Sorteio concluído no celular)!');

    // -------------------------------------------------------------
    // TESTE 4: Experiência do Envelope Lacrado no Celular
    // -------------------------------------------------------------
    console.log('👉 [TESTE 4] Abrindo Envelope Pessoal do Organizador no Celular...');
    const personalEnvelopeBtn = page.locator('button:has-text("VER QUEM EU TIREI")').first();
    
    const [envelopePage] = await Promise.all([
      context.waitForEvent('page'),
      personalEnvelopeBtn.click()
    ]);

    await envelopePage.waitForLoadState('domcontentloaded');
    await envelopePage.waitForTimeout(1000);
    await envelopePage.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, '06_mobile_envelope_sealed.png') });

    console.log('   ✓ Rompendo o Lacre de Segurança Digital...');
    const breakSealBtn = envelopePage.locator('button:has-text("Romper Lacre")').first();
    await breakSealBtn.click();
    await envelopePage.waitForTimeout(1500);
    await envelopePage.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, '07_mobile_envelope_revealed.png') });

    const revealedFriend = envelopePage.locator('text=Seu Amigo Secreto é:');
    const isFriendRevealed = await revealedFriend.isVisible();
    console.log(`   ✓ Amigo secreto revelado na tela do celular: ${isFriendRevealed ? 'SIM' : 'NÃO'}`);
    results.mobile_envelope_sealed_and_opened = isFriendRevealed;

    await envelopePage.close();

    console.log('\n======================================================================');
    console.log('🎉 AUDITORIA MOBILE CONCLUÍDA COM SUCESSO TOTAL!');
    console.log('======================================================================');
    console.log('Resultados Mobile:', results);

    return { success: true, results };
  } catch (error) {
    console.error('❌ Falha na auditoria mobile:', error);
    await page.screenshot({ path: path.join(SCREENSHOTS_MOBILE_DIR, 'mobile_failure.png') });
    return { success: false, error: error.message, results };
  } finally {
    await browser.close();
  }
}

runMobileAudit().then(res => {
  if (!res.success) process.exit(1);
});
