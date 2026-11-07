const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testModal() {
  const outputDir = path.join(__dirname, '../public/landing_v4_audit');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // 1. Mobile (iPhone 14: 390x844)
  console.log('--- Testando no iPhone 14 (390x844) ---');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Clica no botão para abrir o modal
  const openModalBtn = page.locator('button:has-text("CRIAR MEU AMIGO SECRETO")').first();
  await openModalBtn.click();
  await page.waitForTimeout(600);

  // Localiza o diálogo
  const modalDialog = page.locator('div[role="dialog"]');
  const isVisible = await modalDialog.isVisible();
  console.log('Modal visível:', isVisible);

  const box = await modalDialog.boundingBox();
  console.log(`Dimensões do modal no mobile (390x844): Largura=${Math.round(box.width)}px, Altura=${Math.round(box.height)}px, Top=${Math.round(box.y)}px`);

  // Verifica se a altura cabe com folga dentro do viewport (844px)
  const fitsInViewport = (box.y + box.height) <= 844;
  console.log('Cabe inteiro no viewport sem rolar?', fitsInViewport);

  // Verifica se o Card 1 (Com Cadastro) está visível
  const cardFull = modalDialog.locator('text=👑 Com Cadastro').first();
  const cardFullVisible = await cardFull.isVisible();
  console.log('Card 1 (Com Cadastro) visível:', cardFullVisible);

  // Verifica se o Card 2 (Sem Cadastro) está visível
  const cardQuick = modalDialog.locator('text=⚡ Sem Cadastro').first();
  const cardQuickVisible = await cardQuick.isVisible();
  console.log('Card 2 (Sem Cadastro) visível:', cardQuickVisible);

  // Verifica se o botão do Card 2 está visível sem rolar
  const btnQuick = modalDialog.locator('button:has-text("Sortear Sem Cadastro")').first();
  const btnQuickBox = await btnQuick.boundingBox();
  console.log(`Posição do botão do Card 2: Y=${Math.round(btnQuickBox.y)}px, Bottom=${Math.round(btnQuickBox.y + btnQuickBox.height)}px`);
  const btnVisibleInViewport = (btnQuickBox.y + btnQuickBox.height) <= 844;
  console.log('Botão do Card 2 visível sem rolar?', btnVisibleInViewport);

  // Tira screenshot do modal aberto no mobile
  await page.screenshot({ path: path.join(outputDir, 'mobile_modal_compact_390.png') });
  console.log('Screenshot salva: mobile_modal_compact_390.png');

  // 2. Small Screen (360x740)
  console.log('\n--- Testando em tela compacta (360x740) ---');
  const smallContext = await browser.newContext({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
  });
  const smallPage = await smallContext.newPage();
  await smallPage.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'networkidle' });
  await smallPage.waitForTimeout(1000);

  const smallOpenBtn = smallPage.locator('button:has-text("CRIAR MEU AMIGO SECRETO")').first();
  await smallOpenBtn.click();
  await smallPage.waitForTimeout(600);

  const smallDialog = smallPage.locator('div[role="dialog"]');
  const smallBox = await smallDialog.boundingBox();
  console.log(`Dimensões em 360x740: Largura=${Math.round(smallBox.width)}px, Altura=${Math.round(smallBox.height)}px, Bottom=${Math.round(smallBox.y + smallBox.height)}px`);
  console.log('Cabe inteiro em 360x740?', (smallBox.y + smallBox.height) <= 740);

  await smallPage.screenshot({ path: path.join(outputDir, 'mobile_modal_compact_360.png') });
  console.log('Screenshot salva: mobile_modal_compact_360.png');

  // 3. Desktop (1280x800)
  console.log('\n--- Testando no Desktop (1280x800) ---');
  const deskContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const deskPage = await deskContext.newPage();
  await deskPage.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'networkidle' });
  await deskPage.waitForTimeout(1000);

  const deskOpenBtn = deskPage.locator('button:has-text("CRIAR MEU AMIGO SECRETO")').first();
  await deskOpenBtn.click();
  await deskPage.waitForTimeout(600);

  await deskPage.screenshot({ path: path.join(outputDir, 'desktop_modal_compact.png') });
  console.log('Screenshot salva: desktop_modal_compact.png');

  await browser.close();
  console.log('Todos os testes concluídos!');
}

testModal().catch(err => {
  console.error(err);
  process.exit(1);
});
