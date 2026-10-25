# EventPlanner AI

A planning assistant for weddings, birthdays and community events. Enter your event details once and get:

- **Personalised ideas** for themes, decor, catering, activities and venues, shaped by your theme, preferences and per-guest budget.
- **A budget breakdown** that compares each category's allocation with an estimated spend, flags overspending, and lets you adjust shares.
- **A dated timeline** built back from your event date, with priorities and completion tracking.
- **A vendor checklist** of roles to fill, with booking progress.
- **A chat assistant** that refines the plan ("Reduce catering by 20%", "Plan this for 150 guests within ₹5 lakh") while keeping your event context.

Everything runs in the browser. There is no backend, no API key, and no data leaves your device: the plan is saved in `localStorage`.

> **Note:** Costs are planning estimates, not verified market prices. The vendor checklist lists roles only; it does not look up or contact real vendors.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # start the dev server
npm test           # run the unit tests
npm run build      # type-check and build to dist/
npm run preview    # serve the production build locally
```

## Deploying to GitHub Pages (free)

1. Push this repository to GitHub on the `main` branch.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Each push to `main` runs `.github/workflows/deploy.yml`: it installs dependencies, runs the tests, builds, and publishes `dist/`.

The Vite `base` is set to `./`, so the same build works at `https://<user>.github.io/<repo>/` without configuration.

## Project structure

```
src/
  engine/          Pure planning logic (no React, fully unit tested)
    types.ts         Shared data types
    costs.ts         Estimated cost model and category labels
    budget.ts        Budget allocation, overspend detection, share rebalancing
    timeline.ts      Date-relative task generation and completion handling
    vendors.ts       Vendor role checklists
    ideas.ts         Theme, preference and budget-aware ideas
    validate.ts      Input parsing, sanitising and validation
    money.ts         Amount parsing (lakh, crore, k) and INR formatting
    dates.ts         Strict ISO date helpers
    planner.ts       Plan creation and updates
    assistant.ts     Rule-based chat assistant
    storage.ts       Safe localStorage persistence
  components/      Accessible React UI components
  App.tsx          Application shell and state
```

## Design notes

- **Rule-based assistant.** Plans come from deterministic rules rather than a language model. This keeps the app free to host, private, and predictable. The assistant reads budget, guest, allocation, checklist, idea and vendor requests from plain text.
- **Estimates are labelled.** Every cost figure is described as an estimate, and the model's assumptions live in one file (`costs.ts`) so they are easy to review.
- **Input handling.** Form values are parsed and sanitised before use, with explicit limits. Chat input is length-limited and whitespace-normalised. React escapes all rendered text.
- **Accessibility.** Labelled controls, `aria-describedby` for hints and errors, a live region for chat replies, visible focus styles, and text (not just colour) for status.
- **Testing.** Run `npm test`. The suite covers budget arithmetic and its boundaries, validation limits, date handling, timeline regeneration, and assistant parsing.
