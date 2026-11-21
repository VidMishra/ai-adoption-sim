# Tipping Point: an AI adoption simulation

An original change-leadership simulation. You lead **Saffron Route Logistics** (about 1,400 people, 22 hubs) through company-wide AI adoption. You diagnose 20 key people across four levels, choose from 18 change levers, and try to get 16 of them to genuine adoption before you run out of weeks or credibility.

## Play
Open **`dist/Tipping-Point.html`** in any modern browser. It's one file, so there's nothing to install or host. Share it by email, LMS or chat.

## Four roles, four seats of authority
| # | Role | Authority | Urgency | Weeks |
|---|---|---|---|---|
| S1 | **Corporate Manager**: Customer Experience Manager (reports to the VP Sales & Customer) | 1 of 4 | High (support backlog crisis) | 80 |
| S2 | **Director**: Director, Network Planning (reports to the VP Operations) | 2 of 4 | Low (proactive) | 104 |
| S3 | **Vice President**: VP Digital Operations, peers with the other VPs | 3 of 4 | High (major-client threat) | 80 |
| S4 | **C-suite**: CEO | 4 of 4 | Low (five-year transformation) | 104 |

- **Authority:** levers above your level (goals and deadlines, incentives, the reskilling guarantee, reorganising) need senior sponsors at Trial or beyond. One level short needs 2 sponsors; two or more levels short needs 3.
- **Your boss:** for the Manager and Director roles, your boss's stance boosts or weakens every lever.
- **Critical decisions:** each role faces 4 dilemmas, such as a budget freeze, an AI failure, job fears going public, a poached champion, a data-privacy flag or board ROI pressure. Each has 2–3 options with trade-offs. Some consequences arrive later, and some options play out differently depending on your seniority. The debrief and the facilitator dashboard review these choices.

## Running a class
1. Open the file, go to **Menu → Facilitator dashboard** and click **Create session code**.
2. Teams choose **Class session** and enter their team name and the code. The same code gives every team the same random conditions.
3. At the end, each team copies its **result code**, or downloads the result file, and sends it to you.
4. Paste the codes or upload the files in the dashboard. You get a leaderboard, adoption curves, per-scenario comparisons, lever usage with mistimed share, debrief prompts and a CSV export.

All data stays in the browser. Nothing is sent anywhere.

## Developing
- `src/data.js`: scenarios, people, friendships and levers (edit here to change the case)
- `src/engine.js`: the pure simulation engine
- `src/app.js` and `src/styles.css`: the interface
- `node build.js`: inlines `src/` into `dist/Tipping-Point.html`
- `node test/balance.js`: bots play every scenario to check difficulty
- `node test/e2e.js [dir]`: a Chrome playthrough with screenshots (needs playwright-core)
