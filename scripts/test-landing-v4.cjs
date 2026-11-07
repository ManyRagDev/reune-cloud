const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const outputDir = path.join(__dirname, '../public/landing_v4_audit');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  // 1. Mobile Context (iPhone 14: 390 x 844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    hasTouch: true,
  });

  const page = await mobileContext.newPage();
  console.log('Navegando para http://localhost:5173/amigo-secreto...');
  await page.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Screenshot 1: Hero Top (Modo Grupo)
  await page.screenshot({ path: path.join(outputDir, 'mobile_01_hero_group.png') });
  console.log('Screenshot 1 salvo: mobile_01_hero_group.png');

  // Toggle para Modo Relâmpago
  const quickTabBtn = page.locator('button:has-text("Modo Relâmpago")');
  if (await quickTabBtn.count() > 0) {
    await quickTabBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, 'mobile_02_hero_quick.png') });
    console.log('Screenshot 2 salvo: mobile_02_hero_quick.png');
  }

  // Scroll para Pilha de Cartas (O Grande Diferencial)
  const deckSection = page.locator('section:has-text("O Grande Diferencial")');
  if (await deckSection.count() > 0) {
    await deckSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, 'mobile_03_card_deck.png') });
    console.log('Screenshot 3 salvo: mobile_03_card_deck.png');

    // Clicar na seta para passar a carta
    const nextCardBtn = page.locator('button[title="Próxima Carta"]');
    if (await nextCardBtn.count() > 0) {
      await nextCardBtn.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outputDir, 'mobile_03b_card_deck_next.png') });
      console.log('Screenshot 3b salvo: mobile_03b_card_deck_next.png');
    }
  }

  // Scroll para Como Funciona (Carrossel Horizontal)
  const howSection = page.locator('section:has-text("Como funciona em 3 passos")');
  if (await howSection.count() > 0) {
    await howSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, 'mobile_04_how_it_works.png') });
    console.log('Screenshot 4 salvo: mobile_04_how_it_works.png');
  }

  // Scroll para Por Que Abandonar o Papelzinho (Trilha em S)
  const pathSection = page.locator('section:has-text("Por que abandonar o papelzinho")');
  if (await pathSection.count() > 0) {
    await pathSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, 'mobile_05_why_ditch_paper.png') });
    console.log('Screenshot 5 salvo: mobile_05_why_ditch_paper.png');
  }

  // Scroll para Rodapé Final CTA (Pronto para acabar com a bagunça)
  const ctaSection = page.locator('section:has-text("Pronto para acabar com a bagunça")');
  if (await ctaSection.count() > 0) {
    await ctaSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, 'mobile_06_final_cta.png') });
    console.log('Screenshot 6 salvo: mobile_06_final_cta.png');
  }

  // 2. Desktop Context (1280 x 800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const deskPage = await desktopContext.newPage();
  await deskPage.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'networkidle' });
  await deskPage.waitForTimeout(1000);

  // Desktop Hero
  await deskPage.screenshot({ path: path.join(outputDir, 'desktop_01_hero.png') });
  console.log('Screenshot Desktop 1 salvo: desktop_01_hero.png');

  // Desktop Como Funciona
  const deskHow = deskPage.locator('section:has-text("Como funciona em 3 passos")');
  if (await deskHow.count() > 0) {
    await deskHow.scrollIntoViewIfNeeded();
    await deskPage.waitForTimeout(500);
    await deskPage.screenshot({ path: path.join(outputDir, 'desktop_02_how_it_works.png') });
    console.log('Screenshot Desktop 2 salvo: desktop_02_how_it_works.png');
  }

  // Desktop Trilha S
  const deskPath = deskPage.locator('section:has-text("Por que abandonar o papelzinho")');
  if (await deskPath.count() > 0) {
    await deskPath.scrollIntoViewIfNeeded();
    await deskPage.waitForTimeout(500);
    await deskPage.screenshot({ path: path.join(outputDir, 'desktop_03_why_ditch_paper.png') });
    console.log('Screenshot Desktop 3 salvo: desktop_03_why_ditch_paper.png');
  }

  await browser.close();
  console.log('Auditoria concluída com sucesso!');
}

run().catch(err => {
  console.error('Erro na auditoria:', err);
  process.exit(1);
});
