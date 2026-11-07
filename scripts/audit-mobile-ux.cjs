const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const brainDir = '/home/emanuel/.gemini/antigravity/brain/6a8da887-4788-46a2-8bf5-1fb9c1b01436';
fs.mkdirSync(brainDir, { recursive: true });

async function runMobileAudit() {
  console.log('📱 INICIANDO AUDITORIA MOBILE PLAYWRIGHT (Viewport 390x844)...');
  
  const browser = await chromium.launch({ headless: true });
  // Simular iPhone 14 / viewport mobile padrão
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });

  const page = await context.newPage();
  const findings = [];

  // 1. Landing Page Amigo Secreto
  console.log('1. Capturando Landing Amigo Secreto...');
  await page.goto('http://localhost:5173/amigo-secreto', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Checar overflow horizontal
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  findings.push({
    screen: 'Landing Amigo Secreto',
    hasHorizontalOverflow: hasHorizontalScroll,
    scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    clientWidth: await page.evaluate(() => document.documentElement.clientWidth)
  });

  await page.screenshot({ path: path.join(brainDir, 'mobile_01_landing.png') });

  // 2. Abrir Modal de Escolha
  console.log('2. Abrindo Modal de Escolha...');
  const createBtn = page.locator('button:has-text("CRIAR MEU AMIGO SECRETO")').first();
  await createBtn.click();
  await page.waitForTimeout(600);
  
  await page.screenshot({ path: path.join(brainDir, 'mobile_02_modal_top.png') });

  // Scrollar o modal para baixo
  console.log('3. Scrollando Modal para visualizar Opção 2...');
  const modalScrollArea = page.locator('[role="dialog"]');
  if (await modalScrollArea.count() > 0) {
    await modalScrollArea.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(brainDir, 'mobile_03_modal_bottom.png') });
  }

  // 3. Clicar em "Continuar Sem Cadastro" para auditar o Sorteador Relâmpago
  console.log('4. Navegando para Sorteador Relâmpago...');
  const quickBtn = page.locator('button:has-text("Continuar Sem Cadastro")');
  await quickBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(brainDir, 'mobile_04_quick_draw.png') });

  // 4. Preencher participantes e testar resultado no celular
  console.log('5. Testando preenchimento no Sorteador Relâmpago...');
  const inputNome = page.locator('input[placeholder*="Digite o nome"]');
  const addBtn = page.locator('button:has-text("Adicionar")');

  const names = ['Emanuel', 'Juliana', 'Marcos', 'Beatriz'];
  for (const name of names) {
    await inputNome.fill(name);
    await addBtn.click();
    await page.waitForTimeout(200);
  }

  // Selecionar organizador
  console.log('Selecionando organizador "Emanuel"...');
  await page.locator('select').selectOption('Emanuel');
  await page.waitForTimeout(300);

  // Sortear
  const sortearBtn = page.locator('button:has-text("SORTEAR AGORA")');
  await sortearBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, 'mobile_05_quick_results.png') });

  // 5. Testar tela do Envelope Lacrado
  console.log('6. Abrindo Envelope Pessoal...');
  const verEnvelopeBtn = page.locator('button:has-text("VER QUEM EU TIREI")');
  if (await verEnvelopeBtn.count() > 0) {
    await verEnvelopeBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(brainDir, 'mobile_06_envelope_closed.png') });

    // Romper lacre
    console.log('7. Rompendo lacre no celular...');
    const selo = page.locator('button:has-text("ROMPER LACRE")');
    if (await selo.count() > 0) {
      await selo.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(brainDir, 'mobile_07_envelope_opened.png') });
    }
  }

  // 6. Home Geral
  console.log('8. Capturando Home Geral...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(brainDir, 'mobile_08_home.png') });

  await browser.close();
  console.log('✅ AUDITORIA MOBILE CONCLUÍDA! Imagens salvas em:', brainDir);
  console.log('Resultados de overflow:', JSON.stringify(findings, null, 2));
}

runMobileAudit().catch(err => {
  console.error('❌ Erro na auditoria:', err);
  process.exit(1);
});
