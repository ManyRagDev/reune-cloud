const { chromium } = require('playwright');
const path = require('path');

const OUTPUT_DIR = '/home/emanuel/.gemini/antigravity/brain/bbb905c9-1c5d-4ee8-89a7-96c1a16c3673/mobile_audit';

async function testOthers() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:8080/login');
  await page.fill('input[type="email"]', 'mobile_tester_1794158402897@teste.com');
  await page.fill('input[type="password"]', 'SenhaForte123!');
  await page.click('button[type="submit"]:has-text("Entrar")');
  await page.waitForTimeout(2500);

  // 1. Clicar no FAB "Criar Rolê" para abrir CreateEvent
  console.log('1. Testando CreateEvent...');
  const fab = page.locator('button.relative.w-16.h-16').first();
  if (await fab.isVisible()) {
    await fab.click();
    await page.waitForTimeout(1500);

    const ceOf = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return { docW, scrollW, hasOverflow: scrollW > docW };
    });
    console.log('CreateEvent Overflow:', ceOf);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_create_event_fullpage.png'), fullPage: true });

    // Voltar
    await page.locator('nav button').first().click();
    await page.waitForTimeout(1500);
  }

  // 2. Secret Santa Admin
  console.log('2. Testando SecretSantaAdmin (/event/52/secret-santa/admin)...');
  await page.goto('http://localhost:8080/event/52/secret-santa/admin');
  await page.waitForTimeout(2000);
  const ssaOf = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    return { docW, scrollW, hasOverflow: scrollW > docW };
  });
  console.log('SecretSantaAdmin Overflow:', ssaOf);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_secret_santa_admin_fullpage.png'), fullPage: true });

  // 3. Secret Santa Participants
  console.log('3. Testando SecretSantaParticipants (/event/52/secret-santa/participants)...');
  await page.goto('http://localhost:8080/event/52/secret-santa/participants');
  await page.waitForTimeout(2000);
  const sspOf = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    return { docW, scrollW, hasOverflow: scrollW > docW };
  });
  console.log('SecretSantaParticipants Overflow:', sspOf);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_secret_santa_participants_fullpage.png'), fullPage: true });

  await browser.close();
}

testOthers();
