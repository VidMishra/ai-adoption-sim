/* Tipping Point — user interface. */
(function () {
  'use strict';
  const D = window.TP_DATA, E = window.TP_ENGINE;
  const { STAGES, PEOPLE, LEVERS, SCENARIOS, PHASES, COMPANY, CONCEPTS, CRITICAL_MASS, MAX_CRED, LEVELS, DILEMMAS } = D;
  const asLevel = sc => (sc.authority === 4 ? 'C-suite executive' : sc.level);
  const quadIndex = sc => (sc.urgency === 'high' ? 2 : 0) + (sc.power === 'high' ? 1 : 0);
  const authMeter = n => `<span class="auth" title="Authority ${n} of 4">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const P = E.PERSON, L = E.LEVER, S = E.SCENARIO;

  const ST_COLOR = ['var(--st0)', 'var(--st1)', 'var(--st2)', 'var(--st3)', 'var(--st4)'];
  const LV_COLOR = { staff: 'var(--lv-staff)', exec: 'var(--lv-exec)', mid: 'var(--lv-mid)', front: 'var(--lv-front)' };
  const LV_NAME = { staff: 'CEO staff', exec: 'Top executives', mid: 'Middle managers', front: 'Frontline' };
  const EXECS = ['imran', 'devika', 'arjun', 'sunita', 'kofi'];
  const ORG_ORDER = ['lena', 'harish', 'imran', 'neha', 'victor', 'devika', 'priya', 'gopal', 'rajesh', 'manpreet', 'ravi', 'arjun', 'meilin', 'sameer', 'sunita', 'fatima', 'kofi', 'daniel', 'ananya', 'joanna'];

  /* ---------- storage (never required) ---------- */
  const store = {
    get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- app state ---------- */
  const app = {
    view: 'home', game: null, selLever: null, selTargets: [], drawer: null, news: null, menu: false,
    home: { mode: 'single', scenario: 's4', team: '', session: '' },
    fac: { records: store.get('tp_fac') || [], sort: 'score', session: 'all' },
    flash: [], netFocus: null, toast: null, confirm: null
  };
  const saved = store.get('tp_game');
  const theme = store.get('tp_theme');
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  if (location.hash === '#facilitator') app.view = 'facilitator';

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = name => name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const first = id => P[id].name.split(' ')[0];
  const plural = (n, w, pl) => `${n} ${n === 1 ? w : (pl || w + 's')}`;
  const listNames = ids => ids.map(first).join(', ');

  const I = {
    warn: '<path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5Z" fill="currentColor"/>',
    fear: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11Z" fill="currentColor"/>',
    check: '<path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="2"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    print: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    users: '<circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    home: '<path d="M4 11 12 4l8 7v9H4v-9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  };
  const icon = (n, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

  const BRAND = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="var(--brand)"/><path d="M8 22c3-.4 5-2.6 6.4-6.2C15.8 12 17.6 9.6 24 9.4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="9.4" r="2.6" fill="#fff"/><circle cx="8" cy="22" r="1.8" fill="#fff" opacity=".7"/></svg>`;

  function save() { if (app.game) store.set('tp_game', app.game); }
  function toast(msg) {
    app.toast = msg; render();
    clearTimeout(toast.t); toast.t = setTimeout(() => { app.toast = null; render(); }, 2200);
  }
  function download(name, text, type = 'application/json') {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard'); } catch (e2) { toast('Select the code and copy it manually'); }
      ta.remove();
    }
  }

  /* ---------- person card ---------- */
  function personCard(id, o = {}) {
    const p = P[id];
    const s = app.game ? app.game.people[id] : { stage: 0, interviewed: false, resisting: false, fearful: false };
    const flags = [];
    if (s.interviewed) flags.push(`<span class="flag int" title="Interviewed">${icon('chat')}</span>`);
    if (s.interviewed && s.resisting) flags.push(`<span class="flag res" title="Active resister">${icon('warn')}</span>`);
    if (s.interviewed && s.fearful) flags.push(`<span class="flag fear" title="Held back by fear of loss">${icon('fear')}</span>`);
    const meter = [1, 2, 3, 4].map(i => `<i class="${s.stage >= i ? 'on' : ''}" style="${s.stage >= i ? 'background:' + ST_COLOR[s.stage] : ''}"></i>`).join('');
    const cls = ['pc', o.selected ? 'sel' : '', o.dim ? 'dim' : '', app.flash.includes(id) ? 'flash' : '', o.wide ? 'wide' : ''].join(' ');
    const act = o.selectable ? `data-act="toggle-target" data-id="${id}"` : `data-act="open-person" data-id="${id}"`;
    return `<button class="${cls}" style="--lvc:${LV_COLOR[p.level]}" ${act} aria-pressed="${!!o.selected}">
      ${o.selectable ? `<span class="check">${o.selected ? icon('check', 'icon') : ''}</span>` : ''}
      <span class="pc-flags">${flags.join('')}</span>
      <span class="av">${initials(p.name)}</span>
      <span class="pc-body">
        <span class="pc-name" style="display:block">${esc(p.name)}</span>
        <span class="pc-title" style="display:block">${esc(p.title)}</span>
        <span class="meter">${meter}</span>
        <span class="pc-stage" style="display:block;color:${s.stage ? ST_COLOR[s.stage] : 'var(--ink-3)'}">${STAGES[s.stage]}</span>
      </span>
    </button>`;
  }
  function youCard() {
    const sc = app.game ? S[app.game.scenarioId] : S[app.home.scenario];
    return `<div class="pc you" style="cursor:default"><span class="av" style="background:var(--brand)">You</span><span class="pc-body">
      <span class="pc-name" style="display:block">You · ${esc(sc.level)}</span><span class="pc-title" style="display:block">${esc(sc.role)}${sc.reportsTo ? ' · reports to ' + esc(P[sc.reportsTo].name.split(' ')[0]) : ''}</span>
      <span class="meter">${[1, 2, 3, 4].map(() => `<i class="on" style="background:var(--st4)"></i>`).join('')}</span>
      <span class="pc-stage" style="display:block;color:var(--st4)">Adoption</span></span></div>`;
  }

  function orgChart(o = {}) {
    const sel = id => app.selTargets.includes(id);
    const card = id => personCard(id, { selectable: o.selectable, selected: o.selectable && sel(id), dim: o.dimFn && o.dimFn(id) });
    const kids = id => PEOPLE.filter(p => p.manager === id).map(p => p.id);
    const tree = id => {
      const k = kids(id);
      return `${card(id)}${k.length ? `<div class="org-children">${k.map(tree).join('')}</div>` : ''}`;
    };
    return `<div class="org"><div class="org-inner">
      <div class="org-top">${youCard()}</div>
      <div class="org-row"><div style="width:230px">${card('lena')}</div><div style="width:230px">${card('harish')}</div></div>
      <div class="org-cols">${EXECS.map(id => `<div class="org-col"><div class="org-dept">${esc(P[id].dept)}</div>${tree(id)}</div>`).join('')}</div>
    </div></div>`;
  }
  const legend = () => `<div class="legend">
      ${Object.entries(LV_NAME).map(([k, v]) => `<span><i style="background:${LV_COLOR[k]}"></i>${v}</span>`).join('')}
      <span style="margin-left:8px"><span class="flag int" style="width:18px;height:18px">${icon('chat')}</span>Interviewed</span>
      <span><span class="flag res" style="width:18px;height:18px">${icon('warn')}</span>Resister</span>
      <span><span class="flag fear" style="width:18px;height:18px">${icon('fear')}</span>Fear of loss</span>
    </div>`;

  /* ---------- status bar ---------- */
  function statusBar() {
    const g = app.game;
    const counts = [0, 0, 0, 0, 0]; Object.values(g.people).forEach(p => counts[p.stage]++);
    const ad = counts[4];
    const dots = ORG_ORDER.map((_, i) => `<i class="${i < ad ? 'on' : i < ad + counts[3] ? 'trial' : ''}"></i>`).join('');
    const cmLeft = ((CRITICAL_MASS - 0.5) / PEOPLE.length) * 100;
    const phases = PHASES.map((ph, i) => `<div class="ph ${g.phase > i ? 'done' : g.phase === i ? 'now' : ''}"><i></i>${ph}</div>${i < 2 ? `<div class="ln ${g.phase > i ? 'done' : ''}"></div>` : ''}`).join('');
    return `<footer class="statusbar" aria-label="Simulation status">
      <div class="stat"><div class="stat-label">Weeks used <b>${g.week} / ${g.maxWeeks}</b></div><div class="bar"><span style="width:${(g.week / g.maxWeeks) * 100}%"></span></div></div>
      <div class="stat"><div class="stat-label">Critical mass <b>${ad} / ${PEOPLE.length} adopted</b></div><div class="dots">${dots}<span class="cm-mark" style="left:${cmLeft}%">TARGET ${CRITICAL_MASS}</span></div></div>
      <div class="stat"><div class="stat-label">Phase <b>${PHASES[g.phase]}</b></div><div class="phases">${phases}</div></div>
      <div class="stat"><div class="stat-label">Credibility <b>${g.cred} / ${MAX_CRED}</b></div><div class="bar cred ${g.cred <= 3 ? 'low' : ''}"><span style="width:${(g.cred / MAX_CRED) * 100}%"></span></div></div>
    </footer>`;
  }

  /* ---------- top bar ---------- */
  function topBar() {
    const g = app.game;
    const tabs = g && app.view !== 'facilitator' && app.view !== 'home'
      ? [['brief', 'Brief'], ['dashboard', 'Organisation'], ['network', 'Network'], ['decide', 'Decide'], ['history', 'History'], ['playbook', 'Playbook']].concat(g.ended ? [['debrief', 'Debrief']] : [])
      : [];
    const sc = g ? S[g.scenarioId] : null;
    return `<header class="topbar">
      <button class="brand" data-act="go-home" title="Home">${BRAND}<span>Tipping Point<small>${sc && app.view !== 'home' && app.view !== 'facilitator' ? `Scenario ${sc.number} · ${esc(sc.title)}` : 'Leading AI adoption'}</small></span></button>
      <nav class="nav" aria-label="Sections">${tabs.map(([v, t]) => `<button class="${app.view === v ? 'active' : ''}" data-act="view" data-view="${v}">${t}${v === 'debrief' ? '<span class="badge-dot"></span>' : ''}</button>`).join('')}</nav>
      <div class="menu-wrap" style="${tabs.length ? '' : 'margin-left:auto'}">
        <button class="btn btn-ghost btn-sm" data-act="menu" aria-label="Menu">${icon('menu')}</button>
        ${app.menu ? `<div class="menu" role="menu">
          <button data-act="go-home">${icon('home')}Home</button>
          ${g && !g.ended ? `<button data-act="restart">${icon('refresh')}Restart this scenario</button>` : ''}
          ${g ? `<button data-act="export-game">${icon('download')}Download my game file</button>` : ''}
          <button data-act="view" data-view="facilitator">${icon('users')}Facilitator dashboard</button>
          <button data-act="theme">${icon('moon')}Switch light / dark</button>
        </div>` : ''}
      </div>
    </header>`;
  }

  /* ---------- views ---------- */
  function heroArt() {
    const segs = [[0, 2.5, 'var(--st1)'], [2.5, 16, 'var(--st2)'], [16.6, 50, 'var(--st3)'], [50, 84, 'var(--brand)'], [84, 100, 'var(--st4)']];
    const W = 420, H = 300, base = 250;
    const y = x => base - 200 * Math.exp(-Math.pow((x - 50) / 22, 2));
    const area = (a, b) => { let d = `M${a * 4.2},${base}`; for (let x = a; x <= b; x += 1) d += ` L${x * 4.2},${y(x)}`; return d + ` L${b * 4.2},${base} Z`; };
    return `<svg class="hero-art" viewBox="0 0 ${W} ${H}" role="img" aria-label="Diffusion of innovation curve">
      ${segs.map(([a, b, c]) => `<path d="${area(a, b)}" fill="${c}" opacity=".88"/>`).join('')}
      <line x1="${16.3 * 4.2}" y1="40" x2="${16.3 * 4.2}" y2="${base}" stroke="var(--ink)" stroke-dasharray="3 4" stroke-width="1.5"/>
      <text x="${16.3 * 4.2 + 6}" y="52" font-size="12" font-weight="700" fill="var(--ink-2)" font-family="Inter, sans-serif">THE CHASM</text>
      <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="var(--line-2)" stroke-width="2"/>
      ${['Innovators', 'Early adopters', 'Early majority', 'Late majority', 'Laggards'].map((t, i) => `<text x="${[0, 44, 150, 262, 360][i]}" ${i === 1 ? 'dy="14"' : ''} y="${base + 22}" font-size="11" fill="var(--ink-3)" font-family="Inter, sans-serif" font-weight="600">${t}</text>`).join('')}
      <circle cx="${68 * 4.2}" cy="${y(68) - 14}" r="7" fill="var(--surface)" stroke="var(--brand)" stroke-width="3"/>
    </svg>`;
  }

  function viewHome() {
    const h = app.home;
    const quad = [['s1', 's2'], ['s3', 's4']];
    const resume = app.game && !app.game.ended ? app.game : null;
    return `<section class="hero">
        <div>
          <div class="kicker">A change-leadership simulation</div>
          <h1>Tipping Point</h1>
          <p class="lead">Lead ${esc(COMPANY.name)} through company-wide AI adoption. Diagnose 20 key people across four levels, pull the right levers in the right order, and reach a critical mass of genuine adopters before time — or your credibility — runs out.</p>
          <div class="chips" style="margin-top:14px"><span class="pill">4 roles: Manager to C-suite</span><span class="pill">20 people · 4 levels</span><span class="pill">18 change levers</span><span class="pill">Critical decisions</span><span class="pill">Single player or class</span></div>
        </div>
        ${heroArt()}
      </section>
      <div class="home-body">
        ${resume ? `<div class="card resume" style="margin-bottom:20px"><div><b>Continue your game</b><div class="small muted">Scenario ${S[resume.scenarioId].number} · ${esc(S[resume.scenarioId].title)} · week ${resume.week} of ${resume.maxWeeks}${resume.team ? ' · ' + esc(resume.team) : ''}</div></div>
          <button class="btn btn-accent" data-act="resume">${icon('play')}Resume</button></div>` : ''}
        <div class="card">
          <div class="mode-tabs" role="tablist">
            <button class="${h.mode === 'single' ? 'active' : ''}" data-act="mode" data-mode="single">Single player</button>
            <button class="${h.mode === 'class' ? 'active' : ''}" data-act="mode" data-mode="class">Class session</button>
          </div>
          ${h.mode === 'class' ? `<div class="form-row">
              <div class="field"><label for="f-team">Team or player name</label><input id="f-team" data-input="team" value="${esc(h.team)}" placeholder="e.g. Team Falcon" maxlength="40"></div>
              <div class="field"><label for="f-session">Session code</label><input id="f-session" data-input="session" value="${esc(h.session)}" placeholder="From your facilitator, e.g. IIMI-7Q2" maxlength="24" style="text-transform:uppercase"></div>
            </div>
            <p class="small muted" style="margin-top:-6px">Every team using the same session code plays under identical conditions, so results are directly comparable. At the end you will get a result code to hand to your facilitator.</p>` :
            `<p class="muted" style="margin-bottom:18px">Play at your own pace. Your progress is saved in this browser as you go.</p>`}
          <h3 style="margin-top:6px">Choose your role</h3>
          <p class="small muted">The same company, the same 20 people and the same AI programme, led from four different seats. The more senior you are, the more levers you can pull alone, and the more each decision is watched.</p>
          <div class="roles" style="margin-top:14px">
            ${SCENARIOS.map(sc => `<button class="scn ${h.scenario === sc.id ? 'selected' : ''}" data-act="pick-scenario" data-id="${sc.id}">
              <span class="num" style="display:flex;justify-content:space-between;align-items:center;gap:8px">Scenario ${sc.number} · ${esc(sc.level)} ${authMeter(sc.authority)}</span>
              <h3>${esc(sc.title)}</h3><span class="small" style="font-weight:600">${esc(sc.role)}</span><p>${esc(sc.strategy)}</p>
              <span class="meta"><span class="pill ${sc.urgency === 'high' ? 'brand' : 'accent'}">${sc.urgency === 'high' ? 'High urgency' : 'Low urgency'}</span><span class="pill">${sc.weeks} weeks</span><span class="pill">Credibility ${sc.startCred}/10</span></span></button>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:20px;flex-wrap:wrap">
            <button class="btn btn-ghost" data-act="view" data-view="facilitator">${icon('users')}Facilitator dashboard</button>
            <button class="btn btn-primary btn-lg" data-act="start">${icon('play')}Start Scenario ${S[h.scenario].number}</button>
          </div>
        </div>
        <div class="grid-3" style="margin-top:20px">
          <div class="card"><h4>1 · Diagnose</h4><p class="small" style="margin:0">Listen before you act. Interviews reveal who resists, who is afraid, and who is friends with whom.</p></div>
          <div class="card"><h4>2 · Decide</h4><p class="small" style="margin:0">Each lever costs weeks, works only on certain stages, and needs time before it can be reused. Mistimed levers burn credibility.</p></div>
          <div class="card"><h4>3 · Debrief</h4><p class="small" style="margin:0">See your adoption curve, what worked, what backfired, and reflection questions for discussion.</p></div>
        </div>
      </div>`;
  }

  function viewBrief() {
    const g = app.game, sc = S[g.scenarioId];
    const voices = sc.voices;
    const quadIdx = quadIndex(sc);
    return `<div class="section-head"><div><div class="kicker">Scenario ${sc.number} · ${esc(sc.quadrant)}</div><h1 style="margin:0">${esc(sc.title)}</h1></div>
        <button class="btn btn-primary" data-act="view" data-view="decide">Go to decisions ${icon('play')}</button></div>
      <div class="brief">
        <div class="card prose">
          ${sc.intro.map(p => `<p>${esc(p)}</p>`).join('')}
          <div class="divider"></div>
          <h3>Where people stand today</h3><p>${esc(sc.startNote || '')}</p>
          ${(() => { const c = g.timeline[0].counts; return `<div class="stage-strip" style="margin-bottom:14px">${STAGES.map((st, i) => `<div class="stage-box" style="--c:${ST_COLOR[i]}"><b>${c[i]}</b><span>${st}</span></div>`).join('')}</div>`; })()}
          <h3>The company</h3><p>${esc(COMPANY.blurb)}</p>
          <h3>The AI programme</h3><ul class="clean">${COMPANY.program.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          <div class="divider"></div>
          <h3>First reactions</h3>
          ${voices.map(([id, q]) => `<div class="quote"><b>${esc(P[id].name)} · ${esc(P[id].title)}</b><span>“${esc(q)}”</span></div>`).join('')}
        </div>
        <div>
          <div class="card">
            <h4>Your position</h4>
            <div class="facts" style="grid-template-columns:1fr 1fr">
              <div class="fact"><span>Role</span><b style="font-size:13.5px">${esc(sc.role)}</b></div>
              <div class="fact"><span>Authority</span><b style="display:flex;gap:8px;align-items:center">${esc(sc.level)} ${authMeter(sc.authority)}</b></div>
              <div class="fact"><span>Reports to</span><b style="font-size:13.5px">${sc.reportsTo ? esc(P[sc.reportsTo].name) + ', ' + esc(P[sc.reportsTo].title) : sc.authority === 4 ? 'The board' : 'The CEO'}</b></div>
              <div class="fact"><span>Urgency</span><b>${sc.urgency === 'high' ? 'High' : 'Low'}</b></div>
              <div class="fact"><span>Time budget</span><b>${sc.weeks} weeks</b></div>
              <div class="fact"><span>Credibility</span><b>${sc.startCred} / 10</b></div>
              <div class="fact"><span>Win condition</span><b>${CRITICAL_MASS} of 20 adopt</b></div>
            </div>
            <div class="concept-matrix" style="margin-top:8px">
              ${CONCEPTS.matrix.map((m, i) => `<div class="cell ${i === quadIdx ? 'me' : ''}"><b class="small">${esc(m.name)}</b><div class="tiny muted">${m.power === 'high' ? 'High' : 'Low'} power · ${m.urgency === 'high' ? 'high' : 'low'} urgency</div></div>`).join('')}
            </div>
          </div>
          <div class="card">
            <h4>How it works</h4>
            <ul class="clean small">
              <li>Each person climbs a ladder: <b>Unaware → Aware → Interest → Trial → Adoption</b>.</li>
              <li>Every lever works only on certain stages. Pull it on the wrong people and it fails — and costs credibility.</li>
              <li>Some levers spread to a person's <b>friends</b> or <b>coworkers</b>. Friendships are hidden until you hold listening sessions.</li>
              <li>Credibility makes every lever stronger. If it hits zero, you have lost the room.</li>
              <li>${sc.authority < 4 ? `Some levers need more authority than a ${esc(asLevel(sc))} holds (goals and incentives need VP level; the reskilling guarantee and reorganising need C-suite). To pull them you first need senior sponsors at the trial stage or beyond.` : 'You hold every lever, but authority spent badly drains credibility fast.'}</li>
              ${sc.reportsTo ? `<li>Your boss, <b>${esc(P[sc.reportsTo].name)}</b>, matters: once they are trying the change, every lever works better. If they turn against you, every lever works worse.</li>` : ''}
              <li>Along the way you will face <b>${sc.dilemmas.length} critical decisions</b>. There is no undo, and some consequences arrive later.</li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  function stageStrip() {
    const c = [0, 0, 0, 0, 0]; Object.values(app.game.people).forEach(p => c[p.stage]++);
    return `<div class="stage-strip">${STAGES.map((s, i) => `<div class="stage-box" style="--c:${ST_COLOR[i]}"><b>${c[i]}</b><span>${s}</span></div>`).join('')}</div>`;
  }

  function viewDashboard() {
    return `<div class="section-head"><div><h2>Organisation</h2><p>Click anyone to see what you know about them.</p></div>${legend()}</div>
      ${stageStrip()}<div class="card">${orgChart()}</div>`;
  }

  /* ---------- network ---------- */
  function viewNetwork() {
    const g = app.game;
    const order = ['you', ...ORG_ORDER];
    const N = order.length, R = 245, C = 320;
    const pos = {};
    order.forEach((id, i) => { const a = -Math.PI / 2 + (i / N) * Math.PI * 2; pos[id] = [C + R * Math.cos(a), C + R * Math.sin(a), a]; });
    const edges = new Map();
    const key = (a, b) => [a, b].sort().join('|');
    PEOPLE.forEach(p => { const m = p.manager || 'you'; edges.set(key(p.id, m), { a: p.id, b: m, formal: true, friend: false }); });
    D.FRIENDSHIPS.forEach(([a, b]) => {
      if (!(g.people[a].interviewed || g.people[b].interviewed)) return;
      const k = key(a, b); const e = edges.get(k);
      if (e) e.friend = true; else edges.set(k, { a, b, formal: false, friend: true });
    });
    const f = app.netFocus;
    const near = new Set(f ? [f] : []);
    const edgeSvg = [...edges.values()].map(e => {
      const [x1, y1] = pos[e.a], [x2, y2] = pos[e.b];
      const cx = C + ((x1 + x2) / 2 - C) * 0.25, cy = C + ((y1 + y2) / 2 - C) * 0.25;
      const type = e.formal && e.friend ? 'both' : e.formal ? 'formal' : 'friend';
      const hl = f && (e.a === f || e.b === f);
      if (hl) { near.add(e.a); near.add(e.b); }
      return `<path class="edge ${type} ${hl ? 'hl' : ''}" d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}"/>`;
    }).join('');
    const nodes = order.map(id => {
      const [x, y, a] = pos[id];
      const st = id === 'you' ? 4 : g.people[id].stage;
      const label = id === 'you' ? 'You' : first(id);
      const lx = C + (R + 30) * Math.cos(a), ly = C + (R + 30) * Math.sin(a);
      const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
      const ring = id !== 'you' && g.people[id].interviewed ? `<circle r="21" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 3"/>` : '';
      const lvc = id === 'you' ? 'var(--brand)' : LV_COLOR[P[id].level];
      return `<g class="node ${f && !near.has(id) ? 'fade' : ''}" transform="translate(${x},${y})" data-act="net-focus" data-id="${id}" tabindex="0">
        ${ring}<circle r="16" fill="${lvc}"/><circle r="16" fill="none" stroke="${ST_COLOR[st]}" stroke-width="4" opacity="${st ? 1 : 0}"/>
        <text text-anchor="middle" dy="4" style="fill:#fff;font-size:10.5px;font-weight:700">${id === 'you' ? 'YOU' : initials(P[id].name)}</text>
        <text x="${lx - x}" y="${ly - y + 4}" text-anchor="${anchor}">${esc(label)}</text></g>`;
    }).join('');
    const revealed = PEOPLE.filter(p => g.people[p.id].interviewed).length;
    const fp = f && f !== 'you' ? P[f] : null;
    return `<div class="section-head"><div><h2>Relationship network</h2><p>Formal reporting lines are always visible. Friendships appear once you have held a listening session with either person.</p></div><span class="pill accent">${revealed} of 20 networks revealed</span></div>
      <div class="net-wrap">
        <div class="card net ${f ? 'focus' : ''}"><svg viewBox="-40 -10 720 660" role="img" aria-label="Relationship network">${edgeSvg}${nodes}</svg></div>
        <div>
          <div class="card"><h4>Legend</h4>
            <div class="legend" style="flex-direction:column;align-items:flex-start;gap:8px">
              <span><i style="background:var(--good)"></i>Works directly with</span>
              <span><i style="background:var(--warn)"></i>Is friends with</span>
              <span><i style="background:var(--accent)"></i>Works with and is friends with</span>
              <span><i style="background:transparent;border:2px dashed var(--accent);border-radius:50%"></i>Interviewed</span>
            </div>
            <p class="tiny muted" style="margin-top:10px">The coloured outer ring shows each person's adoption stage.</p>
          </div>
          <div class="card">${fp ? personSummary(f) : `<p class="muted small" style="margin:0">Click a person to highlight their connections.</p>`}</div>
        </div>
      </div>`;
  }

  function personSummary(id) {
    const g = app.game, p = P[id], s = g.people[id];
    const friends = E.friendsOf(id);
    return `<div class="drawer-head" style="margin-bottom:10px"><span class="av" style="background:${LV_COLOR[p.level]}">${initials(p.name)}</span><div><b>${esc(p.name)}</b><div class="small muted">${esc(p.title)}</div></div></div>
      <div class="chips" style="margin-bottom:10px"><span class="pill" style="color:${ST_COLOR[s.stage]}">${STAGES[s.stage]}</span><span class="pill">${LV_NAME[p.level]}</span>${s.interviewed && s.resisting ? '<span class="pill warn">Resister</span>' : ''}${s.interviewed && s.fearful ? '<span class="pill bad">Fear of loss</span>' : ''}</div>
      ${s.interviewed ? `<p class="small"><b>Friends:</b> ${friends.length ? listNames(friends) : 'none'}</p><p class="small" style="font-style:italic;color:var(--ink-2)">“${esc(p.concern)}”</p>`
        : `<div class="locked-box">Hold a listening session with ${esc(first(id))} to learn how they feel and who their friends are.</div>`}
      <button class="btn btn-sm" style="margin-top:10px" data-act="open-person" data-id="${id}">Full profile</button>`;
  }

  /* ---------- decide ---------- */
  function viewDecide() {
    const g = app.game;
    if (g.ended) return `<div class="card empty"><h2>The simulation has ended</h2><p>See how you did in the debrief.</p><button class="btn btn-primary" data-act="view" data-view="debrief">Open debrief</button></div>`;
    const rows = LEVERS.map(l => {
      const av = E.availability(g, l.id);
      return `<tr class="${app.selLever === l.id ? 'active' : ''} ${av.ok ? '' : 'locked'}" data-act="pick-lever" data-id="${l.id}">
        <td class="num hide-sm">${g.attempts[l.id] || ''}</td>
        <td><span class="kind ${l.kind}" title="${l.kind === 'enabling' ? 'Enabling (less disruptive)' : 'Substantive (more disruptive)'}"></span><span class="lname">${esc(l.name)}</span>${!av.ok && av.cooldown ? ` <span class="pill tiny" style="margin-left:4px">${icon('clock', 'icon')} ${av.cooldown}w</span>` : ''}</td>
        <td class="num">${l.scope === 'org' ? 'All' : l.scope}</td>
        <td class="num">${l.weeks}</td>
        <td class="num hide-sm">${l.reuse}</td></tr>`;
    }).join('');
    return `<div class="section-head"><div><h2>Decide</h2><p>Choose a lever, choose who it targets, and commit. Week ${g.week} of ${g.maxWeeks}.</p></div>
        <div class="legend"><span><i style="background:var(--accent)"></i>Enabling lever</span><span><i style="background:var(--brand)"></i>Substantive lever</span></div></div>
      <div class="decide">
        <div class="card" style="padding:8px 8px 4px">
          <table class="lever-table"><thead><tr><th class="num hide-sm">Used</th><th>Lever</th><th class="num">Scope</th><th class="num">Weeks</th><th class="num hide-sm">Reuse</th></tr></thead><tbody>${rows}</tbody></table>
        </div>
        <div class="card lever-panel">${leverPanel()}</div>
      </div>`;
  }

  function leverPanel() {
    const g = app.game;
    if (!app.selLever) {
      return `<div class="empty">${icon('info')}<h3 style="margin-top:10px">Select a lever</h3><p class="small">Pick a lever on the left to see what it does, who it can move, and to choose your targets.</p>
        <div class="divider"></div><p class="small">Stuck waiting for levers to become available?</p><button class="btn btn-sm" data-act="wait">${icon('clock')}Wait one week</button></div>`;
    }
    const l = L[app.selLever], sc = S[g.scenarioId];
    const av = E.availability(g, l.id);
    const spill = { friends: 'Their friends', coworkers: 'Their coworkers', both: 'Their friends and coworkers' }[l.spill];
    const notices = [];
    if (!av.ok) notices.push(`<div class="notice warn">${icon('clock')}<span>${esc(av.reason)}</span></div>`);
    const needS = E.sponsorsNeeded(g, l.id);
    if (av.ok && needS > 0) notices.push(`<div class="notice ${E.seniorSponsors(g) >= needS ? 'info' : 'bad'}">${icon(E.seniorSponsors(g) >= needS ? 'check' : 'warn')}<span>Needs <b>${LEVELS[l.authority]}</b> authority. As a ${esc(asLevel(sc))}, you need <b>${needS} senior sponsors</b> at trial or beyond. You have <b>${E.seniorSponsors(g)}</b>.</span></div>`);
    if (g.pending) notices.unshift(`<div class="notice bad">${icon('warn')}<span>A critical decision needs your attention first. <button class="btn btn-sm" data-act="show-dilemma" style="margin-left:6px">Open it</button></span></div>`);
    if (av.ok && l.needsPhase != null && g.phase < l.needsPhase) notices.push(`<div class="notice warn">${icon('warn')}<span>Most effective in the ${PHASES[l.needsPhase]} phase. You are in ${PHASES[g.phase]}.</span></div>`);
    if (av.ok && l.needsCred != null && g.cred < l.needsCred) notices.push(`<div class="notice warn">${icon('warn')}<span>Needs credibility of at least ${l.needsCred}. You have ${g.cred}.</span></div>`);

    let picker = '';
    if (l.scope !== 'org') {
      const n = app.selTargets.length;
      picker = `<div class="picker-head"><b>Choose ${l.scope === 1 ? 'one person' : 'up to ' + l.scope + ' people'}</b>
          <span class="pill ${n === l.scope ? 'good' : n ? 'brand' : ''}">${n} / ${l.scope} selected</span>
          ${n ? `<button class="btn btn-ghost btn-sm" data-act="clear-targets">Clear</button>` : ''}</div>
        <div class="picker">${ORG_ORDER.map(id => personCard(id, { selectable: true, selected: app.selTargets.includes(id), dim: !l.stages.includes(g.people[id].stage) && !l.spotlight && l.id !== 'listen' })).join('')}</div>
        <p class="tiny muted" style="margin:8px 0 0">Faded cards are not at a stage this lever can move.</p>`;
    } else {
      picker = `<div class="notice info">${icon('users')}<span>This lever applies to the <b>whole organisation</b>. It moves everyone who is at a stage it can influence.</span></div>`;
    }
    const canSubmit = av.ok && (l.scope === 'org' || app.selTargets.length > 0);
    return `<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><h2 style="margin:0">${esc(l.name)}</h2>
        <span class="pill ${l.kind === 'enabling' ? 'accent' : 'brand'}">${l.kind === 'enabling' ? 'Enabling' : 'Substantive'}</span></div>
      <p class="desc" style="margin-top:10px">${esc(l.desc)}</p>
      <div class="facts"><div class="fact"><span>Scope</span><b>${l.scope === 'org' ? 'Entire org' : plural(l.scope, 'person', 'people')}</b></div>
        <div class="fact"><span>Takes</span><b>${plural(l.weeks, 'week')}</b></div><div class="fact"><span>Reuse after</span><b>${plural(l.reuse, 'week')}</b></div></div>
      <h4>Can move people who are</h4>
      <div class="stage-chips">${STAGES.slice(0, 4).map((s, i) => `<span class="stage-chip ${l.stages.includes(i) ? 'on' : ''}" style="${l.stages.includes(i) ? 'background:' + ST_COLOR[Math.max(i, 1)] : ''}">${s}</span>`).join('')}</div>
      ${spill ? `<p class="small" style="margin:10px 0 0"><b>Also influences:</b> ${spill}</p>` : ''}
      ${notices.join('')}
      ${picker}
      <div class="submit-row"><button class="btn btn-sm btn-ghost" data-act="wait">${icon('clock')}Wait one week</button>
        <button class="btn btn-primary" data-act="submit" ${canSubmit ? '' : 'disabled'}>Pull lever · ${plural(l.weeks, 'week')}</button></div>`;
  }

  /* ---------- history ---------- */
  function adoptionChart(timeline, maxWeeks, o = {}) {
    const W = 760, H = o.h || 240, pl = 34, pr = 14, pt = 12, pb = 28;
    const x = w => pl + (w / maxWeeks) * (W - pl - pr);
    const y = n => pt + (1 - n / 20) * (H - pt - pb);
    const pts = timeline.map(t => ({ w: t.week, i: t.counts[2] + t.counts[3] + t.counts[4], tr: t.counts[3] + t.counts[4], a: t.counts[4] }));
    const stepArea = key => {
      let d = `M${x(pts[0].w)},${y(0)}`;
      pts.forEach((p, k) => { if (k) d += ` L${x(p.w)},${y(pts[k - 1][key])}`; d += ` L${x(p.w)},${y(p[key])}`; });
      const last = pts[pts.length - 1];
      return d + ` L${x(last.w)},${y(0)} Z`;
    };
    const grid = [0, 4, 8, 12, 16, 20].map(n => `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(n)}" y2="${y(n)}"/><text x="${pl - 8}" y="${y(n) + 4}" text-anchor="end">${n}</text>`).join('');
    const ticks = Array.from({ length: Math.floor(maxWeeks / 8) + 1 }, (_, i) => i * 8).map(w => `<text x="${x(w)}" y="${H - 8}" text-anchor="middle">${w}</text>`).join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Adoption over time">${grid}${ticks}
      <path d="${stepArea('i')}" fill="var(--st2)" opacity=".25"/><path d="${stepArea('tr')}" fill="var(--st3)" opacity=".45"/><path d="${stepArea('a')}" fill="var(--st4)" opacity=".85"/>
      <line x1="${pl}" x2="${W - pr}" y1="${y(CRITICAL_MASS)}" y2="${y(CRITICAL_MASS)}" stroke="var(--brand)" stroke-width="1.6" stroke-dasharray="5 4"/>
      <text x="${W - pr}" y="${y(CRITICAL_MASS) - 6}" text-anchor="end" style="fill:var(--brand);font-weight:700">Critical mass</text>
      <text x="${(W + pl) / 2}" y="${H + 6}" text-anchor="middle" style="font-weight:600">Week</text></svg>
      <div class="legend" style="margin-top:12px"><span><i style="background:var(--st4)"></i>Adoption</span><span><i style="background:var(--st3);opacity:.6"></i>Trial or beyond</span><span><i style="background:var(--st2);opacity:.4"></i>Interest or beyond</span></div></div>`;
  }

  const TONE = { good: ['good', 'Well judged'], mixed: ['warn', 'Trade-off'], poor: ['bad', 'Costly'] };
  const OUTCOME = { success: ['good', 'Worked'], partial: ['warn', 'Partly worked'], mistimed: ['bad', 'Mistimed'], blocked: ['bad', 'Blocked'], wait: ['', 'Waited'] };
  function viewHistory() {
    const g = app.game;
    const rows = g.history.slice().reverse().map(h => {
      const moved = Object.entries(h.moved).map(([st, ids]) => `${ids.length} → ${STAGES[st]}`).join(', ');
      if (h.lever === 'dilemma') {
        const dl = DILEMMAS[h.dilemma], opt = dl.options[h.option];
        return `<tr><td class="muted">${h.weekStart}</td><td><b>Critical decision: ${esc(dl.title)}</b><div class="tiny muted">${esc(opt.label)}</div></td>
          <td><span class="pill ${TONE[h.tone][0]}">${TONE[h.tone][1]}</span></td><td>${Object.entries(h.moved).map(([st, ids]) => `${ids.length} → ${STAGES[st]}`).join(', ') || '<span class="muted">—</span>'}</td>
          <td style="font-weight:700;color:${h.credDelta > 0 ? 'var(--good)' : h.credDelta < 0 ? 'var(--bad)' : 'var(--ink-3)'}">${h.credDelta > 0 ? '+' : ''}${h.credDelta || '0'}</td></tr>`;
      }
      const [tone, label] = OUTCOME[h.outcome];
      return `<tr><td class="muted">${h.weekStart}</td><td><b>${h.lever === 'wait' ? 'Waited one week' : esc(L[h.lever].name)}</b>${Array.isArray(h.targets) && h.targets.length ? `<div class="tiny muted">${listNames(h.targets)}</div>` : h.targets === 'org' ? '<div class="tiny muted">Entire organisation</div>' : ''}</td>
        <td><span class="pill ${tone}">${label}</span></td><td>${moved || '<span class="muted">—</span>'}</td>
        <td style="font-weight:700;color:${h.credDelta > 0 ? 'var(--good)' : h.credDelta < 0 ? 'var(--bad)' : 'var(--ink-3)'}">${h.credDelta > 0 ? '+' : ''}${h.credDelta || '0'}</td></tr>`;
    }).join('');
    return `<div class="section-head"><div><h2>History</h2><p>${plural(g.history.length, 'decision')} so far.</p></div></div>
      <div class="card">${adoptionChart(g.timeline, g.maxWeeks)}</div>
      <div class="card" style="overflow-x:auto">${g.history.length ? `<table class="hist-table"><thead><tr><th>Week</th><th>Decision</th><th>Outcome</th><th>Stage moves</th><th>Cred.</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">No decisions yet.</div>'}</div>`;
  }

  /* ---------- playbook ---------- */
  function viewPlaybook() {
    const sc = app.game ? S[app.game.scenarioId] : null;
    const qi = sc ? quadIndex(sc) : -1;
    const ladder = [['Awareness', 'Knows the change is happening and roughly why.'], ['Interest', 'Sees how it affects them; willing to explore.'], ['Trial', 'Actually using the tools — the pivotal stage.'], ['Adoption', 'Uses it as the new normal and advocates for it.']];
    return `<div class="section-head"><div><h2>Playbook</h2><p>The ideas behind the simulation.</p></div></div>
      <div class="grid-2">
        <div class="card"><h3>The change agent's strategy matrix</h3><p class="small muted">Power is contextual, and timing changes the rules.</p>
          <div class="concept-matrix">${CONCEPTS.matrix.map((m, i) => `<div class="cell ${i === qi ? 'me' : ''}"><b>${esc(m.name)}</b><div class="tiny muted" style="margin-bottom:6px">${m.power === 'high' ? 'High' : 'Low'} power · ${m.urgency === 'high' ? 'high' : 'low'} urgency${i === qi ? ' · <b style="color:var(--brand)">you are here</b>' : ''}</div><div class="small">${esc(m.text)}</div></div>`).join('')}</div></div>
        <div class="card"><h3>How individuals change</h3><p class="small muted">Change is a ladder each person climbs, in order.</p>
          <div class="ladder">${ladder.map(([n, t], i) => `<div style="background:${ST_COLOR[i + 1]}"><b>${n}</b><span>${t}</span></div>`).join('')}</div>
          <h3 style="margin-top:18px">How the organisation changes</h3>
          <table class="hist-table"><tbody>
            <tr><td><b>Mobilise</b></td><td class="small">Make the case and build the coalition.</td><td class="small muted">Awareness → Interest</td></tr>
            <tr><td><b>Movement</b></td><td class="small">Build momentum through visible wins.</td><td class="small muted">Interest → Trial</td></tr>
            <tr><td><b>Sustain</b></td><td class="small">Embed it in systems, structures and norms.</td><td class="small muted">Trial → Adoption</td></tr>
          </tbody></table></div>
      </div>
      <div class="grid-2" style="margin-top:16px">
        <div class="card"><h3>The costs of change</h3><p class="small muted">People resist what change costs them, not change itself. Lowering a cost often beats raising the urgency.</p>
          <ul class="clean">${CONCEPTS.costs.map(c => `<li><b>${esc(c.name)}</b> — ${esc(c.text)}</li>`).join('')}</ul></div>
        <div class="card"><h3>Authority by role</h3><p class="small muted">Levers above your level need senior sponsors: one level short needs 2 sponsors, two or more levels short needs 3.</p>
          <table class="hist-table"><thead><tr><th>Lever</th><th>Needs</th>${SCENARIOS.map(x => `<th class="tiny">${esc(x.level.replace('Corporate ', ''))}</th>`).join('')}</tr></thead><tbody>
          ${LEVERS.filter(x => x.command).map(x => `<tr><td class="small"><b>${esc(x.name)}</b></td><td class="small">${esc(LEVELS[x.authority])}</td>${SCENARIOS.map(sc2 => { const n = sc2.authority >= x.authority ? 0 : Math.min(3, (x.authority - sc2.authority) * 2); return `<td class="small">${n ? n + ' sponsors' : '<span style="color:var(--good);font-weight:700">Alone</span>'}</td>`; }).join('')}</tr>`).join('')}
          </tbody></table></div>
      </div>
      <div class="grid-2" style="margin-top:16px">
        <div class="card"><h3>Lever families</h3>
          <p class="small"><span class="kind enabling"></span><b>Enabling levers</b> are less disruptive: listening, communicating, piloting, training, storytelling. They build readiness and credibility.</p>
          <p class="small"><span class="kind substantive"></span><b>Substantive levers</b> are more disruptive: goals and deadlines, values, incentives, restructuring, confronting resisters. Powerful — and costly if mistimed.</p>
          <p class="small muted" style="margin:0">Network effects matter: a lever pulled on a well-connected person travels further.</p></div>
      </div>`;
  }

  /* ---------- debrief ---------- */
  function viewDebrief() {
    const g = app.game, sc = S[g.scenarioId];
    const s = E.score(g), ins = E.insights(g);
    const head = { 'critical-mass': ['You reached the tipping point', `${s.adopters} of 20 key people genuinely adopted the AI programme by week ${g.week}${g.maxWeeks - g.week > 0 ? `, ${plural(g.maxWeeks - g.week, 'week')} ahead of the deadline` : ', right on the deadline'}.`],
      credibility: ['You lost the room', `Your credibility fell to zero in week ${g.week}. People stopped listening, and the programme stalled with ${s.adopters} adopters.`],
      time: ['Time ran out', `By week ${g.week}, ${s.adopters} of 20 people had adopted — short of the critical mass of ${CRITICAL_MASS}.`],
      ended: ['You ended the simulation', `You stopped in week ${g.week} with ${s.adopters} adopters.`] }[g.endReason] || ['Simulation complete', ''];
    const C = 2 * Math.PI * 62;
    const rec = E.resultRecord(g), code = E.encodeResult(rec);
    const tl = g.history.filter(h => h.lever !== 'wait' && h.lever !== 'dilemma').map(h => `<span class="tl" style="--c:${h.outcome === 'success' ? 'var(--good)' : h.outcome === 'partial' ? 'var(--warn)' : 'var(--bad)'}">w${h.weekStart} · ${esc(L[h.lever].name)}</span>`).join('');
    return `<div class="card"><div class="debrief-hero">
        <div class="ring"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" fill="none" stroke="var(--surface-2)" stroke-width="14"/>
          <circle cx="75" cy="75" r="62" fill="none" stroke="${s.reached ? 'var(--good)' : 'var(--brand)'}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - s.total / 100)}"/></svg>
          <div class="val"><div><b>${s.total}</b><span>Grade ${s.grade}</span></div></div></div>
        <div><div class="kicker">Scenario ${sc.number} · ${esc(sc.title)}${g.team ? ' · ' + esc(g.team) : ''}</div><h1 style="margin-bottom:8px">${head[0]}</h1><p class="muted" style="font-size:16px">${head[1]}</p>
          <div class="breakdown">
            <div class="fact"><span>Adoption</span><b>${s.adoption} / 55</b></div><div class="fact"><span>Momentum</span><b>${s.progress} / 10</b></div>
            <div class="fact"><span>Credibility</span><b>${s.cred} / 15</b></div><div class="fact"><span>Speed</span><b>${s.speed} / 20</b></div>
          </div></div></div></div>
      <div class="card"><h3>Your adoption curve</h3>${adoptionChart(g.timeline, g.maxWeeks)}</div>
      <div class="card"><h3>What the simulation noticed</h3><div class="insights">${ins.map(i => `<div class="insight ${i.tone}"><span class="ic">${icon(i.tone === 'good' ? 'check' : 'warn')}</span><div><b>${esc(i.title)}</b><p>${esc(i.text)}</p></div></div>`).join('')}</div></div>
      ${g.choices && g.choices.length ? `<div class="card"><h3>Your critical decisions</h3><div class="insights">${g.choices.map(([id, i, tone]) => { const dl = DILEMMAS[id], o = dl.options[i]; return `<div class="insight ${tone === 'good' ? 'good' : 'warn'}"><span class="ic">${icon(tone === 'good' ? 'check' : 'warn')}</span><div><b>${esc(dl.title)}: ${esc(o.label)}</b><p><span class="pill ${TONE[tone][0]}" style="margin-right:6px">${TONE[tone][1]}</span>${esc(o.lesson)}</p></div></div>`; }).join('')}</div></div>` : ''}
      <div class="card"><h3>Your sequence of levers</h3><div class="timeline">${tl || '<span class="muted">No levers pulled.</span>'}</div>
        <p class="tiny muted" style="margin:10px 0 0">Green worked · amber partly worked · red mistimed or blocked.</p></div>
      <div class="grid-2" style="margin-top:16px">
        <div class="card"><h3>Reflect</h3><ol class="reflect">
          <li><b>The credibility ledger.</b> When did your credibility drop most? Which lever did you pull too early because the situation felt urgent? Where at work does urgency make you rush past people's readiness?</li>
          <li><b>The cost of change.</b> Pick one cost — fear of loss, a new identity, new competencies, or time and energy. What could a leader do to lower that cost, rather than just raise the urgency?</li>
          <li><b>Reacting or responding.</b> Recall a moment when AI news or a change at work set off an automatic reaction in you. What story did you tell yourself? What would a deliberate response have looked like?</li>
          <li><b>Your seat.</b> Which of the four roles is closest to your own? Which levers can you pull alone, whose sponsorship do you need, and which critical decision would you find hardest?</li></ol></div>
        <div class="card"><h3>${g.mode === 'class' ? 'Submit your result' : 'Save your result'}</h3>
          <p class="small muted">${g.mode === 'class' ? 'Copy this result code and send it to your facilitator, or download the file.' : 'Keep a record, or share it with a facilitator to compare with others.'}</p>
          <div class="code-box" id="result-code">${esc(code)}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px" class="no-print">
            <button class="btn btn-sm btn-accent" data-act="copy-code">${icon('copy')}Copy code</button>
            <button class="btn btn-sm" data-act="download-result">${icon('download')}Download result</button>
            <button class="btn btn-sm" data-act="print">${icon('print')}Print debrief</button></div>
          <div class="divider"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap" class="no-print"><button class="btn btn-primary" data-act="replay">${icon('refresh')}Play this scenario again</button><button class="btn" data-act="go-home">Try another scenario</button></div>
        </div>
      </div>`;
  }

  /* ---------- facilitator ---------- */
  function facRecords() {
    const f = app.fac;
    return f.records.filter(r => f.session === 'all' || (r.session || '') === f.session);
  }
  function viewFacilitator() {
    const f = app.fac;
    const recs = facRecords();
    const sessions = [...new Set(f.records.map(r => r.session || ''))];
    const sorters = { score: (a, b) => b.score - a.score, adopters: (a, b) => b.adopters - a.adopters, cred: (a, b) => b.cred - a.cred, weeks: (a, b) => a.weeks - b.weeks, team: (a, b) => a.team.localeCompare(b.team) };
    const sorted = recs.slice().sort(sorters[f.sort] || sorters.score);
    const avg = (arr, k) => arr.length ? (arr.reduce((s, r) => s + (+r[k]), 0) / arr.length) : 0;
    const byScn = SCENARIOS.map(sc => { const rs = recs.filter(r => r.scenario === sc.id); return { sc, n: rs.length, score: avg(rs, 'score'), cm: rs.length ? rs.filter(r => r.reached).length / rs.length : 0, cred: avg(rs, 'cred'), weeks: avg(rs, 'weeks') }; });
    const leverUse = LEVERS.map(l => {
      const teams = recs.filter(r => r.levers.some(x => x[0] === l.id)).length;
      const pulls = recs.reduce((s, r) => s + r.levers.filter(x => x[0] === l.id).length, 0);
      const misses = recs.reduce((s, r) => s + r.levers.filter(x => x[0] === l.id && (x[2] === 'm' || x[2] === 'b')).length, 0);
      return { l, teams, pulls, misses };
    }).sort((a, b) => b.pulls - a.pulls);
    const maxPulls = Math.max(1, ...leverUse.map(x => x.pulls));
    const curves = recs.slice(0, 40).map((r, i) => {
      const max = r.maxWeeks || 96;
      const W = 760, H = 220, pl = 34, pr = 14, pt = 10, pb = 26;
      const x = w => pl + (w / 104) * (W - pl - pr), y = n => pt + (1 - n / 20) * (H - pt - pb);
      let d = ''; r.curve.forEach((c, k) => { d += `${k ? ' L' : 'M'}${x(c[0])},${y(k ? r.curve[k - 1][1] : c[1])} L${x(c[0])},${y(c[1])}`; });
      const hue = (i * 47) % 360;
      return `<path d="${d}" fill="none" stroke="hsl(${hue} 60% 50%)" stroke-width="2" opacity=".85"><title>${esc(r.team)} · S${S[r.scenario].number} · ${r.score}</title></path>`;
    }).join('');
    const W = 760, H = 220, pl = 34, pr = 14, pt = 10, pb = 26;
    const cx = w => pl + (w / 104) * (W - pl - pr), cy = n => pt + (1 - n / 20) * (H - pt - pb);
    const curveSvg = `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${[0, 4, 8, 12, 16, 20].map(n => `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${cy(n)}" y2="${cy(n)}"/><text x="${pl - 8}" y="${cy(n) + 4}" text-anchor="end">${n}</text>`).join('')}
      ${[0, 16, 32, 48, 64, 80, 96].map(w => `<text x="${cx(w)}" y="${H - 6}" text-anchor="middle">${w}</text>`).join('')}
      <line x1="${pl}" x2="${W - pr}" y1="${cy(CRITICAL_MASS)}" y2="${cy(CRITICAL_MASS)}" stroke="var(--brand)" stroke-dasharray="5 4"/>${curves}</svg></div>`;

    return `<div class="section-head"><div><div class="kicker">Facilitator</div><h2 style="margin:0">Class dashboard</h2><p>Collect result codes from teams, compare outcomes and lead the debrief. Everything stays in this browser.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${app.game ? `<button class="btn" data-act="view" data-view="${app.game.ended ? 'debrief' : 'decide'}">Back to my game</button>` : `<button class="btn" data-act="go-home">${icon('home')}Home</button>`}</div></div>
      <div class="grid-2">
        <div class="card"><h3>Run a class session</h3>
          <ol class="clean small"><li>Create a session code and put it on the screen.</li><li>Teams open this file, choose <b>Class session</b>, enter their team name and the code, and pick the scenario you assign.</li><li>At the end, each team copies its result code and sends it to you (chat, form or email), or sends the downloaded file.</li><li>Paste the codes below and use the charts for the debrief.</li></ol>
          <div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap"><button class="btn btn-accent btn-sm" data-act="new-session">Create session code</button>${f.newCode ? `<span class="pill brand" style="font-size:18px;padding:6px 14px;letter-spacing:.08em">${esc(f.newCode)}</span><button class="btn btn-sm btn-ghost" data-act="copy-session">${icon('copy')}</button>` : ''}</div>
        </div>
        <div class="card"><h3>Add results</h3>
          <div class="field"><textarea id="fac-paste" rows="4" placeholder="Paste one or more result codes (TP1.…), one per line"></textarea></div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-primary btn-sm" data-act="fac-add">Add codes</button>
            <label class="btn btn-sm" style="cursor:pointer">${icon('upload')}Upload files<input type="file" id="fac-files" accept=".json,.txt" multiple hidden></label>
            <span class="tiny muted">or drop files here</span></div>
        </div>
      </div>
      ${f.records.length ? `
      <div class="card" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h3 style="margin:0">Leaderboard</h3>
            <select data-input="fac-session" class="btn btn-sm">${['all', ...sessions].map(s => `<option value="${esc(s)}" ${f.session === s ? 'selected' : ''}>${s === 'all' ? 'All sessions' : s ? 'Session ' + esc(s) : 'No session'}</option>`).join('')}</select></div>
          <div style="display:flex;gap:8px"><button class="btn btn-sm" data-act="fac-csv">${icon('download')}Export CSV</button><button class="btn btn-sm btn-ghost" data-act="fac-clear">${icon('trash')}Clear all</button></div></div>
        <div class="grid-3" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
          <div class="fact"><span>Teams</span><b>${recs.length}</b></div><div class="fact"><span>Average score</span><b>${avg(recs, 'score').toFixed(0)}</b></div>
          <div class="fact"><span>Reached critical mass</span><b>${recs.length ? Math.round(recs.filter(r => r.reached).length / recs.length * 100) : 0}%</b></div><div class="fact"><span>Average credibility</span><b>${avg(recs, 'cred').toFixed(1)}</b></div></div>
        <div style="overflow-x:auto"><table class="lb"><thead><tr><th>#</th>${[['team', 'Team'], ['', 'Scenario'], ['score', 'Score'], ['adopters', 'Adopters'], ['cred', 'Credibility'], ['weeks', 'Weeks used'], ['', 'Outcome'], ['', '']].map(([k, t]) => `<th ${k ? `data-act="fac-sort" data-k="${k}"` : ''}>${t}${f.sort === k ? ' ▾' : ''}</th>`).join('')}</tr></thead>
          <tbody>${sorted.map((r, i) => `<tr><td class="rank">${i + 1}</td><td><b>${esc(r.team)}</b>${r.session ? `<div class="tiny muted">${esc(r.session)}</div>` : ''}</td><td>S${S[r.scenario].number} ${esc(S[r.scenario].title)}</td>
            <td><b>${r.score}</b> <span class="pill">${r.grade}</span></td><td>${r.adopters}/20</td><td>${r.cred}/10</td><td>${r.weeks}/${r.maxWeeks}</td>
            <td><span class="pill ${r.reached ? 'good' : r.end === 'credibility' ? 'bad' : 'warn'}">${r.reached ? 'Tipping point' : r.end === 'credibility' ? 'Lost the room' : 'Out of time'}</span></td>
            <td><button class="btn btn-ghost btn-sm" data-act="fac-del" data-i="${f.records.indexOf(r)}" title="Remove">${icon('x')}</button></td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="grid-2" style="margin-top:16px">
        <div class="card"><h3>Adoption curves</h3><p class="small muted">Adopters over time for each team. Hover a line to see the team.</p>${curveSvg}</div>
        <div class="card"><h3>By scenario</h3><table class="hist-table"><thead><tr><th>Scenario</th><th>Teams</th><th>Avg score</th><th>Tipping point</th><th>Avg cred.</th></tr></thead><tbody>
          ${byScn.map(b => `<tr><td><b>S${b.sc.number}</b> ${esc(b.sc.title)}</td><td>${b.n}</td><td>${b.n ? b.score.toFixed(0) : '—'}</td><td>${b.n ? Math.round(b.cm * 100) + '%' : '—'}</td><td>${b.n ? b.cred.toFixed(1) : '—'}</td></tr>`).join('')}</tbody></table>
          <h3 style="margin-top:18px">Debrief prompts</h3><ul class="clean small"><li>Which teams reached the tipping point fastest — and what did their first five moves have in common?</li><li>Where did credibility drop most across the class? Which lever was most often mistimed?</li><li>Compare a Manager team and a C-suite team. How did their sequences differ, and when did each reach for authority?</li><li>Which critical decision split the class most? What made the poor option tempting?</li><li>Who addressed fear of loss, and when? What happened to the frontline?</li></ul></div>
      </div>
      ${(() => {
        const ids = Object.keys(DILEMMAS).filter(id => recs.some(r => (r.dilemmas || []).some(c => c[0] === id)));
        if (!ids.length) return '';
        return `<div class="card" style="margin-top:16px"><h3>Critical decisions across teams</h3><p class="small muted">How teams chose when it mattered. Green = well judged, amber = trade-off, red = costly.</p>
          <div class="grid-2">${ids.map(id => { const dl = DILEMMAS[id]; const tot = recs.filter(r => (r.dilemmas || []).some(c => c[0] === id)).length;
            return `<div><b class="small">${esc(dl.title)}</b> <span class="tiny muted">(${tot} team${tot === 1 ? '' : 's'})</span><div class="bars" style="margin-top:6px">${dl.options.map((o, i) => { const n = recs.filter(r => (r.dilemmas || []).some(c => c[0] === id && c[1] === i)).length;
              return `<div class="row" style="grid-template-columns:1fr 90px 28px"><span class="tiny">${String.fromCharCode(65 + i)}. ${esc(o.label)}</span><div class="track"><span style="width:${tot ? n / tot * 100 : 0}%;background:${o.tone === 'good' ? 'var(--good)' : o.tone === 'mixed' ? 'var(--warn)' : 'var(--bad)'}"></span></div><b class="tiny">${n}</b></div>`; }).join('')}</div></div>`; }).join('')}</div></div>`;
      })()}
      <div class="card" style="margin-top:16px"><h3>Lever usage across teams</h3><p class="small muted">Bar = total pulls. Red share = mistimed or blocked.</p><div class="bars">
        ${leverUse.filter(x => x.pulls).map(x => `<div class="row"><span>${esc(x.l.name)}</span><div class="track" style="display:flex"><span style="width:${(x.pulls - x.misses) / maxPulls * 100}%;border-radius:4px 0 0 4px"></span><span style="width:${x.misses / maxPulls * 100}%;background:var(--bad);border-radius:0 4px 4px 0"></span></div><b class="small">${x.pulls}</b></div>`).join('')}
      </div></div>` : `<div class="card empty" style="margin-top:16px"><h3>No results yet</h3><p class="small">Results appear here once you paste codes or upload files from teams.</p></div>`}`;
  }

  /* ---------- modal & drawer ---------- */
  function newsModal() {
    const h = app.news; if (!h) return '';
    const g = app.game;
    const isDl = h.lever === 'dilemma';
    const l = h.lever === 'wait' || isDl ? null : L[h.lever];
    const msg = isDl ? h.result : { success: 'You had sufficient credibility and timed this lever well.', partial: 'The lever landed — but not on everyone you chose.', mistimed: 'This lever was mistimed.', blocked: 'This lever was blocked.', wait: 'A quiet week.' }[h.outcome];
    const moved = Object.entries(h.moved).sort((a, b) => a[0] - b[0]);
    const credCls = h.credDelta > 0 ? 'up' : h.credDelta < 0 ? 'down' : '';
    const phaseMsg = g.phase !== h.phaseAtStart ? `<div class="notice info">${icon('up')}<span>You have moved the company from <b>${PHASES[h.phaseAtStart]}</b> into the <b>${PHASES[g.phase]}</b> phase.</span></div>` : '';
    const endMsg = g.ended ? `<div class="notice ${g.endReason === 'critical-mass' ? 'info' : 'bad'}">${icon(g.endReason === 'critical-mass' ? 'check' : 'warn')}<span>${g.endReason === 'critical-mass' ? '<b>You reached critical mass.</b> The change is now self-sustaining.' : g.endReason === 'credibility' ? '<b>Your credibility is gone.</b> The simulation is over.' : '<b>You are out of time.</b> The simulation is over.'}</span></div>` : '';
    return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="news-title"><div class="modal">
      <div class="modal-head"><div><div class="news-kicker">News for week ${h.weekEnd}</div><h2 id="news-title" style="margin:6px 0 0">${isDl ? esc(DILEMMAS[h.dilemma].title) : l ? esc(l.name) : 'You waited a week'}</h2>
        ${isDl ? `<div class="small muted" style="margin-top:4px">You chose: <b>${esc(DILEMMAS[h.dilemma].options[h.option].label)}</b></div>` : ''}
        <p class="outcome" style="color:${isDl ? (h.tone === 'good' ? 'var(--good)' : h.tone === 'mixed' ? 'var(--warn)' : 'var(--bad)') : h.outcome === 'success' ? 'var(--good)' : h.outcome === 'partial' ? 'var(--warn)' : h.outcome === 'wait' ? 'var(--ink-2)' : 'var(--bad)'}">${esc(msg)}</p></div>
        <div class="cred-box ${credCls}"><div class="n">${g.cred}</div><small>${h.credDelta > 0 ? `Up ${h.credDelta}` : h.credDelta < 0 ? `Down ${-h.credDelta}` : 'No change'}</small></div></div>
      <div class="modal-body">
        ${h.notes.map(n => `<p style="color:var(--ink-2)">${esc(n)}</p>`).join('')}
        ${isDl ? `<div class="notice info">${icon('info')}<span><b>Lesson:</b> ${esc(h.lesson)}</span></div>
          ${Object.keys(h.moved).length ? `<div class="moved">${Object.entries(h.moved).sort((a, b) => a[0] - b[0]).map(([st, ids]) => `<div class="moved-col"><h4><i style="background:${ST_COLOR[st]}"></i>Entered ${STAGES[st]}</h4>${ids.map(id => `<div>${esc(P[id].name)}</div>`).join('')}</div>`).join('')}</div>` : ''}` : ''}
        ${h.events.map(e => `<div class="notice warn">${icon('info')}<span>${esc(e)}</span></div>`).join('')}
        ${l ? `<div class="divider"></div><h4>Effect on people</h4><p style="margin:0 0 4px"><b>${plural(h.directImpacted, 'person', 'people')}</b> directly influenced · <b>${plural(h.indirectImpacted, 'person', 'people')}</b> through their networks</p>
        ${moved.length ? `<div class="moved">${moved.map(([st, ids]) => `<div class="moved-col"><h4><i style="background:${ST_COLOR[st]}"></i>Entered ${STAGES[st]}</h4>${ids.map(id => `<div>${esc(P[id].name)}</div>`).join('')}</div>`).join('')}</div>` : `<p class="muted">Nobody changed stage this time${h.directImpacted ? ' — but influence builds up, and the next push may tip them' : ''}.</p>`}` : ''}
        ${h.revealed.length ? `<div class="notice info">${icon('chat')}<span>You now know how ${listNames(h.revealed)} feel and who they are friends with. Check the Organisation and Network pages.</span></div>` : ''}
        ${phaseMsg}${endMsg}
      </div>
      <div class="modal-foot">${g.pending && !g.ended ? `<span class="small" style="margin-right:auto;color:var(--brand);font-weight:650;align-self:center">${icon('warn')} A critical decision has come up</span>` : ''}<button class="btn btn-primary" data-act="close-news" autofocus>${g.ended ? 'See debrief' : g.pending ? 'Face the decision' : 'OK, got it'}</button></div></div></div>`;
  }

  function dilemmaModal() {
    const g = app.game;
    if (!g || !g.pending || app.news || app.view === 'home' || app.view === 'facilitator' || app.hideDilemma) return '';
    const dl = DILEMMAS[g.pending], sc = S[g.scenarioId];
    const whoId = dl.who === 'boss' ? sc.reportsTo : dl.who;
    const who = whoId ? P[whoId] : null;
    return `<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="dl-title"><div class="modal">
      <div class="modal-head"><div><div class="news-kicker" style="color:var(--brand)">Critical decision · week ${g.week}</div><h2 id="dl-title" style="margin:6px 0 0">${esc(dl.title)}</h2></div>
        ${who ? `<span class="av" style="width:54px;height:54px;font-size:17px;background:${LV_COLOR[who.level]}" title="${esc(who.name)}">${initials(who.name)}</span>` : ''}</div>
      <div class="modal-body"><p style="font-size:16px;color:var(--ink-2)">${esc(E.fillText(g, dl.text))}</p>
        <h4 style="margin-top:6px">What do you do?</h4>
        <div class="dl-options">${dl.options.map((o, i) => `<button class="dl-opt" data-act="choose" data-i="${i}"><b>${String.fromCharCode(65 + i)}. ${esc(o.label)}</b><span>${esc(o.detail)}</span></button>`).join('')}</div>
        <p class="tiny muted" style="margin-top:12px">As a ${esc(asLevel(sc))}, some options carry different consequences than they would for someone more or less senior. There is no undo.</p>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost btn-sm" data-act="hide-dilemma">Look at the organisation first</button></div></div></div>`;
  }

  function drawer() {
    const id = app.drawer; if (!id || !app.game) return '';
    const g = app.game, p = P[id], s = g.people[id];
    const friends = E.friendsOf(id), cow = E.coworkersOf(id);
    const mgr = p.manager ? P[p.manager].name : 'You';
    return `<div class="overlay" data-act="close-drawer" style="background:rgba(15,12,8,.25);place-items:stretch"></div>
      <aside class="drawer" role="dialog" aria-label="${esc(p.name)}">
        <button class="btn btn-ghost btn-sm" style="position:absolute;top:14px;right:14px" data-act="close-drawer" aria-label="Close">${icon('x')}</button>
        <div class="drawer-head"><span class="av" style="background:${LV_COLOR[p.level]}">${initials(p.name)}</span><div><h3 style="margin:0">${esc(p.name)}</h3><div class="muted small">${esc(p.title)}</div><div class="tiny muted">${esc(p.dept)} · reports to ${esc(mgr)}</div></div></div>
        <div class="chips" style="margin-bottom:16px"><span class="pill" style="background:${s.stage ? ST_COLOR[s.stage] : 'var(--surface-2)'};color:${s.stage ? '#fff' : 'var(--ink-2)'}">${STAGES[s.stage]}</span><span class="pill">${LV_NAME[p.level]}</span>
          ${s.interviewed && s.resisting ? '<span class="pill warn">Active resister</span>' : ''}${s.interviewed && s.fearful ? '<span class="pill bad">Fear of loss</span>' : ''}${s.interviewed && !s.resisting && p.resister ? '<span class="pill good">Resistance resolved</span>' : ''}</div>
        <h4>Adoption ladder</h4>
        <div class="meter" style="margin-bottom:18px">${[1, 2, 3, 4].map(i => `<i class="${s.stage >= i ? 'on' : ''}" style="height:8px;${s.stage >= i ? 'background:' + ST_COLOR[s.stage] : ''}"></i>`).join('')}</div>
        ${s.interviewed ? `<h4>What they told you</h4><div class="quote"><b>${esc(p.stance)}</b><span>“${esc(p.concern)}”</span></div>
          <h4>Informal network</h4><p class="small">${friends.length ? 'Friends with ' + friends.map(f => `<b>${esc(P[f].name)}</b>`).join(', ') : 'No close friends at work.'}</p>`
        : `<div class="locked-box">${icon('chat')} You have not held a listening session with ${esc(first(id))}. Their views, worries and friendships are still unknown.</div>`}
        <h4 style="margin-top:16px">Works directly with</h4><p class="small">${cow.map(c => esc(P[c].name)).join(', ')}${p.manager === null ? ', You' : ''}</p>
      </aside>`;
  }

  /* ---------- render ---------- */
  function render() {
    const root = document.getElementById('app');
    const scrollY = window.scrollY;
    const picker = document.querySelector('.picker');
    const pickerScroll = picker ? picker.scrollTop : 0;
    const v = app.view;
    let body = '';
    if (v === 'home') body = viewHome();
    else if (v === 'facilitator') body = viewFacilitator();
    else if (!app.game) { app.view = 'home'; body = viewHome(); }
    else body = ({ brief: viewBrief, dashboard: viewDashboard, network: viewNetwork, decide: viewDecide, history: viewHistory, playbook: viewPlaybook, debrief: viewDebrief }[v] || viewBrief)();
    const showStatus = app.game && !['home', 'facilitator'].includes(app.view);
    root.innerHTML = `<div class="app">${topBar()}<main class="main ${v === 'home' ? 'full' : ''}" id="main">${body}</main>${showStatus ? statusBar() : ''}</div>
      ${newsModal()}${dilemmaModal()}${drawer()}${app.toast ? `<div class="toast" role="status">${esc(app.toast)}</div>` : ''}`;
    window.scrollTo(0, scrollY);
    const np = document.querySelector('.picker'); if (np) np.scrollTop = pickerScroll;
    const af = document.querySelector('[autofocus]'); if (af) af.focus({ preventScroll: true });
    bindFiles();
  }
  function go(view) { if (view === 'decide') app.hideDilemma = false; app.view = view; app.menu = false; app.drawer = null; window.scrollTo(0, 0); render(); }

  /* ---------- actions ---------- */
  function startGame(id) {
    const h = app.home;
    if (h.mode === 'class') {
      if (!h.team.trim()) { toast('Enter your team name first'); document.getElementById('f-team')?.focus(); return; }
      if (!h.session.trim()) { toast('Enter the session code from your facilitator'); document.getElementById('f-session')?.focus(); return; }
    }
    const seed = h.mode === 'class' ? 'session:' + h.session.trim().toUpperCase() : undefined;
    app.game = E.newGame(id, { seed, mode: h.mode, team: h.mode === 'class' ? h.team.trim() : '', session: h.mode === 'class' ? h.session.trim().toUpperCase() : '' });
    app.selLever = null; app.selTargets = []; app.netFocus = null;
    save(); go('brief');
  }

  const actions = {
    'go-home': () => go('home'),
    view: el => go(el.dataset.view),
    menu: () => { app.menu = !app.menu; render(); },
    theme: () => {
      const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next); store.set('tp_theme', next); app.menu = false; render();
    },
    mode: el => { app.home.mode = el.dataset.mode; render(); },
    'pick-scenario': el => { app.home.scenario = el.dataset.id; render(); },
    start: () => startGame(app.home.scenario),
    resume: () => go('decide'),
    restart: () => {
      app.menu = false;
      if (!confirm('Restart this scenario? Your current progress will be lost.')) { render(); return; }
      const g = app.game;
      app.game = E.newGame(g.scenarioId, { seed: g.mode === 'class' ? 'session:' + g.session : undefined, mode: g.mode, team: g.team, session: g.session });
      app.selLever = null; app.selTargets = []; save(); go('brief');
    },
    replay: () => {
      const g = app.game;
      app.game = E.newGame(g.scenarioId, { seed: g.mode === 'class' ? 'session:' + g.session : undefined, mode: g.mode, team: g.team, session: g.session });
      app.selLever = null; app.selTargets = []; save(); go('brief');
    },
    'export-game': () => { app.menu = false; download(`tipping-point-${app.game.scenarioId}-week${app.game.week}.json`, JSON.stringify(app.game, null, 1)); render(); },
    'open-person': el => { app.drawer = el.dataset.id; render(); },
    'close-drawer': () => { app.drawer = null; render(); },
    'net-focus': el => { const id = el.dataset.id; app.netFocus = app.netFocus === id ? null : id; render(); },
    'pick-lever': el => {
      const id = el.dataset.id;
      if (app.selLever !== id) { app.selLever = id; const l = L[id]; app.selTargets = l.scope === 'org' ? [] : app.selTargets.slice(0, l.scope); }
      render();
      if (window.innerWidth < 1000) document.querySelector('.lever-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    'toggle-target': el => {
      const id = el.dataset.id, l = L[app.selLever];
      if (!l || l.scope === 'org') return;
      const i = app.selTargets.indexOf(id);
      if (i >= 0) app.selTargets.splice(i, 1);
      else if (l.scope === 1) app.selTargets = [id];
      else if (app.selTargets.length < l.scope) app.selTargets.push(id);
      else { toast(`This lever reaches at most ${l.scope} people`); return; }
      render();
    },
    'clear-targets': () => { app.selTargets = []; render(); },
    submit: () => {
      try {
        const r = E.applyLever(app.game, app.selLever, app.selTargets);
        app.game = r.state; app.news = r.decision; app.selTargets = [];
        app.flash = Object.values(r.decision.moved).flat();
        save(); render();
      } catch (e) { toast(e.message); }
    },
    wait: () => { try { const r = E.wait(app.game); app.game = r.state; app.news = r.decision; save(); render(); } catch (e) { toast(e.message); } },
    'close-news': () => {
      app.news = null;
      if (app.game.ended) { go('debrief'); return; }
      if (app.selLever && !E.availability(app.game, app.selLever).ok) app.selLever = null;
      render(); setTimeout(() => { app.flash = []; }, 1500);
    },
    choose: el => {
      const r = E.resolveDilemma(app.game, +el.dataset.i);
      app.game = r.state; app.news = r.decision; app.hideDilemma = false;
      app.flash = Object.values(r.decision.moved).flat();
      save(); render();
    },
    'hide-dilemma': () => { app.hideDilemma = true; render(); toast('Reopen the decision from the Decide page'); },
    'show-dilemma': () => { app.hideDilemma = false; render(); },
    'copy-code': () => copy(E.encodeResult(E.resultRecord(app.game))),
    'download-result': () => { const r = E.resultRecord(app.game); download(`tipping-point-result-${(r.team || 'player').replace(/\W+/g, '-')}-S${S[r.scenario].number}.json`, JSON.stringify(r, null, 1)); },
    print: () => window.print(),
    'new-session': () => { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += a[Math.floor(Math.random() * a.length)]; app.fac.newCode = c.slice(0, 3) + '-' + c.slice(3); render(); },
    'copy-session': () => copy(app.fac.newCode),
    'fac-add': () => { const ta = document.getElementById('fac-paste'); addCodes(ta.value); },
    'fac-sort': el => { app.fac.sort = el.dataset.k; render(); },
    'fac-del': el => { app.fac.records.splice(+el.dataset.i, 1); store.set('tp_fac', app.fac.records); render(); },
    'fac-clear': () => { if (confirm('Remove all results from this dashboard?')) { app.fac.records = []; store.set('tp_fac', []); render(); } },
    'fac-csv': () => {
      const head = ['team', 'session', 'scenario', 'score', 'grade', 'adopters', 'reached', 'credibility', 'weeks_used', 'max_weeks', 'end', 'levers'];
      const rows = facRecords().map(r => [r.team, r.session, 'S' + S[r.scenario].number, r.score, r.grade, r.adopters, r.reached, r.cred, r.weeks, r.maxWeeks, r.end, r.levers.map(x => `w${x[1]}:${x[0]}:${x[2]}`).join(' ')]);
      const csv = [head, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      download('tipping-point-class-results.csv', csv, 'text/csv');
    }
  };

  function addCodes(text) {
    const parts = String(text).split(/\s+/).filter(Boolean);
    let added = 0, bad = 0;
    const tryAdd = rec => {
      if (!rec || !rec.scenario || !S[rec.scenario] || !Array.isArray(rec.levers)) { bad++; return; }
      const dup = app.fac.records.some(r => r.team === rec.team && r.at === rec.at && r.score === rec.score);
      if (!dup) { app.fac.records.push(rec); added++; }
    };
    if (String(text).trim().startsWith('{')) { try { tryAdd(JSON.parse(text)); } catch (e) { bad++; } }
    else parts.forEach(p => { try { tryAdd(E.decodeResult(p)); } catch (e) { bad++; } });
    store.set('tp_fac', app.fac.records);
    render();
    toast(`${plural(added, 'result')} added${bad ? ` · ${bad} could not be read` : ''}`);
  }
  function bindFiles() {
    const inp = document.getElementById('fac-files');
    if (inp && !inp._bound) {
      inp._bound = true;
      inp.addEventListener('change', () => readFiles(inp.files));
    }
  }
  function readFiles(files) {
    [...files].forEach(f => { const r = new FileReader(); r.onload = () => addCodes(r.result); r.readAsText(f); });
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) { if (app.menu && !e.target.closest('.menu-wrap')) { app.menu = false; render(); } return; }
    const fn = actions[el.dataset.act];
    if (fn) { e.preventDefault(); if (el.dataset.act !== 'menu' && app.menu && !el.closest('.menu')) app.menu = false; fn(el); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (app.drawer) { app.drawer = null; render(); } else if (app.menu) { app.menu = false; render(); } }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g.node')) { e.preventDefault(); actions['net-focus'](e.target); }
  });
  document.addEventListener('input', e => {
    const k = e.target.dataset.input;
    if (k === 'team') app.home.team = e.target.value;
    if (k === 'session') app.home.session = e.target.value.toUpperCase();
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.input === 'fac-session') { app.fac.session = e.target.value; render(); }
  });
  document.addEventListener('dragover', e => { if (app.view === 'facilitator') { e.preventDefault(); } });
  document.addEventListener('drop', e => { if (app.view === 'facilitator' && e.dataTransfer.files.length) { e.preventDefault(); readFiles(e.dataTransfer.files); } });

  if (saved && !saved.ended) app.game = saved;
  render();
})();
