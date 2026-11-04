# Brief 07: Integration and QA Pass

## Goal
Run one pass over the assembled page to close gaps between the briefs, verify quality targets, and produce a short report of the remaining deviations and open questions.

## Read first
- All previous briefs, and [00-README.md](00-README.md) open questions.
- PROJECT_BRIEF §9 (quality targets)

## Checklist

### Visual fidelity (1440px)
- [ ] Put a screenshot of the running app next to the [mockup](../mockups/pg-page-desktop-v1.png) and list every visible deviation as *intentional* or *to fix*. Fix the to-fix items that are under ~30 minutes of work.
- [ ] Check that 1024px doesn't break: no overlaps or clipped text.

### Design-system hygiene
- [ ] `grep -rnE "#[0-9a-fA-F]{3,8}" src --include=*.tsx --include=*.ts` returns nothing outside `src/styles/tokens.css`.
- [ ] No component uses a primitive (`--palette-*`) directly.
- [ ] Spot-check token swapping: temporarily change `--color-surface-page` and `--color-task-done` and confirm the whole UI follows. This validates OQ-6 readiness.

### Accessibility
- [ ] The whole page can be operated by keyboard in a logical tab order: header links, then week/day nav, task bars and phases, Add Timed Task, the action row, then the chips.
- [ ] axe (browser extension or `@axe-core/react` in dev only, flagged as a dev dependency) reports no serious or critical issues.
- [ ] Text contrast on rust, green, tan, and yellow meets WCAG AA. If the mockup colors fail, propose adjusted **primitive** values in the report. Don't change them silently.
- [ ] `prefers-reduced-motion` disables smooth scroll and transitions.

### Quality gates
- [ ] `npm run build`, `npm run lint`, and `npm run test` all pass.
- [ ] Lighthouse desktop performance ≥ 90 on `npm run preview`.
- [ ] `grep -rn "PLACEHOLDER(" src` lists every placeholder. Paste the list in the report.
- [ ] `grep -rn "TODO(OQ-" src` lists every open-question hook.

## Deliverable
`specs/reports/ui-v1-qa.md` containing: the deviations table, the contrast findings, the placeholder list, open-question status, and recommended next briefs.
