const { chromium } = require('playwright');
const path = require('path');

async function diagnose() {
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

  console.log('--- DIAGNÓSTICO DASHBOARD ---');
  const dashInfo = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const bodyW = document.body.scrollWidth;
    const problems = [];

    // Procurar os maiores elementos que excedem docW
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (rect.right > docW + 1 && style.display !== 'none' && style.visibility !== 'hidden') {
        problems.push({
          tag: el.tagName,
          class: el.className,
          text: el.innerText ? el.innerText.slice(0, 40) : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          scrollWidth: el.scrollWidth,
          overflow: style.overflow,
          position: style.position,
          transform: style.transform
        });
      }
    });
    return { docW, bodyW, problems: problems.slice(0, 20) };
  });
  console.log(JSON.stringify(dashInfo, null, 2));

  // Entrar no primeiro evento
  const firstEvent = page.locator('article').first();
  if (await firstEvent.isVisible()) {
    await firstEvent.click();
    await page.waitForTimeout(2000);

    console.log('\n--- DIAGNÓSTICO EVENT DETAILS ---');
    const edInfo = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const bodyW = document.body.scrollWidth;
      const problems = [];

      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (rect.right > docW + 1 && style.display !== 'none' && style.visibility !== 'hidden') {
          problems.push({
            tag: el.tagName,
            class: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
            text: el.innerText ? el.innerText.slice(0, 40) : '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            scrollWidth: el.scrollWidth,
            overflow: style.overflow,
            position: style.position
          });
        }
      });
      return { docW, bodyW, problems: problems.slice(0, 20) };
    });
    console.log(JSON.stringify(edInfo, null, 2));
  }

  await browser.close();
}

diagnose();
