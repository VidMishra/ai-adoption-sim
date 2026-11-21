/* Tipping Point — scenario, people and lever data. Pure data, no DOM. */
(function (root) {
  'use strict';

  const STAGES = ['Unaware', 'Aware', 'Interest', 'Trial', 'Adoption'];

  const COMPANY = {
    name: 'Saffron Route Logistics',
    short: 'Saffron Route',
    blurb:
      'Saffron Route Logistics Pvt. Ltd. is a 28-year-old, family-promoted freight and last-mile company with about 1,400 employees and 22 hubs across India. Two years of fuel-price shocks squeezed margins hard; the company has only just returned to steady profit and its lenders are watching the debt covenants closely.',
    program: [
      'AI route and load optimisation across all 22 hubs',
      'An AI dispatch copilot for planners and dispatchers',
      'An AI customer-support agent for shipment queries',
      'Predictive maintenance for the 900-truck fleet'
    ]
  };

  /*
   * Four role-based scenarios. authority: 1 Manager · 2 Director · 3 VP · 4 C-suite.
   * reportsTo: the person (one of the 20) whose backing matters most to you, or null.
   * dilemmas: [dilemmaId, week it surfaces].
   */
  const LEVELS = ['', 'Corporate Manager', 'Director', 'Vice President', 'C-suite'];
  const SCENARIOS = [
    {
      id: 's1', number: 1, level: 'Corporate Manager', authority: 1, power: 'low', urgency: 'high',
      title: 'The Frontline Fixer',
      quadrant: 'Manager · Low power · High urgency',
      strategy: 'Tactical opportunism: use the burning platform to prove value fast, win senior sponsors early, then let them scale it.',
      role: 'Customer Experience Manager', reportsTo: 'kofi',
      weeks: 80, startCred: 7,
      intro: [
        'You are a Customer Experience Manager in the Sales & Customer function, reporting to Kofi Mensah. You own the support playbook and the customer-satisfaction numbers, but not the support team. That belongs to your peer, Ananya Ghosh.',
        'Since Nimbus Retail doubled its volumes, the support backlog has tripled: 9,000 open tickets, four-day response times, and Nimbus has started copying the CEO on complaints. You have seen what an AI support agent and a dispatch copilot could do. You have no budget and no mandate. You do have a burning platform, and a boss who will back you if you bring proof.',
        'Your task: move a critical mass of the 20 key people below to genuine adoption within 80 weeks. Anything company-wide will need senior sponsors, and the critical calls along the way are yours to make.'
      ],
      voices: [
        ['kofi', 'Bring me something that works on real tickets and I will put it in front of the leadership team.'],
        ['ananya', 'My team is drowning. I want help, not another project that lands on us.'],
        ['joanna', 'If a bot answers the calls, what happens to my twelve agents?'],
        ['imran', 'There is no budget line for this. Show me the payback first.']
      ],
      dilemmas: [['budget', 8], ['boss', 20], ['incident', 34], ['union', 52]],
      start: { ananya: 2, daniel: 3, joanna: 1 },
      startNote: 'The backlog crisis has everyone in Sales & Customer talking. Ananya wants help, Daniel already drafts client replies with an AI assistant, and Joanna has heard rumours of a support bot.'
    },
    {
      id: 's2', number: 2, level: 'Director', authority: 2, power: 'low', urgency: 'low',
      title: 'The Builder',
      quadrant: 'Director · Moderate power · Low urgency',
      strategy: 'Cultural advocacy plus local alignment: build capability and proof inside your remit, then enlist VPs to take it company-wide.',
      role: 'Director, Network Planning', reportsTo: 'devika',
      weeks: 104, startCred: 7,
      intro: [
        'You are Director of Network Planning, reporting to Devika Rao, VP Operations. Your 40 planners design the routes and hub loads for all 22 hubs. You can reshape how your own area works, but anything that touches the hubs, the fleet or the budget needs a VP to sign up.',
        'Nothing is broken. Volumes are steady and margins are recovering. But you can see that rivals adopting AI route optimisation will run 8–12% cheaper within three years. Devika is exhausted after the ERP rollout and is lukewarm at best. Push too hard and it looks like empire-building. Wait, and Saffron Route will be late.',
        'Your task: move a critical mass of the 20 key people below to genuine adoption within 104 weeks, building from your own remit outwards.'
      ],
      voices: [
        ['devika', 'After the ERP rollout, my team has no appetite for another system. Convince me it is worth it.'],
        ['arjun', 'If we start now, we can do this properly instead of in a panic later.'],
        ['rajesh', 'If the system plans the routes, what exactly is my job?'],
        ['manpreet', 'AI does not know that the Bhiwandi gate shuts early on Fridays.']
      ],
      dilemmas: [['vendor', 12], ['boss', 30], ['star', 50], ['privacy', 72]],
      start: { kofi: 1, sunita: 1, daniel: 1 },
      startNote: 'With no crisis, AI is a side conversation. The tech team is experimenting, but most leaders have only heard about it in passing.'
    },
    {
      id: 's3', number: 3, level: 'Vice President', authority: 3, power: 'high', urgency: 'high',
      title: 'The Turnaround',
      quadrant: 'VP · High power · High urgency',
      strategy: 'Decisive command within your mandate: use substantive levers early, in parallel with enabling ones, while winning over peers you do not control.',
      role: 'VP, Digital Operations', reportsTo: null,
      weeks: 80, startCred: 7,
      intro: [
        'The CEO hired you three months ago as VP Digital Operations, with a clear brief: "make Saffron Route digital." Two weeks ago Nimbus Retail, 35% of revenue, told the CEO that rival Velocity Freight now offers AI-driven 15-minute delivery windows and automatic re-routing. Nimbus wants live ETA accuracy above 95% within 18 months and a credible plan within 90 days.',
        'You have a formal mandate and a budget for the AI programme. But the VPs of Finance, Operations and People are your peers, not your reports, and at least one of them wanted your job. Your authority is real, but it is borrowed from the CEO, and every time you use it you spend some of the CEO\'s credibility as well as your own.',
        'Your task: move a critical mass of the 20 key people below to genuine adoption within 80 weeks.'
      ],
      voices: [
        ['imran', 'We are highly leveraged. Spending on AI now could put our covenants at risk.'],
        ['devika', 'My hubs just finished an 18-month ERP rollout. My managers will refuse another big change.'],
        ['kofi', 'Nimbus is already comparing us to Velocity. Without a credible answer we lose them.'],
        ['sunita', 'People will hear "AI" and think "layoffs". We need to get ahead of that.']
      ],
      dilemmas: [['incident', 10], ['budget', 22], ['union', 38], ['privacy', 56]],
      start: { gopal: 1, ravi: 1 },
      startNote: 'The Nimbus threat is common knowledge. Rumours about AI and job cuts have already reached the night shift and the drivers.'
    },
    {
      id: 's4', number: 4, level: 'C-suite', authority: 4, power: 'high', urgency: 'low',
      title: 'The Transformer',
      quadrant: 'C-suite · Full power · Low urgency',
      strategy: 'Systemic alignment: rewire goals, skills, incentives and structure so the new way becomes the easy way, without a crisis to rally around.',
      role: 'Chief Executive Officer', reportsTo: null,
      weeks: 104, startCred: 8,
      intro: [
        'You are the CEO, three years into the role after the founder stepped back. The board is supportive and the business is stable for the first time in years.',
        'At the annual strategy retreat you set out a five-year view: AI will separate the winners in logistics from everyone else. There is no crisis forcing your hand, which also means there is no crisis to rally people around. You hold every lever in the company, and every lever you pull sends a signal to 1,400 people.',
        'Your task: move a critical mass of the 20 key people below to genuine adoption within 104 weeks. Your decisions on the critical calls will shape the culture long after the programme ends.'
      ],
      voices: [
        ['imran', 'We have finally stabilised. Why gamble the recovery on something unproven?'],
        ['devika', 'After the ERP rollout, my team has no appetite for another system.'],
        ['arjun', 'If we start now, we can do this properly instead of in a panic later.'],
        ['sunita', 'If we do this, we have to be honest with people about what it means for jobs.']
      ],
      dilemmas: [['board', 14], ['union', 32], ['incident', 52], ['star', 74]],
      start: { kofi: 1, sameer: 1, daniel: 1 },
      startNote: 'Your strategy-retreat speech reached the top team. Below them, AI is mostly something people read about in the news.'
    }
  ];

  /*
   * Critical decisions. Effects:
   *  cred, weeks, gain: [[who, amount]] (who = id | 'boss' | 'all' | 'dept:X' | 'level:X'),
   *  resist / unresist / fear / unfear: [ids], setback: [ids], lock: [[leverId, weeks]],
   *  later: { after, cred, gain, note }  — a delayed consequence.
   *  lowAuthority: { below, ...effects, note } — extra effects if your authority is below `below`.
   */
  const DILEMMAS = {
    budget: {
      title: 'The budget freeze', who: 'imran',
      text: 'Imran Qureshi announces a freeze on all discretionary spending for two quarters to protect the debt covenants. The AI programme\'s training and vendor budget is on the list. You have 48 hours to respond.',
      options: [
        { label: 'Escalate and fight for the budget', detail: 'Take it over Imran\'s head and argue the programme is strategic.', tone: 'mixed',
          effects: { cred: 0, resist: ['imran'], gain: [['kofi', 30]], lowAuthority: { below: 3, cred: -2, note: 'Escalating above your level made you look like you were going around the CFO.' } },
          result: 'You keep the budget, but Imran now sees the programme as a threat to his credibility.', lesson: 'Winning a fight with a powerful resister can cost you a potential ally.' },
        { label: 'Build the ROI case with Finance', detail: 'Accept a smaller budget and co-build a payback model with Neha Bansal.', tone: 'good',
          effects: { weeks: 2, gain: [['imran', 70], ['neha', 80]], lock: [['academy', 12]] },
          result: 'Speaking Finance\'s language took two weeks, but Imran is now curious rather than hostile. External training is on hold for 12 weeks.', lesson: 'Translate the change into the resister\'s own terms.' },
        { label: 'Quietly move money from other projects', detail: 'Keep going by shifting spend from budgets you can influence.', tone: 'poor',
          effects: { cred: -2, resist: ['harish'], later: { after: 10, cred: -1, note: 'Internal audit flagged the reallocated spend. Harish raised it at the leadership meeting.' } },
          result: 'The work continues for now, but word gets around that you bent the rules.', lesson: 'Workarounds feel fast but quietly erode trust, and they surface later.' }
      ]
    },
    boss: {
      title: 'Your boss gets cold feet', who: 'boss',
      text: 'In your one-to-one, {boss} says: "Maybe we slow this down until next year. I am getting heat from the other VPs, and I cannot spend all my capital on your project."',
      options: [
        { label: 'Ask what the heat is, and offer to carry it', detail: 'Find out exactly who is pushing back and offer to brief them yourself.', tone: 'good',
          effects: { weeks: 1, gain: [['boss', 80], ['level:exec', 20]] },
          result: '{bossFirst} relaxes once they see you will absorb the political cost. Two VPs hear the case directly from you.', lesson: 'Make it easy for your sponsor to keep sponsoring you.' },
        { label: 'Go around your boss to the CEO', detail: 'The CEO said AI was a priority. Use that.', tone: 'poor',
          effects: { cred: -2, resist: ['boss'], gain: [['lena', 40]] },
          result: 'The CEO\'s office is sympathetic, but {bossFirst} feels betrayed and is now actively resisting.', lesson: 'Bypassing your boss trades a long-term sponsor for a short-term win.' },
        { label: 'Agree to slow down', detail: 'Protect the relationship and pause for six weeks.', tone: 'mixed',
          effects: { weeks: 6, gain: [['boss', 30]] },
          result: 'The relationship is intact, but you have lost six weeks of momentum.', lesson: 'Patience protects relationships, but time is also a budget.' }
      ]
    },
    incident: {
      title: 'The AI gets it wrong', who: 'manpreet',
      text: 'The AI route planner sends 14 trucks into a flooded underpass near Bhiwandi. Two Nimbus deliveries miss their window. Manpreet Singh says, loudly, "I told you so." The drivers\' WhatsApp groups are on fire.',
      options: [
        { label: 'Own it and fix it with the dispatchers', detail: 'Pause the planner for those routes and run the root-cause review with Manpreet\'s team.', tone: 'good',
          effects: { weeks: 2, cred: 1, unresist: ['manpreet'], gain: [['manpreet', 90], ['level:front', 35], ['rajesh', 30]] },
          result: 'Manpreet\'s local knowledge becomes a rule inside the planner. The frontline sees that their expertise matters.', lesson: 'Turn the expert sceptic into a co-designer, and failure becomes proof of listening.' },
        { label: 'Call it a one-off data glitch', detail: 'Reassure everyone that it will not happen again and keep going.', tone: 'poor',
          effects: { cred: -2, resist: ['gopal'], fear: ['ravi'], gain: [['level:front', -40]] },
          result: 'Nobody believes it. The frontline now reads every AI decision as a risk to them.', lesson: 'Minimising a visible failure costs more credibility than the failure itself.' },
        { label: 'Blame the vendor and switch tools', detail: 'Terminate the vendor and procure a new planner.', tone: 'mixed',
          effects: { weeks: 4, lock: [['pilot', 8]], gain: [['victor', -30]] },
          result: 'It looks decisive, but the switch costs four weeks and pilots are on hold for eight.', lesson: 'Changing the tool rarely fixes a problem of trust.' }
      ]
    },
    union: {
      title: 'Job fears go public', who: 'gopal',
      text: 'The night-shift loaders send an open letter: "No AI without job guarantees." It reaches a local newspaper. Gopal Yadav is named as the organiser.',
      options: [
        { label: 'Meet them and co-design a reskilling path', detail: 'Sit down with Gopal and Sunita, and commit to retraining routes for affected roles.', tone: 'good',
          effects: { weeks: 1, unfear: ['gopal', 'ravi', 'joanna'], gain: [['level:front', 55], ['sunita', 40]],
            lowAuthority: { below: 3, cred: -1, gain: [['level:front', -25]], note: 'You could not commit company money on your own. The promise sounded thinner than you hoped.' } },
          result: 'The tone changes from protest to negotiation. Fear of loss eases across the frontline.', lesson: 'Lower the cost of change instead of raising the pressure.' },
        { label: 'Issue a firm statement: automation is necessary', detail: 'Make the business case clearly and publicly.', tone: 'poor',
          effects: { cred: -1, resist: ['gopal', 'joanna'], gain: [['level:front', -40]] },
          result: 'Logically sound, emotionally deaf. Resistance hardens on the floor.', lesson: 'Facts do not answer fear.' },
        { label: 'Stay out of it and let HR handle it', detail: 'This is a labour-relations issue, not yours.', tone: 'mixed',
          effects: { cred: -1, gain: [['sunita', 20]] },
          result: 'HR calms it down, but people noticed you were silent on the question that mattered most to them.', lesson: 'Silence on the hardest question is itself a message.' }
      ]
    },
    vendor: {
      title: 'The shiny vendor', who: 'victor',
      text: 'A global AI vendor offers its full logistics suite at 40% off, if you sign by Friday. Arjun is excited. Victor Das in Procurement is furious that he was not involved.',
      options: [
        { label: 'Sign now and lock in the discount', detail: 'Speed and price are too good to miss.', tone: 'poor',
          effects: { cred: -1, resist: ['victor'], gain: [['arjun', 40]], later: { after: 16, cred: -1, note: 'The suite needs heavy customisation the discount did not cover. Finance is asking questions.' } },
          result: 'You have the tools, and a procurement process you bypassed.', lesson: 'Shortcuts around gatekeepers come back as resistance.' },
        { label: 'Run a four-week bake-off with Procurement', detail: 'Bring Victor and Mei Lin in to test two vendors on real routes.', tone: 'good',
          effects: { weeks: 2, gain: [['victor', 80], ['meilin', 40], ['sameer', 30]] },
          result: 'Victor co-owns the decision. Mei Lin\'s tests convince the planners.', lesson: 'Involve the people who can say no before they have to.' },
        { label: 'Build it in-house', detail: 'Let Mei Lin\'s data team build a tailored model.', tone: 'mixed',
          effects: { weeks: 3, gain: [['meilin', 60], ['arjun', 40], ['imran', -30]] },
          result: 'The tech team is energised, but it is slower, and Finance worries about the cost.', lesson: 'Ownership builds commitment, but it costs time.' }
      ]
    },
    star: {
      title: 'Your best champion is poached', who: 'meilin',
      text: 'Mei Lin Tan, your strongest technical champion, has an offer from Velocity Freight at 40% more pay. She tells you first.',
      options: [
        { label: 'Make her the AI programme lead', detail: 'Counter with a bigger role, not just money.', tone: 'mixed',
          effects: { gain: [['meilin', 60], ['arjun', 20]], lowAuthority: { below: 3, weeks: 2, note: 'You had to get your boss and HR to approve the role, which took two weeks.' } },
          result: 'She stays, and the programme has a visible leader. Some peers grumble about favouritism.', lesson: 'Recognition signals where power is flowing.' },
        { label: 'Let her go gracefully', detail: 'Wish her well and document what she knows.', tone: 'poor',
          effects: { setback: ['meilin'], gain: [['level:mid', -25], ['manpreet', -30]] },
          result: 'Her departure tells everyone that the AI path is not valued here.', lesson: 'Losing a visible champion costs more than one person.' },
        { label: 'Keep her and build a bench around her', detail: 'Match the offer partly, and pair her with Sameer and Fatima to spread her skills.', tone: 'good',
          effects: { weeks: 2, gain: [['meilin', 40], ['sameer', 60], ['fatima', 60]] },
          result: 'The programme no longer depends on one person, and two more people are learning fast.', lesson: 'Build capacity so the change does not collapse under its own weight.' }
      ]
    },
    privacy: {
      title: 'A data-privacy red flag', who: 'harish',
      text: 'Harish Iyer discovers that the AI planner uses driver location data that drivers never consented to share for this purpose. He wants everything stopped.',
      options: [
        { label: 'Pause and fix consent with Legal', detail: 'Work with Harish on consent, and explain it to drivers through Ravi.', tone: 'good',
          effects: { weeks: 2, unresist: ['harish'], unfear: ['ravi'], gain: [['harish', 90], ['ravi', 50]] },
          result: 'Harish becomes the programme\'s guardian instead of its critic. Drivers feel respected.', lesson: 'Treat the gatekeeper\'s concern as a design requirement.' },
        { label: 'Keep going and fix it later', detail: 'The deadline matters more. Patch consent in the next release.', tone: 'poor',
          effects: { cred: -1, resist: ['harish'], later: { after: 12, cred: -2, gain: [['level:front', -30]], note: 'A driver complaint about tracking reached the regulator. Harish says he warned you.' } },
          result: 'You keep the pace, and carry a risk that is now on record.', lesson: 'Ethical shortcuts are credibility loans with high interest.' },
        { label: 'Get an external legal opinion', detail: 'Ask outside counsel before deciding.', tone: 'mixed',
          effects: { weeks: 3, gain: [['harish', 40]] },
          result: 'It is careful and defensible, but it costs three weeks, and Harish is only half-convinced.', lesson: 'Caution is not the same as engagement.' }
      ]
    },
    board: {
      title: 'The board wants ROI now', who: 'imran',
      text: 'The board chair asks you for a hard ROI number at next month\'s meeting. Your honest estimate is payback in 30 months. Imran Qureshi is watching closely.',
      options: [
        { label: 'Give the honest number, with leading indicators', detail: '30-month payback, plus monthly adoption and service metrics the board can track.', tone: 'good',
          effects: { cred: 1, gain: [['imran', 60], ['neha', 40]] },
          result: 'The board respects the candour. Imran is reassured that you will not overpromise.', lesson: 'Credibility comes from realistic promises you can keep.' },
        { label: 'Promise payback in 12 months', detail: 'Give them the number they want to hear.', tone: 'poor',
          effects: { cred: 2, later: { after: 24, cred: -4, note: 'Twelve months on, the promised payback has not appeared. The board asks what else you overstated.' } },
          result: 'The board is delighted, for now.', lesson: 'Overpromising borrows credibility from your future self.' },
        { label: 'Ask for six months before committing', detail: 'Say it is too early to give a reliable number.', tone: 'mixed',
          effects: { cred: -1, gain: [['imran', 20]] },
          result: 'Prudent, but the board reads it as a lack of conviction.', lesson: 'Avoiding commitment can look like avoiding accountability.' }
      ]
    }
  };

  /* The 20 change targets (the key stakeholders of the AI programme). manager: null = top team. */
  const PEOPLE = [
    { id: 'lena', name: 'Lena Fischer', title: 'Chief of Staff', level: 'staff', dept: 'Office of the CEO', manager: null, openness: 1.1, influence: 3, resister: false, fear: false,
      stance: 'Neutral connector', concern: 'Everyone talks to me before they talk to you. Right now they are asking whether this is real or just another slide deck.' },
    { id: 'harish', name: 'Harish Iyer', title: 'Head of Legal & Compliance', level: 'staff', dept: 'Office of the CEO', manager: null, openness: 0.7, influence: 2, resister: true, fear: false,
      stance: 'Cautious resister', concern: 'Customer data, driver tracking, liability when an AI re-routes a truck badly — nobody has thought this through, and I will be the one in court.' },
    { id: 'imran', name: 'Imran Qureshi', title: 'Chief Financial Officer', level: 'exec', dept: 'Finance', manager: null, openness: 0.6, influence: 3, resister: true, fear: false,
      stance: 'Resister', concern: 'We are one bad quarter away from breaching covenants. Every rupee on AI is a rupee not spent on cost-cutting that we know works.' },
    { id: 'devika', name: 'Devika Rao', title: 'VP Operations', level: 'exec', dept: 'Operations', manager: null, openness: 0.65, influence: 3, resister: true, fear: false,
      stance: 'Change-fatigued resister', concern: 'My hubs just survived an 18-month ERP rollout. If I announce another system, my managers will walk.' },
    { id: 'arjun', name: 'Arjun Mehta', title: 'VP Technology', level: 'exec', dept: 'Technology', manager: null, openness: 1.4, influence: 2, resister: false, fear: false,
      stance: 'Enthusiast', concern: 'I have wanted to do this for years. My worry is that we treat it as an IT project instead of a business change.' },
    { id: 'sunita', name: 'Sunita Pillai', title: 'VP People', level: 'exec', dept: 'People', manager: null, openness: 1.15, influence: 2, resister: false, fear: false,
      stance: 'Supportive', concern: 'People will hear "AI" and think "layoffs". Unless we say clearly what happens to jobs, they will fill the silence with fear.' },
    { id: 'kofi', name: 'Kofi Mensah', title: 'VP Sales & Customer', level: 'exec', dept: 'Sales & Customer', manager: null, openness: 1.25, influence: 3, resister: false, fear: false,
      stance: 'Supporter', concern: 'My clients are already asking why we feel slower than Velocity. I need something real to show them, not a roadmap.' },
    { id: 'neha', name: 'Neha Bansal', title: 'Financial Controller', level: 'mid', dept: 'Finance', manager: 'imran', openness: 0.9, influence: 1, resister: false, fear: false,
      stance: 'Pragmatist', concern: 'Show me the payback period and I will build the model. So far nobody has.' },
    { id: 'victor', name: 'Victor Das', title: 'Procurement Manager', level: 'mid', dept: 'Finance', manager: 'imran', openness: 0.8, influence: 1, resister: false, fear: false,
      stance: 'Sceptic', concern: 'Every vendor says their AI is magic. I have seen three "transformations" that were really expensive licences.' },
    { id: 'priya', name: 'Priya Nair', title: 'Hub Operations Manager', level: 'mid', dept: 'Operations', manager: 'devika', openness: 0.95, influence: 2, resister: false, fear: false,
      stance: 'Open but stretched', concern: 'I like the idea. I just do not have a single spare hour to learn a new tool during peak season.' },
    { id: 'rajesh', name: 'Rajesh Kumar', title: 'Fleet Manager', level: 'mid', dept: 'Operations', manager: 'devika', openness: 0.8, influence: 2, resister: false, fear: true,
      stance: 'Worried', concern: 'If the system plans the routes, what exactly is my job? I have 20 years of knowing which roads flood in July.' },
    { id: 'meilin', name: 'Mei Lin Tan', title: 'Data Science Lead', level: 'mid', dept: 'Technology', manager: 'arjun', openness: 1.35, influence: 2, resister: false, fear: false,
      stance: 'Innovator', concern: 'The models are the easy part. Getting dispatchers to trust them is the hard part.' },
    { id: 'sameer', name: 'Sameer Joshi', title: 'IT Infrastructure Manager', level: 'mid', dept: 'Technology', manager: 'arjun', openness: 1.0, influence: 1, resister: false, fear: false,
      stance: 'Neutral', concern: 'Half our hubs still run on patchy connectivity. Fine — but somebody has to fund the plumbing.' },
    { id: 'fatima', name: 'Fatima Sheikh', title: 'Learning & Development Manager', level: 'mid', dept: 'People', manager: 'sunita', openness: 1.1, influence: 2, resister: false, fear: false,
      stance: 'Supportive', concern: 'Training is not one workshop. People need to practise on real work, with someone beside them.' },
    { id: 'daniel', name: 'Daniel Okafor', title: 'Key Accounts Manager', level: 'mid', dept: 'Sales & Customer', manager: 'kofi', openness: 1.05, influence: 1, resister: false, fear: false,
      stance: 'Supporter', concern: 'Nimbus calls me every week. I need proof points I can put in front of them.' },
    { id: 'ananya', name: 'Ananya Ghosh', title: 'Customer Support Manager', level: 'mid', dept: 'Sales & Customer', manager: 'kofi', openness: 1.0, influence: 2, resister: false, fear: false,
      stance: 'Cautiously open', concern: 'An AI agent could clear the backlog. Or it could make angry customers angrier. I want to test it first.' },
    { id: 'gopal', name: 'Gopal Yadav', title: 'Hub Supervisor (Night Shift)', level: 'front', dept: 'Operations', manager: 'priya', openness: 0.75, influence: 3, resister: false, fear: true,
      stance: 'Afraid for his crew', concern: 'My loaders have families. Every time head office says "efficiency", someone loses a job.' },
    { id: 'manpreet', name: 'Manpreet Singh', title: 'Senior Dispatcher', level: 'front', dept: 'Operations', manager: 'rajesh', openness: 0.6, influence: 3, resister: true, fear: false,
      stance: 'Expert sceptic', concern: 'AI cannot do what I do. It does not know that the Bhiwandi gate shuts early on Fridays.' },
    { id: 'joanna', name: "Joanna D'Souza", title: 'Support Team Lead', level: 'front', dept: 'Sales & Customer', manager: 'ananya', openness: 0.9, influence: 2, resister: false, fear: true,
      stance: 'Anxious', concern: 'If a bot answers the calls, what happens to my twelve agents?' },
    { id: 'ravi', name: 'Ravi Teja', title: 'Driver Coordinator', level: 'front', dept: 'Operations', manager: 'rajesh', openness: 0.8, influence: 2, resister: false, fear: true,
      stance: 'Uneasy', concern: 'Drivers already feel watched. Tell them a computer is planning their day and they will push back hard.' }
  ];


  /*
   * Where people stand before you act (stage index: 0 Unaware · 1 Aware · 2 Interest · 3 Trial · 4 Adoption).
   * AI is already in the news, so this follows the diffusion curve: an innovator in the data team, an early adopter
   * in technology, interested early-majority leaders, many people merely aware, and a frontline that is out of the loop.
   * Each scenario's `start` overrides these values.
   */
  const BASE_START = {
    meilin: 4, arjun: 3,
    kofi: 2, sunita: 2, lena: 2, sameer: 2, daniel: 2,
    imran: 1, devika: 1, harish: 1, neha: 1, victor: 1, priya: 1, fatima: 1, ananya: 1, rajesh: 1, manpreet: 1,
    gopal: 0, ravi: 0, joanna: 0
  };

  /* Informal friendships (made symmetric by the engine). */
  const FRIENDSHIPS = [
    ['lena', 'sunita'], ['lena', 'kofi'], ['lena', 'priya'], ['lena', 'meilin'],
    ['harish', 'imran'], ['harish', 'neha'],
    ['imran', 'devika'], ['imran', 'victor'],
    ['devika', 'rajesh'], ['devika', 'gopal'],
    ['arjun', 'meilin'], ['arjun', 'sameer'], ['arjun', 'kofi'],
    ['sunita', 'fatima'], ['sunita', 'joanna'],
    ['kofi', 'daniel'],
    ['neha', 'ananya'],
    ['victor', 'rajesh'],
    ['priya', 'gopal'], ['priya', 'fatima'],
    ['rajesh', 'manpreet'], ['rajesh', 'ravi'],
    ['meilin', 'manpreet'],
    ['sameer', 'ravi'],
    ['fatima', 'joanna'],
    ['daniel', 'ananya'],
    ['ananya', 'joanna'],
    ['gopal', 'manpreet'], ['gopal', 'ravi']
  ];

  /*
   * Levers.
   * scope: number of people to select, or 'org'.
   * stages: the adoption stages (indices into STAGES) the lever can move.
   * strength: progress points added (100 = one full stage for an average person).
   * spill: who else is influenced — 'friends', 'coworkers', 'both' or null.
   * kind: 'enabling' (low disruption) or 'substantive' (high disruption).
   * command: needs formal authority.
   */
  const LEVERS = [
    { id: 'listen', name: 'Hold listening sessions', scope: 4, weeks: 1, reuse: 1, stages: [0, 1, 2], strength: 70, spill: 'friends', spillF: 0.5, kind: 'enabling',
      desc: 'Private one-to-one conversations. You learn how each person really feels, what worries them and who they are friends with. Moves people before the trial stage, and a little of the conversation travels to their friends.' },
    { id: 'memo', name: 'Send a leadership memo', scope: 'org', weeks: 1, reuse: 4, stages: [0, 1], strength: 55, spill: null, kind: 'enabling',
      desc: 'An organisation-wide note setting out why the change matters and what is coming. Fast and cheap; only moves people who are unaware or merely aware.' },
    { id: 'townhall', name: 'Hold an open town hall', scope: 'org', weeks: 3, reuse: 6, stages: [0, 1, 2], strength: 50, spill: null, kind: 'enabling',
      desc: 'A two-way session where anyone can ask hard questions. Works on people before the trial stage.' },
    { id: 'example', name: 'Lead by example', scope: 'org', weeks: 2, reuse: 8, stages: [0, 1, 2, 3], strength: 35, spill: null, kind: 'enabling', needsComms: true,
      desc: 'You visibly use the AI tools in your own work and talk about what you learned. Builds credibility and nudges people at every stage — but only once the change has been communicated.' },
    { id: 'expert', name: 'Bring in an outside expert', scope: 'org', weeks: 3, reuse: 8, stages: [0, 1, 2], strength: 40, spill: null, kind: 'enabling', credGain: 1,
      desc: 'A respected outsider shows what AI is doing to logistics elsewhere. Can jolt people out of complacency and lend you credibility. Works before the trial stage.' },
    { id: 'goals', name: 'Set goals & deadlines', scope: 'org', weeks: 4, reuse: 10, stages: [1, 2, 3], strength: 55, spill: null, kind: 'substantive', command: true, authority: 3,
      desc: 'Announce hard targets (for example: 95% ETA accuracy by month 18) and dates. Focuses attention across the company — but it is a use of formal authority, and pressure without a reason breeds resentment.' },
    { id: 'story', name: 'Share a win story', scope: 3, weeks: 1, reuse: 1, stages: [1, 2], strength: 55, spill: 'friends', spillF: 0.6, kind: 'enabling', needsAdopter: true,
      desc: 'Tell three people a concrete story of the AI working — a route saved, a customer kept. Travels through friendship networks. You need at least one real adopter for there to be a story.' },
    { id: 'pilot', name: 'Run a sandbox pilot', scope: 3, weeks: 4, reuse: 12, stages: [2, 3], strength: 105, spill: 'coworkers', spillF: 0.5, kind: 'enabling',
      desc: 'Three people use the tools on real work in a safe sandbox. Learning by doing — the pivotal move from interest to trial. Their coworkers watch and learn too.' },
    { id: 'champions', name: 'Build a champion coalition', scope: 3, weeks: 4, reuse: 4, stages: [2, 3], strength: 75, spill: 'friends', spillF: 0.5, kind: 'enabling',
      desc: 'Recruit three people as visible champions with a real role in the programme. Works only on people already interested or trying, and pulls their friends along.' },
    { id: 'workshop', name: 'Run a hands-on workshop', scope: 3, weeks: 2, reuse: 10, stages: [3], strength: 100, spill: 'friends', spillF: 0.4, kind: 'enabling', fearSensitive: true,
      desc: 'In-house, practical training on real tasks. Helps people who are trying the tools make them part of their daily work.' },
    { id: 'academy', name: 'Send to an external AI academy', scope: 3, weeks: 4, reuse: 12, stages: [3], strength: 125, spill: 'friends', spillF: 0.4, kind: 'enabling', fearSensitive: true,
      desc: 'A deeper external programme with certification. Slower and costlier than a workshop, but more powerful for people in the trial stage.' },
    { id: 'spotlight', name: 'Spotlight an adopter', scope: 1, weeks: 3, reuse: 10, stages: [1, 2, 3], strength: 60, spill: 'both', spillF: 1, kind: 'enabling', spotlight: true,
      desc: 'Publicly recognise one person who has genuinely adopted. Signals where status is flowing; their coworkers and friends are influenced. Choose someone at the adoption stage.' },
    { id: 'confront', name: 'Have a candid one-to-one', scope: 1, weeks: 1, reuse: 4, stages: [1, 2, 3], strength: 70, spill: 'friends', spillF: 0.4, kind: 'substantive', confront: true,
      desc: 'A direct, private conversation with a resister about the behaviour that is blocking progress. Done with a real resister it can turn them; done with someone who is not resisting, it damages trust.' },
    { id: 'dashboard', name: 'Publish a progress dashboard', scope: 'org', weeks: 2, reuse: 2, stages: [1, 2], strength: 35, spill: null, kind: 'enabling', needsAdopters: 3,
      desc: 'Make progress visible on screens in every hub. Shifts norms for people who are aware or interested — but only once there is real progress (at least three adopters) to show.' },
    { id: 'values', name: 'Reframe purpose & values', scope: 'org', weeks: 8, reuse: 20, stages: [2, 3], strength: 60, spill: null, kind: 'substantive',
      desc: 'Rework the company\'s stated purpose and values to put customer reliability and continuous learning at the centre. Slow, but it directly moves people who are interested or trying.' },
    { id: 'pledge', name: 'Announce a reskilling guarantee', scope: 'org', weeks: 3, reuse: 30, stages: [1, 2, 3], strength: 45, spill: null, kind: 'substantive', command: true, authority: 4, pledge: true,
      desc: 'Commit publicly that no one will lose their job to the AI programme in the next two years, and fund retraining for every affected role. Lowers the cost of change for people held back by fear of loss. Needs formal authority.' },
    { id: 'incentives', name: 'Redesign incentives', scope: 'org', weeks: 12, reuse: 20, stages: [2, 3], strength: 90, spill: null, kind: 'substantive', command: true, authority: 3, fearSensitive: true, needsPhase: 2, needsCred: 6,
      desc: 'Change KPIs, bonuses and promotion criteria to reward AI-enabled ways of working. Powerful and organisation-wide, but needs high credibility and careful timing — pull it too early and it looks like coercion.' },
    { id: 'restructure', name: 'Reorganise around AI', scope: 'org', weeks: 16, reuse: 20, stages: [1, 2, 3], strength: 100, spill: null, kind: 'substantive', command: true, authority: 4, fearSensitive: true, needsPhase: 2, needsCred: 7,
      desc: 'Redraw reporting lines so planning, dispatch and support are organised around the AI workflow. The most powerful lever for locking change in — and the most dangerous if credibility or timing is wrong.' }
  ];

  const PHASES = ['Mobilise', 'Movement', 'Sustain'];

  const CONCEPTS = {
    matrix: [
      { power: 'low', urgency: 'low', name: 'Cultural advocacy', text: 'Quietly build a movement from the bottom up through persuasion, peer modelling and social proof. Start with early adopters, highlight small wins, and let peer norms shift.' },
      { power: 'high', urgency: 'low', name: 'Systemic alignment', text: 'Rewire the system so the new behaviour is the path of least resistance: goals, skills, incentives, structure. Start with less disruptive levers and preserve credibility.' },
      { power: 'low', urgency: 'high', name: 'Tactical opportunism', text: 'Use the burning platform to prove a solution fast — pilots, data, quick wins — then hand it to senior sponsors who can scale it. Build the coalition, including the CEO, early.' },
      { power: 'high', urgency: 'high', name: 'Decisive command', text: 'Frame the change as necessary for survival and move fast with clear direction. Use substantive levers early, in parallel with enabling ones, and protect credibility.' }
    ],
    costs: [
      { name: 'Fear of loss', text: 'Of a job, status, or a familiar way of working.' },
      { name: 'Finding a new identity', text: '"I am the person who knows the roads" has to become something new.' },
      { name: 'New competencies', text: 'The fear of looking incompetent while learning.' },
      { name: 'Time and energy', text: 'Learning takes hours that people do not have.' }
    ]
  };

  const DATA = { STAGES, COMPANY, SCENARIOS, LEVELS, DILEMMAS, BASE_START, PEOPLE, FRIENDSHIPS, LEVERS, PHASES, CONCEPTS, CRITICAL_MASS: 16, MAX_CRED: 10 };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.TP_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
