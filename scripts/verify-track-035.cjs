const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = '/home/emanuel/.gemini/antigravity/brain/bbb905c9-1c5d-4ee8-89a7-96c1a16c3673/mobile_audit_fixed';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function verifyAll() {
  console.log('📱 INICIANDO VERIFICAÇÃO FINAL COMPLETA DA TRACK 035...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();

  const auditReport = [];

  async function checkScreen(screenName, screenshotPath) {
    const metrics = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return {
        docW,
        scrollW,
        hasOverflow: scrollW > docW
      };
    });

    console.log(`[${screenName}] (375px) docW: ${metrics.docW}, scrollW: ${metrics.scrollW}, hasOverflow: ${metrics.hasOverflow}`);
    if (screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    // Também testar em 360px (Android estreito)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(400);
    const metrics360 = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return {
        docW,
        scrollW,
        hasOverflow: scrollW > docW
      };
    });
    console.log(`[${screenName}] (360px) docW: ${metrics360.docW}, scrollW: ${metrics360.scrollW}, hasOverflow: ${metrics360.hasOverflow}`);

    // Restaurar 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);

    const passed = !metrics.hasOverflow && !metrics360.hasOverflow;
    auditReport.push({ screenName, passed, metrics375: metrics, metrics360 });
    return passed;
  }

  // 1. Login
  console.log('1. Autenticando usuário...');
  await page.goto('http://localhost:8080/login');
  await page.fill('input[type="email"]', 'mobile_tester_1794158402897@teste.com');
  await page.fill('input[type="password"]', 'SenhaForte123!');
  await page.click('button[type="submit"]:has-text("Entrar")');
  await page.waitForTimeout(2500);

  // 2. Dashboard
  console.log('\n2. Auditando Dashboard...');
  await checkScreen('Dashboard ReUNE', path.join(OUTPUT_DIR, '01_dashboard_fixed.png'));

  // 3. Event Details (Churrasco com Suprimentos)
  console.log('\n3. Auditando EventDetails (Churrasco & Insumos)...');
  const event1 = page.locator('article').first();
  await event1.click();
  await page.waitForTimeout(2000);
  await checkScreen('EventDetails Churrasco', path.join(OUTPUT_DIR, '02_event_details_churrasco_fixed.png'));

  // 4. Voltar ao Dash e abrir Event Details (Amigo Secreto)
  console.log('\n4. Auditando EventDetails (Amigo Secreto Integrado)...');
  await page.locator('nav button').first().click();
  await page.waitForTimeout(1500);

  const event2 = page.locator('article:has-text("Amigo Secreto")').first();
  await event2.click();
  await page.waitForTimeout(2000);
  await checkScreen('EventDetails Amigo Secreto', path.join(OUTPUT_DIR, '03_event_details_secret_santa_fixed.png'));

  // 5. Secret Santa Admin
  console.log('\n5. Auditando SecretSantaAdmin (/event/52/secret-santa/admin)...');
  await page.goto('http://localhost:8080/event/52/secret-santa/admin');
  await page.waitForTimeout(2000);
  await checkScreen('SecretSantaAdmin', path.join(OUTPUT_DIR, '04_secret_santa_admin_fixed.png'));

  // 6. Secret Santa Participants
  console.log('\n6. Auditando SecretSantaParticipants (/event/52/secret-santa/participants)...');
  await page.goto('http://localhost:8080/event/52/secret-santa/participants');
  await page.waitForTimeout(2000);
  await checkScreen('SecretSantaParticipants', path.join(OUTPUT_DIR, '05_secret_santa_participants_fixed.png'));

  await browser.close();

  console.log('\n======================================================');
  console.log('🏁 RESULTADO CONSOLIDADO DA AUDITORIA TRACK 035:');
  console.log('======================================================');
  console.table(auditReport);

  const allPassed = auditReport.every(r => r.passed);
  if (!allPassed) {
    console.error('❌ Falha na auditoria de layout mobile.');
    process.exit(1);
  }
  console.log('🎉 TODOS OS PAINÉIS PASSARAM COM SUCESSO (ZERO VAZAMENTOS)!');
}

verifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});
