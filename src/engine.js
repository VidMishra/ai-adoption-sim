/* Tipping Point — simulation engine. Pure functions over a serialisable state. */
(function (root) {
  'use strict';
  const D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.TP_DATA;
  const { STAGES, PEOPLE, FRIENDSHIPS, LEVERS, SCENARIOS, PHASES, CRITICAL_MASS, MAX_CRED, DILEMMAS, LEVELS } = D;
  const clamp = c => Math.max(0, Math.min(MAX_CRED, c));

  const LEVER = Object.fromEntries(LEVERS.map(l => [l.id, l]));
  const PERSON = Object.fromEntries(PEOPLE.map(p => [p.id, p]));
  const SCENARIO = Object.fromEntries(SCENARIOS.map(s => [s.id, s]));

  /* ---------- relationships ---------- */
  const FRIENDS = Object.fromEntries(PEOPLE.map(p => [p.id, new Set()]));
  FRIENDSHIPS.forEach(([a, b]) => { FRIENDS[a].add(b); FRIENDS[b].add(a); });
  const COWORKERS = Object.fromEntries(PEOPLE.map(p => [p.id, new Set()]));
  PEOPLE.forEach(p => {
    PEOPLE.forEach(q => {
      if (p.id === q.id) return;
      const sameBoss = p.manager !== null && p.manager === q.manager;
      const boss = p.manager === q.id || q.manager === p.id;
      const topTeam = p.manager === null && q.manager === null;
      if (sameBoss || boss || topTeam) COWORKERS[p.id].add(q.id);
    });
  });
  const friendsOf = id => [...FRIENDS[id]];
  const coworkersOf = id => [...COWORKERS[id]];
  /* Progress needed to leave each stage: later stages are harder. */
  const THRESHOLD = [50, 110, 150, 195];
  const isSenior = p => p.level === 'exec' || p.level === 'staff';

  /* ---------- seeded RNG (mulberry32, state kept in game state) ---------- */
  function rand(state) {
    state.rng = (state.rng + 0x6D2B79F5) >>> 0;
    let t = state.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }

  /* ---------- state ---------- */
  function newGame(scenarioId, opts = {}) {
    const sc = SCENARIO[scenarioId];
    if (!sc) throw new Error('Unknown scenario ' + scenarioId);
    const seedText = opts.seed != null ? String(opts.seed) : String(Date.now()) + Math.random();
    const state = {
      version: 1,
      scenarioId,
      seed: seedText,
      rng: hashSeed(seedText + '|' + scenarioId),
      mode: opts.mode || 'single',
      team: opts.team || '',
      session: opts.session || '',
      week: 0,
      maxWeeks: sc.weeks,
      cred: sc.startCred,
      phase: 0,
      communicated: false,
      pledged: false,
      ended: false,
      endReason: null,
      people: Object.fromEntries(PEOPLE.map(p => [p.id, {
        stage: 0, prog: 0, resisting: p.resister, fearful: p.fear,
        interviewed: false
      }])),
      lastUsed: {},      // leverId -> week the lever became reusable from (end week)
      attempts: {},      // leverId -> count
      history: [],       // decisions
      timeline: [],
      events: { escalation: false },
      pending: null,     // id of a critical decision awaiting the player's choice
      dilemmaIdx: 0,     // index of the next scenario dilemma
      scheduled: [],     // delayed consequences
      choices: []        // [dilemmaId, optionIndex, tone]
    };
    /* Realistic starting point: scenario overrides on top of the base distribution, with some progress
       already built up inside each stage so people do not all sit at exactly the same point. */
    const start = Object.assign({}, D.BASE_START || {}, sc.start || {});
    Object.entries(start).forEach(([id, st]) => {
      const p = state.people[id];
      if (!p) return;
      p.stage = st;
      p.prog = st < 4 ? Math.round(rand(state) * THRESHOLD[st] * 0.4) : 0;
    });
    state.timeline = [countsOf(state, 0)];
    return state;
  }
  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  function countsOf(state, week) {
    const c = [0, 0, 0, 0, 0];
    Object.values(state.people).forEach(p => c[p.stage]++);
    return { week: week != null ? week : state.week, counts: c, cred: state.cred, phase: state.phase };
  }
  const adopters = state => Object.values(state.people).filter(p => p.stage === 4).length;
  const atLeast = (state, st) => Object.values(state.people).filter(p => p.stage >= st).length;
  const seniorSponsors = state => PEOPLE.filter(p => isSenior(p) && state.people[p.id].stage >= 3).length;

  /* Senior sponsors you need before pulling a command lever above your authority level. */
  function sponsorsNeeded(state, leverId) {
    const L = LEVER[leverId], sc = SCENARIO[state.scenarioId];
    if (!L.command) return 0;
    const need = L.authority || 3;
    return sc.authority >= need ? 0 : Math.min(3, (need - sc.authority) * 2);
  }
  function resolveWho(state, who) {
    const sc = SCENARIO[state.scenarioId];
    if (who === 'boss') return sc.reportsTo ? [sc.reportsTo] : [];
    if (who === 'all') return PEOPLE.map(p => p.id);
    if (who.startsWith('dept:')) return PEOPLE.filter(p => p.dept === who.slice(5)).map(p => p.id);
    if (who.startsWith('level:')) {
      const lv = who.slice(6);
      return PEOPLE.filter(p => p.level === lv || (lv === 'exec' && p.level === 'staff')).map(p => p.id);
    }
    return PERSON[who] ? [who] : [];
  }
  /* Add progress (may be negative); a person moves at most one stage per call. */
  function advance(state, gains, moved) {
    Object.entries(gains).forEach(([id, amt]) => {
      const s = state.people[id];
      if (s.stage >= 4) return;
      s.prog = Math.max(0, s.prog + amt);
      const need = THRESHOLD[s.stage];
      if (s.prog >= need) {
        s.prog = Math.min(s.prog - need, 20);
        s.stage += 1;
        (moved[s.stage] = moved[s.stage] || []).push(id);
      }
      if (s.stage >= 4) s.prog = 0;
    });
  }
  function fillText(state, text) {
    const sc = SCENARIO[state.scenarioId];
    const boss = sc.reportsTo ? PERSON[sc.reportsTo] : null;
    return String(text).replace(/\{boss\}/g, boss ? boss.name : 'your boss').replace(/\{bossFirst\}/g, boss ? boss.name.split(' ')[0] : 'Your boss');
  }
  /* Shared end-of-turn processing: delayed consequences, events, phase, end, next dilemma. */
  function finalize(state, decision) {
    const sc = SCENARIO[state.scenarioId];
    const due = state.scheduled.filter(x => x.week <= state.week);
    state.scheduled = state.scheduled.filter(x => x.week > state.week);
    due.forEach(x => {
      if (x.cred) state.cred = clamp(state.cred + x.cred);
      if (x.gain) {
        const g = {};
        x.gain.forEach(([who, amt]) => resolveWho(state, who).forEach(id => { g[id] = (g[id] || 0) + amt; }));
        advance(state, g, decision.moved);
      }
      decision.events.push(x.note);
    });
    if (sc.urgency === 'high' && !state.events.escalation && state.week >= 26) {
      state.events.escalation = true;
      if (atLeast(state, 3) < 5) {
        state.cred = clamp(state.cred - 1);
        decision.events.push('Week 26 check-in: Nimbus Retail sees little real progress and escalates to the board. Your credibility takes a hit.');
      } else {
        decision.events.push('Week 26 check-in: Nimbus Retail sees people genuinely trying the tools and agrees to keep its volumes in place for now.');
      }
    }
    decision.credAfter = state.cred;
    decision.credDelta = state.cred - decision.credBefore;
    if (state.phase === 0 && atLeast(state, 1) >= 18 && atLeast(state, 2) >= 10) state.phase = 1;
    if (state.phase === 1 && (adopters(state) >= 7 || atLeast(state, 3) >= 14)) state.phase = 2;
    if (adopters(state) >= CRITICAL_MASS) { state.ended = true; state.endReason = 'critical-mass'; }
    else if (state.cred <= 0) { state.ended = true; state.endReason = 'credibility'; }
    else if (state.week >= state.maxWeeks) { state.ended = true; state.endReason = 'time'; }
    if (!state.ended && !state.pending) {
      const next = sc.dilemmas[state.dilemmaIdx];
      if (next && state.week >= next[1]) { state.pending = next[0]; state.dilemmaIdx += 1; decision.dilemma = next[0]; }
    }
    state.history.push(decision);
    state.timeline.push(countsOf(state));
  }

  /* ---------- availability ---------- */
  function availability(state, leverId) {
    const L = LEVER[leverId];
    const sc = SCENARIO[state.scenarioId];
    if (state.ended) return { ok: false, reason: 'The simulation has ended.' };
    if (state.pending) return { ok: false, reason: 'Resolve the critical decision first.' };
    const readyAt = state.lastUsed[leverId];
    if (readyAt != null && state.week < readyAt) {
      return { ok: false, reason: `Available again in week ${readyAt} (${readyAt - state.week} more week${readyAt - state.week === 1 ? '' : 's'}).`, cooldown: readyAt - state.week };
    }
    if (state.week + L.weeks > state.maxWeeks) return { ok: false, reason: 'Not enough weeks left to implement this lever.' };
    if (L.pledge && state.pledged) return { ok: false, reason: 'You have already made this commitment.' };
    return { ok: true, sponsorsNeeded: sponsorsNeeded(state, leverId) };
  }

  /* ---------- core: apply a lever ---------- */
  function applyLever(prev, leverId, targetIds = []) {
    const L = LEVER[leverId];
    if (!L) throw new Error('Unknown lever ' + leverId);
    const av = availability(prev, leverId);
    if (!av.ok) throw new Error(av.reason);
    const sc = SCENARIO[prev.scenarioId];
    const state = clone(prev);
    const before = Object.fromEntries(Object.entries(state.people).map(([k, v]) => [k, v.stage]));
    const credBefore = state.cred;
    const phaseBefore = state.phase;

    let direct = L.scope === 'org' ? PEOPLE.map(p => p.id) : [...new Set(targetIds)];
    if (L.scope !== 'org' && (direct.length < 1 || direct.length > L.scope)) {
      throw new Error(`Select between 1 and ${L.scope} ${L.scope === 1 ? 'person' : 'people'}.`);
    }
    const fullSelection = L.scope === 'org' || direct.length === L.scope;

    state.week += L.weeks;
    state.lastUsed[leverId] = state.week + L.reuse;
    state.attempts[leverId] = (state.attempts[leverId] || 0) + 1;

    let credDelta = 0;
    let mult = 1;
    let outcome = 'success';           // success | partial | mistimed | blocked
    let noEffect = false;
    const notes = [];
    const credFactor = 0.55 + 0.045 * state.cred;

    /* --- authority (command levers) --- */
    if (L.command) {
      const needS = sponsorsNeeded(state, leverId);
      if (needS > 0) {
        if (seniorSponsors(state) < needS) {
          outcome = 'blocked';
          notes.push(`This lever needs ${LEVELS[L.authority]}-level authority. As a ${LEVELS[sc.authority]}, you needed ${needS} senior sponsors (executives or CEO staff) at the trial stage or beyond, and you had ${seniorSponsors(state)}. People saw it as overreach.`);
          credDelta -= 2;
        } else {
          mult *= 0.85;
          notes.push('Your senior sponsors lent you the authority to pull this lever.');
        }
      }
      if (outcome !== 'blocked' && sc.urgency === 'low' && state.phase === 0 && !L.pledge) {
        mult *= 0.6; credDelta -= 1;
        notes.push('With no visible crisis, pressure this early felt arbitrary. It worked less well and cost you credibility.');
      }
      if (outcome !== 'blocked' && sc.urgency === 'high' && leverId === 'goals' && state.phase <= 1) {
        mult *= 1.2;
        notes.push('The Nimbus deadline made hard targets feel necessary, not arbitrary.');
      }
    }
    if (sc.urgency === 'low' && L.kind === 'enabling') mult *= 1.1;
    /* Your boss's stance colours everything you do. */
    if (sc.reportsTo) {
      const b = state.people[sc.reportsTo];
      if (b.resisting && !PERSON[sc.reportsTo].resister) mult *= 0.85;
      else if (b.stage >= 3) mult *= 1.1;
    }
    /* Repetition wears off: each repeat of the same lever is less novel. */
    const repeats = state.attempts[leverId] - 1;
    if (repeats > 0) mult *= Math.pow(L.scope === 'org' ? 0.7 : 0.85, repeats);

    /* --- timing / prerequisites --- */
    if (outcome !== 'blocked') {
      if (L.needsComms && !state.communicated) {
        outcome = 'mistimed'; credDelta -= 1;
        notes.push('Nobody yet knows what change you are modelling. Communicate the change first.'); noEffect = true;
      } else if (L.needsAdopter && adopters(state) < 1) {
        outcome = 'mistimed'; credDelta -= 1;
        notes.push('There is no real adopter yet, so there is no true story to tell. It came across as spin.'); noEffect = true;
      } else if (L.needsAdopters && adopters(state) < L.needsAdopters) {
        outcome = 'mistimed'; credDelta -= 1;
        notes.push(`There is not enough progress to show yet (you need at least ${L.needsAdopters} adopters). The dashboard looked empty.`); noEffect = true;
      } else if (L.needsPhase != null && state.phase < L.needsPhase) {
        outcome = 'mistimed'; credDelta -= 2; mult *= 0.2;
        notes.push(`This lever is only effective in the ${PHASES[L.needsPhase]} phase. Pulled now, it looked like coercion before people were ready.`);
      } else if (L.needsCred != null && state.cred < L.needsCred) {
        outcome = 'mistimed'; credDelta -= 2; mult *= 0.3;
        notes.push(`You need credibility of at least ${L.needsCred} to pull this lever well.`);
      }
    }

    const gains = {}; // id -> {direct:bool, amount}
    const addGain = (id, amt, isDirect) => {
      if (amt <= 0) return;
      if (!gains[id]) gains[id] = { direct: false, amount: 0 };
      gains[id].amount += amt;
      gains[id].direct = gains[id].direct || isDirect;
    };
    const receptivity = (id, L) => {
      const p = PERSON[id], s = state.people[id];
      let r = p.openness;
      /* Broadcasts can create awareness and interest, but rarely adoption. */
      if (L.scope === 'org' && s.stage === 3 && !L.command && L.id !== 'values') r *= 0.5;
      if (s.resisting) r *= (L.id === 'listen' ? 0.7 : 0.35);
      if (s.fearful && (L.fearSensitive || L.id === 'pilot' || L.id === 'goals')) r *= 0.45;
      return r;
    };
    const jitter = () => 0.85 + rand(state) * 0.3;
    const inStages = (id, stages) => stages.includes(state.people[id].stage);

    let revealed = [];
    if (outcome !== 'blocked' && !noEffect) {
      /* --- special levers --- */
      if (L.id === 'listen') {
        direct.forEach(id => {
          if (!state.people[id].interviewed) { state.people[id].interviewed = true; revealed.push(id); }
        });
      }
      if (L.id === 'memo' || L.id === 'townhall') state.communicated = true;
      if (L.pledge) {
        state.pledged = true;
        Object.keys(state.people).forEach(id => {
          if (state.people[id].fearful) {
            state.people[id].fearful = false;
            if (inStages(id, L.stages)) addGain(id, L.strength * PERSON[id].openness * credFactor * mult * jitter(), true);
          }
        });
        notes.push('People who were held back by fear of losing their jobs can now engage with the change on its merits.');
      }

      if (L.confront) {
        const id = direct[0];
        const s = state.people[id];
        if (!s.resisting) {
          outcome = 'mistimed'; credDelta -= 1;
          notes.push(`${PERSON[id].name} was not actually resisting. Confronting them felt unfair and damaged trust.`);
        } else if (s.stage < 1) {
          outcome = 'mistimed'; credDelta -= 1;
          notes.push(`${PERSON[id].name} does not even know about the change yet. There is nothing to confront.`);
        } else {
          s.resisting = false;
          const powerMult = sc.authority <= 1 ? 0.7 : sc.authority === 2 ? 0.85 : 1;
          addGain(id, L.strength * PERSON[id].openness * credFactor * powerMult * jitter(), true);
          friendsOf(id).forEach(f => { if (inStages(f, L.stages)) addGain(f, L.strength * L.spillF * receptivity(f, L) * credFactor * jitter(), false); });
          notes.push(`${PERSON[id].name} heard you out. Their active resistance has ended.`);
        }
      } else if (L.spotlight) {
        const id = direct[0];
        if (state.people[id].stage !== 4) {
          outcome = 'mistimed'; credDelta -= 1;
          notes.push(`${PERSON[id].name} has not adopted yet. Recognising them now looked like favouritism.`);
        } else {
          const circle = new Set([...friendsOf(id), ...coworkersOf(id)]);
          circle.forEach(f => { if (inStages(f, L.stages)) addGain(f, L.strength * receptivity(f, L) * credFactor * mult * jitter(), false); });
        }
      } else if (!L.pledge) {
        /* --- standard levers --- */
        let anyApplicable = false;
        direct.forEach(id => {
          if (!inStages(id, L.stages)) return;
          anyApplicable = true;
          addGain(id, L.strength * receptivity(id, L) * credFactor * mult * jitter(), true);
        });
        if (L.spill && L.scope !== 'org') {
          direct.forEach(id => {
            if (!inStages(id, L.stages) && L.id !== 'listen') return;
            const pool = L.spill === 'friends' ? friendsOf(id) : L.spill === 'coworkers' ? coworkersOf(id) : [...new Set([...friendsOf(id), ...coworkersOf(id)])];
            const infl = 0.75 + 0.25 * PERSON[id].influence;
            pool.forEach(f => {
              if (direct.includes(f) || !inStages(f, L.stages)) return;
              addGain(f, L.strength * L.spillF * infl * receptivity(f, L) * credFactor * mult * jitter(), false);
            });
          });
        }
        if (!anyApplicable && outcome !== 'blocked') {
          if (outcome === 'success') credDelta -= 1;
          outcome = 'mistimed';
          const st = L.stages.map(i => STAGES[i].toLowerCase());
          notes.push(`This lever only works on people in the ${st.length > 1 ? st.slice(0, -1).join(', ') + ' or ' + st.slice(-1) : st[0]} stage${st.length > 1 ? 's' : ''}. None of the people it reached were there.`);
        } else if (outcome === 'success' && L.scope !== 'org') {
          const wasted = direct.filter(id => !inStages(id, L.stages));
          if (wasted.length) {
            outcome = 'partial';
            notes.push(`${wasted.map(id => PERSON[id].name.split(' ')[0]).join(', ')} ${wasted.length > 1 ? 'were' : 'was'} not at a stage this lever can move.`);
          }
        }
      }
    }

    /* --- apply progress (max one stage per lever per person) --- */
    const moved = {};
    advance(state, Object.fromEntries(Object.entries(gains).map(([k, g]) => [k, g.amount])), moved);

    /* --- credibility --- */
    if (outcome === 'success' || outcome === 'partial') {
      if (L.id === 'example') credDelta += 1;
      if (L.credGain) credDelta += L.credGain;
    }
    if (!fullSelection && L.scope !== 'org' && outcome !== 'blocked') notes.push(`You selected fewer people than this lever allows (${direct.length} of ${L.scope}).`);
    state.cred = clamp(state.cred + credDelta);

    const decision = {
      n: state.history.length + 1,
      lever: leverId,
      targets: L.scope === 'org' ? 'org' : direct,
      weekStart: prev.week,
      weekEnd: state.week,
      phaseAtStart: phaseBefore,
      outcome,
      credBefore,
      credAfter: state.cred,
      credDelta: 0,
      moved,
      directImpacted: Object.values(gains).filter(g => g.direct).length,
      indirectImpacted: Object.values(gains).filter(g => !g.direct).length,
      revealed,
      notes,
      events: []
    };
    finalize(state, decision);
    return { state, decision };
  }

  /* Pause for one week (keeps the player from ever being stuck behind cooldowns). */
  function wait(prev) {
    if (prev.ended) throw new Error('The simulation has ended.');
    if (prev.pending) throw new Error('Resolve the critical decision first.');
    const state = clone(prev);
    state.week += 1;
    const decision = { n: state.history.length + 1, lever: 'wait', targets: [], weekStart: prev.week, weekEnd: state.week,
      phaseAtStart: prev.phase, outcome: 'wait', credBefore: prev.cred, credAfter: prev.cred, credDelta: 0, moved: {},
      directImpacted: 0, indirectImpacted: 0, revealed: [], notes: ['You let a week pass to observe.'], events: [] };
    finalize(state, decision);
    return { state, decision };
  }

  /* Resolve the pending critical decision with option `idx`. */
  function resolveDilemma(prev, idx) {
    if (!prev.pending) throw new Error('No critical decision is pending.');
    const id = prev.pending, dl = DILEMMAS[id], opt = dl.options[idx];
    if (!opt) throw new Error('Unknown option.');
    const sc = SCENARIO[prev.scenarioId];
    const state = clone(prev);
    state.pending = null;
    const decision = { n: state.history.length + 1, lever: 'dilemma', dilemma: id, option: idx, tone: opt.tone, targets: [],
      weekStart: prev.week, weekEnd: prev.week, phaseAtStart: prev.phase, outcome: 'dilemma', credBefore: prev.cred, credAfter: prev.cred,
      credDelta: 0, moved: {}, directImpacted: 0, indirectImpacted: 0, revealed: [], notes: [], events: [],
      result: fillText(state, opt.result), lesson: opt.lesson };
    const ids = list => (list || []).flatMap(w => resolveWho(state, w));
    const apply = eff => {
      if (eff.cred) state.cred = clamp(state.cred + eff.cred);
      if (eff.weeks) state.week = Math.min(state.maxWeeks, state.week + eff.weeks);
      ids(eff.unresist).forEach(p => { state.people[p].resisting = false; });
      ids(eff.resist).forEach(p => { state.people[p].resisting = true; });
      ids(eff.fear).forEach(p => { state.people[p].fearful = true; });
      ids(eff.unfear).forEach(p => { state.people[p].fearful = false; });
      ids(eff.setback).forEach(p => { const s = state.people[p]; s.stage = Math.max(1, s.stage - 1); s.prog = 0; });
      (eff.lock || []).forEach(([lv, w]) => { state.lastUsed[lv] = Math.max(state.lastUsed[lv] || 0, state.week + w); });
      if (eff.gain) {
        const g = {};
        eff.gain.forEach(([who, amt]) => resolveWho(state, who).forEach(p => { g[p] = (g[p] || 0) + amt; }));
        decision.directImpacted += Object.keys(g).length;
        advance(state, g, decision.moved);
      }
      if (eff.later) state.scheduled.push({ week: state.week + eff.later.after, cred: eff.later.cred || 0, gain: eff.later.gain || null, note: eff.later.note });
    };
    apply(opt.effects);
    const low = opt.effects.lowAuthority;
    if (low && sc.authority < low.below) { apply(low); decision.notes.push(low.note); }
    decision.weekEnd = state.week;
    state.choices.push([id, idx, opt.tone]);
    finalize(state, decision);
    return { state, decision };
  }

  /* Idle: used if a player wants to end early. */
  function endGame(prev) {
    const state = clone(prev);
    state.ended = true;
    state.endReason = state.endReason || 'ended';
    return state;
  }

  /* ---------- scoring ---------- */
  function score(state) {
    const sc = SCENARIO[state.scenarioId];
    const a = adopters(state);
    const reached = a >= CRITICAL_MASS;
    const adoption = Math.round((a / PEOPLE.length) * 55);
    const progress = Math.round((Object.values(state.people).reduce((s, p) => s + p.stage, 0) / (PEOPLE.length * 4)) * 10);
    const cred = Math.round((state.cred / MAX_CRED) * 15);
    const speed = reached ? Math.round(((state.maxWeeks - state.week) / state.maxWeeks) * 20) : 0;
    const total = Math.min(100, adoption + progress + cred + speed);
    const grade = total >= 85 ? 'A' : total >= 72 ? 'B' : total >= 58 ? 'C' : total >= 45 ? 'D' : 'E';
    return { total, grade, adoption, progress, cred, speed, adopters: a, reached, weeksUsed: state.week, maxWeeks: sc.weeks };
  }

  /* ---------- debrief insights ---------- */
  function insights(state) {
    const sc = SCENARIO[state.scenarioId];
    const H = state.history.filter(h => h.lever !== 'wait' && h.lever !== 'dilemma');
    const out = [];
    const used = id => H.some(h => h.lever === id);
    const firstIdx = id => H.findIndex(h => h.lever === id);
    const mistimed = H.filter(h => h.outcome === 'mistimed' || h.outcome === 'blocked');
    const credLost = H.reduce((s, h) => s + Math.min(0, h.credDelta), 0);

    const interviews = H.filter(h => h.lever === 'listen').length;
    if (interviews === 0) out.push({ tone: 'warn', title: 'You never listened first', text: 'Listening sessions are cheap and reveal who resists and who is connected to whom. Without them you were steering blind.' });
    else if (firstIdx('listen') <= 1) out.push({ tone: 'good', title: 'You diagnosed before acting', text: 'Starting with listening sessions gave you the map of resisters and friendships that every later move depended on.' });

    const commIdx = Math.min(...['memo', 'townhall'].map(firstIdx).filter(i => i >= 0), Infinity);
    if (commIdx === Infinity) out.push({ tone: 'warn', title: 'The change was never formally communicated', text: 'Without a memo or town hall, many people never moved past awareness.' });

    if (mistimed.length) {
      const worst = mistimed.reduce((a, b) => (a.credDelta <= b.credDelta ? a : b));
      out.push({ tone: 'warn', title: `${mistimed.length} lever pull${mistimed.length > 1 ? 's were' : ' was'} mistimed`, text: `The costliest was "${LEVER[worst.lever].name}" in week ${worst.weekStart} (${worst.credDelta} credibility). ${worst.notes[0] || ''}` });
    } else out.push({ tone: 'good', title: 'Every lever was well timed', text: 'You matched each lever to the stage people were actually in.' });

    const heavy = H.filter(h => LEVER[h.lever].kind === 'substantive');
    if (sc.urgency === 'high' && sc.authority >= 3) {
      const early = heavy.some(h => h.weekStart <= 20);
      out.push(early
        ? { tone: 'good', title: 'You used your authority early', text: 'With real authority and high urgency, substantive levers pulled early, alongside enabling ones, buy speed.' }
        : { tone: 'warn', title: 'You held back your authority', text: 'With real authority and high urgency, substantive levers such as goals and deadlines work best early, in parallel with enabling levers.' });
    }
    if (sc.authority < 4) {
      const blocked = H.filter(h => h.outcome === 'blocked').length;
      if (blocked) out.push({ tone: 'warn', title: 'You reached above your authority', text: `${blocked} lever pull${blocked > 1 ? 's were' : ' was'} blocked. As a ${LEVELS[sc.authority]}, the heavier levers need senior sponsors at the trial stage or beyond before you pull them.` });
      else if (H.some(h => LEVER[h.lever].command)) out.push({ tone: 'good', title: 'You borrowed authority wisely', text: 'You built senior sponsors before reaching for levers above your level.' });
    }
    if (sc.reportsTo) {
      const b = state.people[sc.reportsTo];
      out.push(b.stage >= 3 && !b.resisting
        ? { tone: 'good', title: 'You kept your sponsor with you', text: `${PERSON[sc.reportsTo].name} ended at ${STAGES[b.stage].toLowerCase()}. Bringing your boss along made every lever stronger.` }
        : { tone: 'warn', title: 'Your boss never fully backed you', text: `${PERSON[sc.reportsTo].name} ended at ${STAGES[b.stage].toLowerCase()}${b.resisting ? ' and was resisting' : ''}. At your level, your boss's sponsorship amplifies everything you do.` });
    }
    const ch = state.choices || [];
    if (ch.length) {
      const good = ch.filter(c => c[2] === 'good').length, poor = ch.filter(c => c[2] === 'poor');
      out.push(poor.length
        ? { tone: 'warn', title: `Critical decisions: ${good} of ${ch.length} well judged`, text: `Your hardest call was "${DILEMMAS[poor[0][0]].title}". ${DILEMMAS[poor[0][0]].options[poor[0][1]].lesson}` }
        : { tone: 'good', title: `Critical decisions: ${good} of ${ch.length} well judged`, text: 'Under pressure, you chose options that protected both the change and the people.' });
    }
    if (sc.urgency === 'low' && heavy.some(h => h.phaseAtStart === 0 && LEVER[h.lever].command && !LEVER[h.lever].pledge)) {
      out.push({ tone: 'warn', title: 'Pressure without a reason', text: 'With no crisis, mandates during mobilisation felt arbitrary. In low-urgency settings, let enabling levers do the early work.' });
    }

    const fearPeople = PEOPLE.filter(p => p.fear);
    if (used('pledge')) out.push({ tone: 'good', title: 'You lowered the cost of change', text: 'The reskilling guarantee addressed fear of loss directly instead of just raising the pressure.' });
    else if (fearPeople.some(p => state.people[p.id].stage < 4)) out.push({ tone: 'warn', title: 'Fear of loss was never addressed', text: `${fearPeople.filter(p => state.people[p.id].stage < 4).map(p => p.name.split(' ')[0]).join(', ')} stayed stuck. Training and pilots work poorly on people who fear for their jobs.` });

    const resisters = PEOPLE.filter(p => p.resister);
    const stillResisting = resisters.filter(p => state.people[p.id].resisting);
    if (stillResisting.length) out.push({ tone: 'warn', title: 'Some resisters were never engaged', text: `${stillResisting.map(p => p.name).join(', ')} kept resisting to the end. A candid one-to-one, once they are aware, can turn a resister and their friends.` });
    else out.push({ tone: 'good', title: 'You turned every resister', text: 'Each active resister was engaged directly, and their friends followed.' });

    if (used('pilot') || used('champions')) {
      if ((firstIdx('pilot') >= 0 && firstIdx('pilot') < H.length / 2) || (firstIdx('champions') >= 0 && firstIdx('champions') < H.length / 2))
        out.push({ tone: 'good', title: 'You crossed the chasm', text: 'Pilots and champions moved people from interest into trial — the pivotal, behaviour-changing stage.' });
    } else out.push({ tone: 'warn', title: 'No pilots or champions', text: 'Without learning-by-doing, interest rarely turns into trial.' });

    if (credLost <= -3) out.push({ tone: 'warn', title: 'Credibility was your scarcest resource', text: `You spent ${-credLost} points of credibility on moves that did not land. Each point lost made every later lever weaker.` });
    return out;
  }

  /* ---------- results code for class mode ---------- */
  function resultRecord(state) {
    const s = score(state);
    return {
      v: 1,
      team: state.team || 'Player',
      session: state.session || '',
      scenario: state.scenarioId,
      score: s.total,
      grade: s.grade,
      adopters: s.adopters,
      reached: s.reached,
      cred: state.cred,
      weeks: state.week,
      maxWeeks: state.maxWeeks,
      end: state.endReason,
      dilemmas: state.choices,
      levers: state.history.filter(h => h.lever !== 'wait' && h.lever !== 'dilemma').map(h => [h.lever, h.weekStart, h.outcome[0], h.credDelta]),
      curve: state.timeline.map(t => [t.week, t.counts[4], t.counts[3]]),
      at: new Date().toISOString()
    };
  }
  function encodeResult(rec) {
    const json = JSON.stringify(rec);
    const b64 = typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
    return 'TP1.' + b64;
  }
  function decodeResult(code) {
    const c = String(code).trim();
    if (c.startsWith('{')) return JSON.parse(c);
    if (!c.startsWith('TP1.')) throw new Error('Not a Tipping Point result code');
    const b64 = c.slice(4);
    const json = typeof atob !== 'undefined' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  }

  const ENGINE = {
    newGame, applyLever, wait, resolveDilemma, fillText, sponsorsNeeded, availability, endGame, score, insights, resultRecord, encodeResult, decodeResult,
    adopters, atLeast, seniorSponsors, friendsOf, coworkersOf, LEVER, PERSON, SCENARIO, hashSeed
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE;
  else root.TP_ENGINE = ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
