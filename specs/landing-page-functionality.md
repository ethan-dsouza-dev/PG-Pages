# Landing Page: Functional Requirements

**Source:** *PG Page User Stories + Day Planner* (PDF, user stories doc).
**Scope:** What the **landing page** (the main PG Page a signed-in user sees) must *do*. Visual design, tokens, and layout live in the mockups and the agent briefs in [briefs/](briefs/00-README.md); this file is about behavior only.

**In scope:** everything a user can see or trigger from the landing page itself, including the *entry points* to other screens.
**Out of scope (separate specs):** the full New/Edit Task window and its subphase editor, the Guided Day Planning page and its scripts, the Advertiser interface site, and sign-up/sign-in screens. Where the landing page opens one of these, this spec only defines *how it opens it and what it pre-fills*.

Requirement IDs (`LP-x.y`) are for reference in briefs, PRs, and tests.

---

## 1. Page structure (top to bottom)

| # | Section | Covered in |
|---|---|---|
| 1 | Header: page name, PG Page switcher, New PG Page, Guided Day Planning | §2 |
| 2 | Date + time representation (day block / calendar) | §3 |
| 3 | Goals for the day / Goals and Themes (chip sections) | §4 |
| 4 | Day actions: Reset Day, Change Reset Time | §5 |
| 5 | Ad gallery (paintings/posters) | §8 |
| 6 | Folder directory: Productivity, Self-Care, Leisure boards | §7 |
| 7 | Footer: Customize, Advertise on our Pages! | §9 |

Task interactions (§6) apply wherever a task appears: on the time representation and in the folder directory.

---

## 2. Header and PG Page management

- **LP-2.1 Page name.** A text box sits above the "PG Page" title where the user types a custom name for this PG Page. The name persists and is reused anywhere the page name is shown (e.g. footer).
- **LP-2.2 New PG Page.** The "New PG Page" button creates a new, empty PG Page instance. The user can name it via the page-name text box (LP-2.1).
- **LP-2.3 Your PG Pages switcher.** A "Your PG Pages" dropdown lists every PG Page the user owns. Selecting one switches the whole landing page to that instance. Each PG Page has its own tasks, goals, themes, folders, birthdays, and reset time.
- **LP-2.4 Guided Day Planning.** A "Guided Day Planning" button at the top of the page navigates to the Guided Day Planning (AI planner) page. *(That page is out of scope here.)*
- **LP-2.5 Auth gate (flagged).** Sign-in is controlled by the `VITE_AUTH_ENABLED` feature flag (`flags.authEnabled` in `src/config/flags.ts`; see `.env.example`).
  - **On:** the landing page is only reachable when signed in. Signed-out visitors are sent to sign in.
  - **Off (default):** no sign-in. The landing page loads directly and data stays local-only, as PROJECT_BRIEF §5 describes.
  - Code that needs to know about auth reads `flags.authEnabled`. It never reads `import.meta.env` directly. *(Resolves LP-OQ-9.)*
  - When on, the PG Page header shows **Sign out (name)**, which returns to the sign-in page. A signed-in session survives a reload.
  - **Current implementation:** `src/features/auth/` with a **mock** Google provider (no network; `?mockAuth=fail` simulates a failed sign-in). The real Supabase Google OAuth provider replaces it behind the same `AuthProvider` interface.
- **LP-2.6 Sign-in method (MVP).** Sign-in is **Google OAuth only** for the MVP (matches PROJECT_BRIEF §5). Other methods (email + password with verification, 2FA, other providers) are planned later, so keep the auth layer provider-agnostic and don't hard-code Google into landing-page UI beyond the sign-in button. *(Decided, resolves LP-OQ-1.)*

---

## 3. Date and time representation

### 3.1 Views
- **LP-3.1 Date.** The current day's date is displayed above the time representation.
- **LP-3.2 Default view: "Just for Today" (vertical).** A single day block with one column per task category (Productivity, Self-Care, Leisure) and an hour axis.
- **LP-3.3 Calendar view.** "See Calendar" switches to Calendar mode (multi-day grid: each day shows its date number, holiday/day label, birthdays, and the same per-category columns). In Calendar mode the button reads "See Just for Today" and switches back.
- **LP-3.4 Horizontal "Just for Today".** Same data as LP-3.2 laid out horizontally to better show subphases. **Not a priority**; no mockup exists yet.

### 3.2 Time range
- **LP-3.5 Default hours.** The day block runs **8:00 to 22:00** by default.
- **LP-3.6 Auto-extend.** If any task that day starts before 8:00 or ends after 22:00, the range extends to include it.
- **LP-3.7 24h toggle.** A checkbox forces the range to the full 24 hours, overriding LP-3.5/3.6.

### 3.3 Navigation
- **LP-3.8 See Yesterday / See Tomorrow.** Buttons move the day block back/forward one day with a smooth sliding transition (yesterday slides in from one side, tomorrow from the other).

### 3.4 Now indicator
- **LP-3.9** A thin red horizontal bar marks the current time, positioned proportionally within the day block. It updates as time passes.
- **LP-3.10 Time never changes status.** The passage of time **does not** auto-complete or auto-fail any task or goal. Completion is entirely user-driven. The only automatic state change is the daily reset (LP-5.3).

### 3.5 Tasks on the time representation
- **LP-3.11 Placement.** Timed tasks render in their category's column at their start/end times. "All Day" tasks and untimed tasks render without a time slot *(placement TBD, LP-OQ-4)*.
- **LP-3.12 Social vs. personal.** Unchecked **social** tasks show white text on a darker shade of the category colour; unchecked **personal/private** tasks show black text on a lighter shade.
- **LP-3.13 Milestones.** A task's milestones render as clickable vertical markers on its bar.
- **LP-3.14 Subphases.** A task with subphases renders its bar split into one coloured section per subphase. Clicking a subphase section opens the New/Edit Task window directly on that subphase's editor.

### 3.6 Birthdays
- **LP-3.15** A "Birthdays" label sits in the day block with a text field beneath it. Names typed there are saved to that date and **repeat annually**. They appear on the matching day in both views.

---

## 4. Goals and themes sections

- **LP-4.1 Sections.** The page shows goal/theme chip sections (e.g. "Goals for the day", "Goals for the month", "Themes and Values for the month").
- **LP-4.2 Daily check.** Every goal and theme can be checked off **daily**, regardless of its horizon (day/week/month/year). Checks clear at the reset time (LP-5.3).
- **LP-4.3 Checking.** Goals and themes use the same check flow and three completion states as tasks (§6.1).
- **LP-4.4 Context-aware "+".** Each section has a "+" button that opens the New Task window pre-set for that section (see LP-6.10).
- **LP-4.5 Right-click.** Goals and themes support the same right-click menu as tasks (§6.2), with labels adjusted ("Duplicate goal", "Duplicate theme").

---

## 5. Day actions and reset

- **LP-5.1 Reset Day.** Turns every checked (green) task and goal for the day back to unchecked (in-progress).
- **LP-5.2 Change Reset Time.** Opens a control to set the daily reset time for this PG Page. Default **12:00 am**.
- **LP-5.3 Automatic daily reset.** At the reset time, all **daily** tasks, goals, and themes return to in-progress. This is the only automatic, time-driven behaviour on the page.

---

## 6. Task interactions

### 6.1 Completion states (left click)
Three states: **In-progress** (default; shown in the category colour: red/yellow/blue), **Checked** (green), **Incomplete** (red).

- **LP-6.1 First-click confirmation.** Left-clicking an in-progress task asks the user to confirm they meant to check it off.
- **LP-6.2 One-click window.** Once the user has confirmed, any task can be checked with a single click for the next **60 seconds**. After 60s without a confirmation, LP-6.1 applies again.
- **LP-6.3 Mark incomplete.** Pressing and holding a task for **3 seconds** sets it to Incomplete (red).
- **LP-6.4 Incomplete → Checked.** Clicking an Incomplete task checks it (green) in one click.
- **LP-6.5 Un-check.** Clicking a Checked task prompts *"Are you sure you mean to un-check this task?"*. Confirming returns it to In-progress.

| From | Action | To |
|---|---|---|
| In-progress | click (+ confirm unless within 60s window) | Checked |
| Any | hold 3s | Incomplete |
| Incomplete | click | Checked |
| Checked | click + confirm | In-progress |

### 6.2 Right-click menu
Right-clicking a task (on the time representation or in a folder) opens a menu with, in order:

- **LP-6.6 Edit.** Opens the New/Edit Task window pre-filled with the saved values. Edits are **not** auto-saved; closing with unsaved changes warns the user.
- **LP-6.7 Create new instance.** Adds another occurrence of the *same* task to the schedule with a different start/end time. It does not create a new task. A companion entry, **"See previous task instances"**, lists the start/end times of that task's past instances.
- **LP-6.8 Duplicate.** Opens the New Task window pre-filled with all of the selected item's parameters, creating a *new* independent task/goal/theme on save.
- **LP-6.9 Remove.** Takes the task off the schedule without deleting it (it stays in its folder). **Greyed out** when the task is not on the upcoming schedule.
- **LP-6.10 Delete.** Confirms with *"Are you sure? Your task will be permanently deleted."* and **Proceed** / **Cancel**. Proceed deletes the task permanently.

### 6.3 Opening the New Task window
- **LP-6.11 "+" buttons.** Every "+" on the page opens the New Task window as a popup, **pre-filled based on where it was pressed**:

| "+" location | Pre-fill |
|---|---|
| Goals for the day | Goal tab, horizon = day |
| Goals for the month | Goal tab, horizon = month |
| Themes section | Theme tab |
| A category column / board | Task tab, folder = that category |
| A sub-folder | Task tab, folder = that sub-folder |
| A board's Social lane | Task tab, folder = that category, Social = checked |

*(The window's own fields, Task/Goal/Theme tabs, subphases, and milestones are specified separately.)*

---

## 7. Folder directory (category boards)

### 7.1 Structure
- **LP-7.1 Fixed categories.** The directory always shows exactly three top-level categories: **Productivity**, **Self-Care**, **Leisure**. Users **cannot** add, remove, or rename these.
- **LP-7.2 Social divider.** Each category is split by a line into a non-social area (no label) and a **Social** area.
- **LP-7.3 Sub-folders.** Users can create sub-folders (nested to any depth) and tasks inside any category. A new sub-folder needs only a **name** and a **location** in the directory.

### 7.2 Size limits and drill-down
The design goal is **short scrolls and more quick clicks**, not long scrolling.

- **LP-7.4 Root view.** Each category box is capped at **850px** tall. Overflow is hidden; the user clicks into the category to see more.
- **LP-7.5 Category opened.** When a category is opened, each sub-sub-folder inside it is capped at **550px** tall.
- **LP-7.6 Leaf folder.** A folder with no child folders has **no height cap**; all its tasks are shown.
- **LP-7.7 Scroll scope.** While a folder is selected, scrolling is limited to that folder's contents. To reach sibling ("uncle") folders, the user clicks the enclosing outer box to move up a level. E.g. inside "Low Day Productivity" you cannot scroll to "Tuesday School Day"; inside Productivity you can reach "Unsorted" but not Self-Care or Leisure.

### 7.3 Ordering inside a folder
- **LP-7.8 Today's tasks first.** Tasks that are instanced or repeating **in today's schedule** appear inside a black outline at the top of the folder.
- **LP-7.9 Everything else below.** Past, unused, and upcoming-but-not-started tasks sit below the outline.

### 7.4 Task actions in folders
- **LP-7.10** Tasks in folders support the full right-click menu (§6.2), including "Create new task instance" and "See previous task instances".

---

## 8. Ad gallery

- **LP-8.1 Ad detail.** Clicking an ad (painting/poster) opens a popup with: a larger image, the ad's description, and a link to the advertiser's website (opens externally).
- **LP-8.2 Swap ad.** The popup has a button to replace this ad slot with one of the **alternative approved ads** for that slot. The user's choice persists for their PG Page.
- **LP-8.3 Approved only.** Only ads accepted by a PG Page Company reviewer are ever shown. Ads pending review never reach the landing page.

---

## 9. Footer

- **LP-9.1 Customize.** Opens the customization controls (§10).
- **LP-9.2 Advertise on our Pages!** A button below "Customize" that sends advertisers to the separate Advertiser interface site.
- **LP-9.3** The footer shows the current PG Page's name (LP-2.1).

---

## 10. Customization

- **LP-10.1 Style only.** Users can change colours, borders, and styles of their PG Page. They **cannot** change the page's layout, structure, or functionality.
- **LP-10.2 Stickers.** Users can upload **.png** images and place them as stickers anywhere on their page. Sticker positions persist per PG Page.

---

## 11. Cross-cutting requirements

- **LP-11.1 Encryption.** All user data shown on or saved from the landing page is encrypted.
- **LP-11.2 No commercial data use.** No user data is collected for commercial distribution. Ad clicks/swaps must not be sold or shared for profiling.
- **LP-11.3 Persistence.** Everything the user changes on this page (checks, names, birthdays, reset time, folders, ad choices, stickers, styles) is saved per PG Page and survives reload.

---

## 12. Open questions

| ID | Question | Why it matters |
|---|---|---|
| ~~LP-OQ-1~~ | ~~Sign-in providers conflict.~~ **Resolved:** Google OAuth for the MVP; other sign-in methods added later. See LP-2.6. | LP-2.5, LP-2.6 |
| ~~LP-OQ-9~~ | ~~Signed-out use vs. auth gate.~~ **Resolved:** both are supported behind the `VITE_AUTH_ENABLED` flag (default off). See LP-2.5. | LP-2.5 |
| LP-OQ-2 | Does "Reset Day" (LP-5.1) also clear **Incomplete** (red) items, or only green ones? | Reset semantics |
| LP-OQ-3 | Is the 60s one-click window (LP-6.2) measured from the *last* confirmation or the last check? Is it per session or per PG Page? | Check flow |
| LP-OQ-4 | Where do **All Day** and **untimed** tasks appear on the time representation? | LP-3.11 |
| LP-OQ-5 | Does the 3-second hold (LP-6.3) work from every state, including Checked? | State table |
| LP-OQ-6 | Is a goal/theme's daily check (LP-4.2) independent of its horizon, i.e. a month goal can be ticked each day and resets nightly? | Goal model |
| LP-OQ-7 | Does the ad swap (LP-8.2) persist per PG Page or per user? | Ad model |
| LP-OQ-8 | The "Select Task(s)" and "Check All" controls in the current mockup are not in the user stories. Keep, change, or drop? (See brief 06 / OQ-3.) | Day actions |
