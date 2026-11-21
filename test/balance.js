/* Balance tests: a greedy "expert" bot, a naive bot and a random bot play every scenario. */
const E = require('../src/engine.js');
const D = require('../src/data.js');

function value(s) {
  let v = 0;
  for (const p of Object.values(s.people)) v += p.stage * 100 + Math.min(p.prog, 99);
  return v + E.adopters(s) * 80 + s.cred * 30;
}

function pickTargets(s, L) {
  if (L.scope === 'org') return [];
  const ids = Object.keys(s.people);
  const P = E.PERSON;
  let pool;
  if (L.confront) pool = ids.filter(id => s.people[id].resisting && s.people[id].interviewed && s.people[id].stage >= 1);
  else if (L.spotlight) pool = ids.filter(id => s.people[id].stage === 4);
  else if (L.id === 'listen') pool = ids.filter(id => !s.people[id].interviewed);
  else pool = ids.filter(id => L.stages.includes(s.people[id].stage));
  pool.sort((a, b) => (P[b].influence * 50 + s.people[b].prog + P[b].openness * 40) - (P[a].influence * 50 + s.people[a].prog + P[a].openness * 40));
  return pool.slice(0, L.scope);
}

function greedy(s) {
  let best = null;
  for (const L of D.LEVERS) {
    if (!E.availability(s, L.id).ok) continue;
    const t = pickTargets(s, L);
    if (L.scope !== 'org' && t.length === 0) continue;
    const r = E.applyLever(s, L.id, t);
    const gain = (value(r.state) - value(s)) / L.weeks;
    if (!best || gain > best.gain) best = { L, t, gain };
  }
  return best;
}

function play(scId, seed, policy) {
  let s = E.newGame(scId, { seed });
  let guard = 0;
  while (!s.ended && guard++ < 300) {
    if (s.pending) {
      const n = D.DILEMMAS[s.pending].options.length;
      let pick;
      if (policy === greedy || (policy.smart && Math.random() < policy.smart)) {
        pick = [...Array(n).keys()].map(i => [i, value(E.resolveDilemma(s, i).state) - E.resolveDilemma(s, i).state.week * 8]).sort((a, b) => b[1] - a[1])[0][0];
      } else pick = Math.floor(Math.random() * n);
      s = E.resolveDilemma(s, pick).state; continue;
    }
    let choice = policy(s);
    if (!choice) { s = E.wait(s).state; continue; }
    s = E.applyLever(s, choice.L.id, choice.t).state;
  }
  return s;
}

const naiveOrder = ['memo', 'townhall', 'goals', 'expert', 'values', 'incentives', 'restructure', 'example'];
function naive(s) { // only org-wide levers, in a fixed order — a typical "broadcast" leader
  for (const id of naiveOrder) if (E.availability(s, id).ok) return { L: E.LEVER[id], t: [] };
  return null;
}
function random(s) {
  const opts = D.LEVERS.filter(L => E.availability(s, L.id).ok);
  if (!opts.length) return null;
  const L = opts[Math.floor(Math.random() * opts.length)];
  const ids = Object.keys(s.people).sort(() => Math.random() - 0.5);
  return { L, t: L.scope === 'org' ? [] : ids.slice(0, L.scope) };
}

function summary(label, runs) {
  const sc = runs.map(s => E.score(s));
  const avg = k => (sc.reduce((a, b) => a + (typeof b[k] === 'boolean' ? +b[k] : b[k]), 0) / sc.length).toFixed(1);
  const cred = (runs.reduce((a, s) => a + s.cred, 0) / runs.length).toFixed(1);
  const wk = (runs.reduce((a, s) => a + s.week, 0) / runs.length).toFixed(0);
  console.log(`${label.padEnd(10)} score ${avg('total').padStart(5)}  adopters ${avg('adopters').padStart(4)}  CM-rate ${avg('reached')}  cred ${cred}  weeks ${wk}`);
}

for (const sc of D.SCENARIOS) {
  console.log(`\n== ${sc.id} ${sc.title} (${sc.quadrant}, ${sc.weeks} wks, cred ${sc.startCred})`);
  summary('greedy', [1, 2, 3, 4, 5, 6].map(i => play(sc.id, 'g' + i, greedy)));
  summary('naive', [1, 2, 3].map(i => play(sc.id, 'n' + i, naive)));
  summary('random', Array.from({ length: 40 }, (_, i) => play(sc.id, 'r' + i, random)));
}

if (process.argv[2] === 'trace') {
  const s = play(process.argv[3] || 's4', 'g1', greedy);
  s.history.forEach(h => console.log(`w${String(h.weekStart).padStart(2)} ${h.lever.padEnd(11)} ${h.outcome.padEnd(8)} cred ${h.credAfter} ${JSON.stringify(h.targets)} moved ${Object.entries(h.moved).map(([k, v]) => k + ':' + v.length).join(' ')}`));
  console.log(E.score(s), s.endReason);
}

// mid-skill player: greedy 60% of the time, otherwise a "reasonable" random move (right stages, any lever)
function sensibleRandom(s) {
  const opts = D.LEVERS.filter(L => E.availability(s, L.id).ok).map(L => ({ L, t: pickTargets(s, L) })).filter(o => o.L.scope === 'org' || o.t.length);
  return opts.length ? opts[Math.floor(Math.random() * opts.length)] : null;
}
for (const p of [0.8, 0.6, 0.4]) {
  const mixed = s => (Math.random() < p ? greedy(s) : sensibleRandom(s)); mixed.smart = p;
  for (const sc of D.SCENARIOS) summary(`${sc.id} mid${p}`, Array.from({ length: 30 }, (_, i) => play(sc.id, 'm' + i, mixed)));
}
