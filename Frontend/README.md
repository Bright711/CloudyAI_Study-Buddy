# CloudyAI Study Buddy — Frontend Demo

A responsive, browser-based frontend for the AZ-900 Exam Prep hackathon. This folder contains **frontend work only**; it does not connect to Supabase, an API, or any backend service.

## Features

- Overview dashboard with demo learning statistics and domain progress
- AZ-900 practice quiz with answer selection, validation, feedback, explanations, previous/next navigation, question jump grid, and reset
- Misconception Radar with concept review cards and domain filtering
- Topic Explorer with search and domain/difficulty filters
- Responsive sidebar/mobile navigation and empty/loading-free local demo states
- No build step or npm packages required

## Run in VS Code

1. Extract `CloudyAI_Frontend.zip`.
2. Open VS Code.
3. Select **File → Open Folder…** and choose the extracted `CloudyAI_Frontend` folder.
4. Recommended: install the **Live Server** extension in VS Code.
5. Right-click `index.html` and choose **Open with Live Server**.
6. Your browser should open the app at a local address such as `http://127.0.0.1:5500`.

If you do not want to install Live Server, open a terminal in the folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Files

- `index.html` — page structure and UI sections
- `styles.css` — layout, colours, responsive styling, and components
- `app.js` — local question data and frontend interactions

## Important integration notes for the team

- The questions in `app.js` are **illustrative demo content**. Replace them with the approved question bank or have the backend/content team provide it.
- This demo does not call an API or Supabase. Keep API integration with the teammate assigned to backend/integration.
- Correct answers and explanations are present in client-side demo data so the quiz works locally. Before production, do not expose correct answers in a client-delivered question payload; have the backend validate submitted answers.
- Dashboard statistics are calculated from answers submitted during the current browser session. They are not synced to an account or server.
- Any confidence scoring, persistent learner history, AI tutor, or automated intervention should be wired by the assigned teammates, not assumed to work in this static demo.
- The Google Fonts import is optional. If you are offline, the app uses local fallback fonts.

## Push your work to the team repository

The ZIP is a standalone frontend folder. To add it to the existing team repository without overwriting teammates' work:

1. Clone the repository in a separate folder (or open your existing team repo):

   ```bash
   git clone https://github.com/Bright711/CloudyAI_Study-Buddy.git
   cd CloudyAI_Study-Buddy
   ```

2. Create a branch for your frontend work:

   ```bash
   git checkout -b christine-frontend-ui
   ```

3. Copy the **contents** of the extracted `CloudyAI_Frontend` folder (`index.html`, `styles.css`, `app.js`, `README.md`) into a suitable frontend folder in the repository. First check the existing project structure with `dir` (Windows) or `ls` (macOS/Linux). If the team already has a frontend framework and app structure, do not replace its `package.json` or root files with this standalone version; instead, port the page markup/styles/logic into the agreed frontend structure with the team lead.

4. Review the changes:

   ```bash
   git status
   git diff --stat
   ```

5. Stage and commit only your frontend files. For example, if you copied them to `frontend-demo/`:

   ```bash
   git add frontend-demo/index.html frontend-demo/styles.css frontend-demo/app.js frontend-demo/README.md
   git commit -m "Build AZ-900 study buddy frontend UI"
   git push -u origin christine-frontend-ui
   ```
