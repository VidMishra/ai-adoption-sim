/* End-to-end smoke test: plays Scenario 4 in Chrome and screenshots each screen.
 * Usage: node test/e2e.js [outDir]   (needs playwright-core; set PW_CORE to its path if not resolvable) */
const path = require('path');
const { execSync } = require('child_process');
let pw;
try { pw = require('playwright-core'); } catch (e) {
  const g = execSync('npm root -g').toString().trim();
  pw = require(process.env.PW_CORE || path.join(g, '@playwright/mcp/node_modules/playwright-core'));
}
const out = process.argv[2] || path.join(__dirname, 'shots');
require('fs').mkdirSync(out, { recursive: true });
const file = 'file://' + path.join(__dirname, '..', 'dist', 'Tipping-Point.html');

(async () => {
  const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const run = async (label, viewport, scheme) => {
    const page = await browser.newPage({ viewport, colorScheme: scheme });
    page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(`${label} console: ${m.text()}`); });
    page.on('dialog', d => d.accept());
    await page.goto(file);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const shot = n => page.screenshot({ path: path.join(out, `${label}-${n}.png`), fullPage: !/news|dilemma/.test(n) });
    await shot('01-home');
    await page.click('[data-act="pick-scenario"][data-id="s4"]');
    await page.click('[data-act="start"]');
    await shot('02-brief');

    let dlShot = false, dlCount = 0;
    const dilemma = async () => {
      while (await page.$('.dl-opt')) {
        if (!dlShot) { await page.waitForTimeout(350); await shot('12-dilemma'); dlShot = true; }
        const opts = await page.$$('.dl-opt');
        await opts[dlCount++ % opts.length].click();
        await page.waitForSelector('[data-act="close-news"]');
        if (dlCount === 1) { await page.waitForTimeout(350); await shot('13-dilemma-result'); }
        await page.click('[data-act="close-news"]');
      }
    };
    const pull = async (lever, targets = []) => {
      await dilemma();
      await page.click('[data-act="view"][data-view="decide"]');
      await page.click(`[data-act="pick-lever"][data-id="${lever}"]`);
      for (const t of targets) await page.click(`.picker [data-id="${t}"]`);
      const disabled = await page.$eval('[data-act="submit"]', b => b.disabled);
      if (disabled) { errors.push(`${label}: submit disabled for ${lever}`); return; }
      await page.click('[data-act="submit"]');
      await page.waitForSelector('.modal');
    };
    const ok = async () => { await page.click('[data-act="close-news"]'); await dilemma(); };

    await pull('listen', ['imran', 'devika', 'harish', 'lena']); await shot('03-news'); await ok();
    await pull('memo'); await ok();
    await page.click('[data-act="view"][data-view="decide"]');
    await page.click('[data-act="pick-lever"][data-id="pilot"]');
    await shot('04-decide');
    await pull('listen', ['gopal', 'manpreet', 'rajesh', 'priya']); await ok();
    await pull('example'); await ok();
    await pull('goals'); await ok();
    await page.click('[data-act="view"][data-view="dashboard"]'); await shot('05-org');
    await page.click('[data-act="open-person"][data-id="gopal"]'); await shot('06-drawer');
    await page.click('.drawer [data-act="close-drawer"]');
    await page.click('[data-act="view"][data-view="network"]');
    await page.click('g.node[data-id="rajesh"]'); await shot('07-network');

    // play on with a simple scripted plan until the game ends
    const plan = [['pledge'], ['champions', 'auto'], ['pilot', 'auto'], ['confront', 'res'], ['workshop', 'auto'], ['story', 'auto'], ['values'], ['confront', 'res'], ['champions', 'auto'], ['academy', 'auto'], ['dashboard'], ['confront', 'res'], ['workshop', 'auto'], ['spotlight', 'adopt'], ['champions', 'auto'], ['incentives'], ['pilot', 'auto'], ['academy', 'auto']];
    for (let k = 0; k < 60; k++) {
      const ended = await page.evaluate(() => !!document.querySelector('[data-view="debrief"]'));
      if (ended) break;
      const [lever, how] = plan[k % plan.length];
      const pick = await page.evaluate(([lever, how]) => {
        const E = window.TP_ENGINE, D = window.TP_DATA;
        const g = JSON.parse(localStorage.getItem('tp_game'));
        if (g.pending || !E.availability(g, lever).ok) return null;
        const l = E.LEVER[lever];
        if (l.scope === 'org') return [];
        const ids = Object.keys(g.people);
        let pool = how === 'res' ? ids.filter(i => g.people[i].resisting && g.people[i].stage >= 1)
          : how === 'adopt' ? ids.filter(i => g.people[i].stage === 4)
          : ids.filter(i => l.stages.includes(g.people[i].stage));
        return pool.slice(0, l.scope);
      }, [lever, how]);
      if (pick === null || (Array.isArray(pick) && E_empty(pick, lever))) {
        await dilemma();
        await page.click('[data-act="view"][data-view="decide"]');
        await page.click('[data-act="pick-lever"][data-id="listen"]');
        await page.click('[data-act="wait"]'); await page.waitForSelector('.modal'); await ok();
        continue;
      }
      await pull(lever, pick); await ok();
    }
    function E_empty(pick, lever) { return pick.length === 0 && !['memo', 'townhall', 'example', 'expert', 'goals', 'dashboard', 'values', 'pledge', 'incentives', 'restructure'].includes(lever); }
    await page.click('[data-act="view"][data-view="history"]'); await shot('08-history');
    const ended = await page.$('[data-view="debrief"]');
    if (ended) { await page.click('[data-act="view"][data-view="debrief"]'); await shot('09-debrief'); }
    else errors.push(`${label}: game did not end`);
    const code = await page.evaluate(() => document.getElementById('result-code')?.textContent || '');
    await page.click('[data-act="view"][data-view="playbook"]'); await shot('10-playbook');

    // facilitator: add our own result code plus a synthetic one
    await page.evaluate(() => { location.hash = ''; });
    await page.click('[data-act="menu"]');
    await page.click('.menu [data-view="facilitator"]');
    if (code) {
      const other = await page.evaluate(c => { const E = window.TP_ENGINE; const r = E.decodeResult(c); r.team = 'Team Falcon'; r.score -= 17; r.adopters -= 4; r.reached = false; r.end = 'time'; r.at = 'x'; r.curve = r.curve.map(p => [p[0], Math.max(0, p[1] - 3), p[2]]); return E.encodeResult(r); }, code);
      await page.fill('#fac-paste', code + '\n' + other);
      await page.click('[data-act="fac-add"]');
    }
    await page.click('[data-act="new-session"]');
    await shot('11-facilitator');
    await page.close();
  };
  await run('desktop', { width: 1366, height: 860 }, 'light');
  await run('mobile', { width: 390, height: 844 }, 'dark');
  await browser.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No errors.');
  console.log('Screenshots in', out);
})().catch(e => { console.error(e); process.exit(1); });
