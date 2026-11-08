const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const OUTPUT_DIR = '/home/emanuel/.gemini/antigravity/brain/bbb905c9-1c5d-4ee8-89a7-96c1a16c3673/mobile_audit';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=\"(.*)\"/)[1].trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=\"(.*)\"/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectMobilePanels() {
  console.log('📱 Iniciando inspeção mobile dos painéis internos do ReUNE...');
  const browser = await chromium.launch({ headless: true });
  
  // Testaremos em 375px (iPhone SE / padrão crítico mobile)
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });

  const page = await context.newPage();

  // Função auxiliar para detectar elementos que vazam a largura da tela
  async function findOverflowElements(stageName) {
    return await page.evaluate((stage) => {
      const docWidth = document.documentElement.clientWidth;
      const overflowing = [];
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const rect = el.getBoundingClientRect();
        // Se o elemento estiver visível e sair para a direita da tela
        if (rect.width > 0 && rect.height > 0) {
          if (rect.right > docWidth + 2) {
            overflowing.push({
              stage,
              tagName: el.tagName,
              id: el.id,
              className: el.className ? (typeof el.className === 'string' ? el.className.slice(0, 100) : '') : '',
              text: el.innerText ? el.innerText.trim().slice(0, 50) : '',
              rectRight: Math.round(rect.right),
              rectWidth: Math.round(rect.width),
              docWidth
            });
          }
        }
      }
      return {
        stage,
        docWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > docWidth,
        overflowingCount: overflowing.length,
        samples: overflowing.slice(0, 10)
      };
    }, stageName);
  }

  // 1. Cadastrar usuário ou logar
  const testEmail = `mobile_tester_${Date.now()}@teste.com`;
  const testPass = 'SenhaForte123!';
  console.log(`\n1. Criando conta de teste: ${testEmail}...`);

  await page.goto('http://localhost:8080/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const toggleToSignUp = page.locator('button:has-text("Não tem conta? Crie grátis")');
  if (await toggleToSignUp.isVisible()) {
    await toggleToSignUp.click();
    await page.waitForTimeout(300);
  }

  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPass);
  await page.click('button[type="submit"]:has-text("Criar Conta")');
  await page.waitForTimeout(3000);

  console.log('   ✓ Logado! URL atual:', page.url());

  // 2. Agora estamos no Dashboard do ReUNE!
  console.log('\n2. Inspecionando Dashboard do ReUNE (vazio)...');
  await page.waitForTimeout(1000);
  let ofCheck = await findOverflowElements('Dashboard Vazio');
  console.log('   Resultado Overflow Dashboard Vazio:', ofCheck);

  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_dashboard_empty.png'), fullPage: true });

  // 3. Criar 2 eventos para o usuário no banco:
  // Um evento normal com itens (suprimentos) e um evento com amigo secreto
  console.log('\n3. Injetando eventos de teste para popular o Dashboard...');
  const { data: { user } } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPass });
  const userId = user.id;

  // Evento 1: Churrasco dos Amigos com itens/suprimentos
  const { data: event1 } = await supabase.from('table_reune').insert({
    title: 'Super Churrasco da Galera & Pagode',
    event_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    event_time: '14:00',
    location: 'Rua das Flores, 1234 - Bairro Jardim América, São Paulo - SP',
    description: 'Churrasco comemorativo com muita picanha, cerveja e risadas!',
    user_id: userId,
    status: 'created',
    categoria_evento: 'churrasco',
    qtd_pessoas: 25
  }).select().single();

  // Inserir itens/suprimentos no evento 1
  if (event1) {
    console.log(`   ✓ Evento 1 criado ID ${event1.id}`);
    await supabase.from('itens_evento').insert([
      { id_evento: event1.id, nome_item: 'Picanha Bovina Especial Maturada a Vácuo', quantidade: 5, unidade: 'kg', categoria: 'Carnes', valor_estimado: 350.00 },
      { id_evento: event1.id, nome_item: 'Cerveja Artesanal IPA Lata 350ml', quantidade: 48, unidade: 'lata', categoria: 'Bebidas', valor_estimado: 240.00 },
      { id_evento: event1.id, nome_item: 'Carvão Vegetal em Saco Resistente 10kg', quantidade: 2, unidade: 'saco', categoria: 'Geral', valor_estimado: 50.00 },
      { id_evento: event1.id, nome_item: 'Pão de Alho Especial Recheado com Queijo', quantidade: 10, unidade: 'pacote', categoria: 'Acompanhamentos', valor_estimado: 80.00 },
    ]);
  }

  // Evento 2: Amigo Secreto da Firma & Final de Ano
  const { data: event2 } = await supabase.from('table_reune').insert({
    title: 'Amigo Secreto da Firma 2026',
    event_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    event_time: '19:30',
    location: 'Restaurante Fogo Campeiro Prime, Av. Paulista 999',
    description: 'Festa de fim de ano com amigo secreto e troca de presentes!',
    user_id: userId,
    status: 'created',
    categoria_evento: 'amigo_secreto',
    qtd_pessoas: 15
  }).select().single();

  if (event2) {
    console.log(`   ✓ Evento 2 (Amigo Secreto) criado ID ${event2.id}`);
    await supabase.from('event_dynamics').insert({
      event_id: event2.id,
      type: 'secret_santa',
      status: 'pending'
    });
    await supabase.from('event_secret_santa').insert({
      event_id: event2.id,
      has_drawn: false,
      draw_date: event2.event_date,
      min_price: 50,
      max_price: 150
    });
  }

  // 4. Recarregar o Dashboard para ver os cards populados
  console.log('\n4. Recarregando Dashboard com eventos...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Analisar vazamentos no Dashboard
  ofCheck = await findOverflowElements('Dashboard com Eventos');
  console.log('   Resultado Overflow Dashboard Populado:', ofCheck);

  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_dashboard_populated.png'), fullPage: true });

  // 5. Clicar no Banner do Amigo Secreto ou botão do topo para abrir o Wizard
  console.log('\n5. Abrindo Wizard de Amigo Secreto no Dashboard...');
  const ssBtn = page.locator('nav button:has-text("Amigo Secreto")').first();
  if (await ssBtn.isVisible()) {
    await ssBtn.click();
    await page.waitForTimeout(800);
    const ssModalOf = await findOverflowElements('Wizard Amigo Secreto no Dash');
    console.log('   Resultado Overflow Wizard Amigo Secreto:', ssModalOf);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_dashboard_ss_wizard.png') });
    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // 6. Entrar no Evento 1 (Churrasco com itens/suprimentos)
  console.log(`\n6. Entrando nos detalhes do Evento 1 (ID: ${event1?.id})...`);
  const event1Card = page.locator(`article:has-text("Super Churrasco")`).first();
  if (await event1Card.isVisible()) {
    await event1Card.click();
    await page.waitForTimeout(2000);
    console.log('   ✓ Entrou no EventDetails! URL:', page.url());

    // Analisar overflow no EventDetails
    const edOf = await findOverflowElements('EventDetails Churrasco');
    console.log('   Resultado Overflow EventDetails:', edOf);

    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_event_details_top.png') });

    // Scroll para suprimentos / itens
    console.log('   Scrollando para a lista de suprimentos/itens...');
    const suppliesSection = page.locator('text=Lista de Suprimentos, text=Itens, text=Suprimentos').first();
    if (await suppliesSection.isVisible()) {
      await suppliesSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
    } else {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(600);
    }

    const suppliesOf = await findOverflowElements('EventDetails Suprimentos');
    console.log('   Resultado Overflow Suprimentos:', suppliesOf);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_event_details_supplies.png') });

    // Full page screenshot do EventDetails
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_event_details_fullpage.png'), fullPage: true });
  }

  // 7. Voltar e entrar no Evento 2 (Amigo Secreto dentro do ReUNE)
  console.log(`\n7. Voltando ao Dashboard e entrando no Evento 2 (Amigo Secreto)...`);
  const backBtn = page.locator('nav button').first();
  await backBtn.click();
  await page.waitForTimeout(1500);

  const event2Card = page.locator(`article:has-text("Amigo Secreto da Firma")`).first();
  if (await event2Card.isVisible()) {
    await event2Card.click();
    await page.waitForTimeout(2000);
    console.log('   ✓ Entrou no EventDetails do Amigo Secreto!');

    const edSSOf = await findOverflowElements('EventDetails Amigo Secreto');
    console.log('   Resultado Overflow EventDetails Amigo Secreto:', edSSOf);

    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_event_details_secret_santa_fullpage.png'), fullPage: true });
  }

  await browser.close();
  console.log('\n✅ Inspeção Playwright concluída com sucesso!');
}

inspectMobilePanels().catch(err => {
  console.error('❌ Erro na inspeção:', err);
  process.exit(1);
});
