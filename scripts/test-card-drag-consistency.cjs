const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const deck = page.locator('section:has-text("O Grande Diferencial")');
  await deck.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const topCard = page.locator('div[style*="z-index: 30"]').first();
  const topCardTitle = await topCard.locator('h3').innerText();
  console.log('Top card inicial:', topCardTitle);

  // Card 2 underneath (z-index 20)
  const nextCard = page.locator('div[style*="z-index: 20"]').first();
  const nextCardTitle = await nextCard.locator('h3').innerText();
  console.log('Card visível embaixo (preview):', nextCardTitle);

  // Obter bounding box do card do topo
  const box = await topCard.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // 1. Simular arrastar para a DIREITA (jogar para a direita)
  console.log('Arrastando o card para a DIREITA...');
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 180, startY, { steps: 10 });
  await page.waitForTimeout(300);

  // Capturar enquanto está sendo arrastado para a direita
  await page.screenshot({ path: path.join(__dirname, '../public/landing_v4_audit/drag_right_preview.png') });
  console.log('Screenshot tirada durante o arrasto!');

  // Soltar o mouse (jogou para o lado)
  await page.mouse.up();
  await page.waitForTimeout(600); // Aguarda animação de fling (240ms) + buffer

  // Verificar o novo card do topo
  const newTopCard = page.locator('div[style*="z-index: 30"]').first();
  const newTopTitle = await newTopCard.locator('h3').innerText();
  console.log('Novo card do topo após jogar para a direita:', newTopTitle);

  // Capturar screenshot do novo estado
  await page.screenshot({ path: path.join(__dirname, '../public/landing_v4_audit/drag_right_released.png') });

  // VALIDAÇÃO ESTREITA: O novo card do topo TEM que ser igual ao que estava embaixo!
  if (newTopTitle === nextCardTitle) {
    console.log('✅ SUCESSO ABSOLUTO: O card que apareceu no topo (' + newTopTitle + ') é EXATAMENTE o mesmo que estava na prévia embaixo (' + nextCardTitle + ')!');
  } else {
    console.error('❌ ERRO: Mismatch! Estava embaixo: ' + nextCardTitle + ', mas apareceu: ' + newTopTitle);
    process.exit(1);
  }

  // 2. Agora testar jogando para a ESQUERDA
  const currentNext = page.locator('div[style*="z-index: 20"]').first();
  const currentNextTitle = await currentNext.locator('h3').innerText();
  console.log('Card atualmente embaixo (preview):', currentNextTitle);

  const newBox = await newTopCard.boundingBox();
  const nStartX = newBox.x + newBox.width / 2;
  const nStartY = newBox.y + newBox.height / 2;

  console.log('Arrastando o card para a ESQUERDA...');
  await page.mouse.move(nStartX, nStartY);
  await page.mouse.down();
  await page.mouse.move(nStartX - 180, nStartY, { steps: 10 });
  await page.waitForTimeout(300);
  await page.mouse.up();
  await page.waitForTimeout(600);

  const finalTopCard = page.locator('div[style*="z-index: 30"]').first();
  const finalTopTitle = await finalTopCard.locator('h3').innerText();
  console.log('Novo card do topo após jogar para a esquerda:', finalTopTitle);

  if (finalTopTitle === currentNextTitle) {
    console.log('✅ SUCESSO ABSOLUTO: Ao jogar para a esquerda, o card que apareceu (' + finalTopTitle + ') é EXATAMENTE o que estava na prévia (' + currentNextTitle + ')!');
  } else {
    console.error('❌ ERRO: Mismatch ao jogar para esquerda!');
    process.exit(1);
  }

  await browser.close();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
