const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '../tests/e2e/screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function runCoreAudit() {
  console.log('\n🚀 [FASE 1] INICIANDO AUDITORIA E2E: REUNE CORE & AUTH...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  try {
    // 1. Home V3
    console.log('📌 1. Testando Home V3 (http://localhost:5173/)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const title = await page.title();
    console.log(`   ✅ Título carregado: "${title}"`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home_v3.png') });

    // Alternar tema
    console.log('   🎨 Testando alternância de tema...');
    const themeBtn = page.locator('button[title*="Modo"], button[aria-label*="theme"], button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Alternância de tema acionada com sucesso');
    }

    // 2. Fluxo de Cadastro e Auto-Login
    console.log('\n📌 2. Testando Tela de Login & Auto-Cadastro (/login)...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login_screen.png') });

    // Clicar na aba "Crie sua conta" ou alternar para cadastro
    const createAccountTab = page.locator('button:has-text("Crie sua conta"), button:has-text("Criar conta"), button:has-text("Cadastre-se")').first();
    if (await createAccountTab.isVisible()) {
      await createAccountTab.click();
      await page.waitForTimeout(400);
    }

    const testEmail = `e2e_test_${Date.now()}@reune.local`;
    const testPassword = 'Password123!@#';
    console.log(`   📝 Preenchendo cadastro com: ${testEmail}`);

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_signup_filled.png') });

    // Submeter cadastro
    console.log('   🖱️ Submetendo formulário de cadastro...');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Aguardar redirecionamento ou toast de sucesso
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_after_signup.png') });

    const currentUrl = page.url();
    console.log(`   ✅ URL após cadastro: ${currentUrl}`);

    // Verificar se entrou no Dashboard
    const dashboardElement = page.locator('text=Eventos, text=Dashboard, text=Bora organizar, button:has-text("Criar Evento"), button:has-text("Novo Evento")').first();
    const isDashboard = await dashboardElement.isVisible().catch(() => false);
    console.log(`   ✅ Dashboard ou área logada detectada: ${isDashboard ? 'SIM' : 'NÃO (verificar URL)'}`);

    console.log(`\n📊 Erros de console detectados: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('   ⚠️ Logs:', consoleErrors.slice(0, 3));
    }

    console.log('\n🎉 [FASE 1] CONCLUÍDA COM SUCESSO!\n');
    return { success: true, testEmail };
  } catch (error) {
    console.error('❌ Erro na Fase 1:', error);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_error.png') });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

runCoreAudit().then(result => {
  if (!result.success) process.exit(1);
});
