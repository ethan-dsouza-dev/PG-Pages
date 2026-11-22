# New / Edit Task Window: Functional Requirements

**Source:** *PG Page User Stories + Day Planner* (PDF), section "New / Edit Task Page", plus the decisions recorded in [landing-page-functionality.md](landing-page-functionality.md).
**Scope:** What the **New / Edit Task window** must *do*: how it opens, its tabs and fields, subphases and milestones, saving, and how it creates, edits, duplicates, and instances items. Visual design is out of scope (no mockup yet; see TW-OQ-9).

Requirement IDs (`TW-x.y`) are for reference in briefs, PRs, and tests. `LP-x.y` IDs point at the landing-page spec.

**Unblocks on the landing page:** the "Add Timed Task" "+" and every other "+" (LP-6.11), right-click **Edit** (LP-6.6) and **Duplicate** (LP-6.8), hold-menu **Edit task instance** (LP-6.3), and clicking a subphase section on a task bar (LP-3.14).

---

## 1. Opening the window

- **TW-1.1 Popup.** The window opens as a modal popup over the PG Page. Focus moves into it, Tab stays inside it, and focus returns to the control that opened it when it closes.
- **TW-1.2 Modes.** The window opens in one of four modes. The title says which.

| Mode | Opened by | Starts with | Save does |
|---|---|---|---|
| **New** | Any "+" (LP-6.11) | Empty fields plus the pre-fill for that "+" (TW-1.3) | Creates a new item |
| **Edit** | Right-click → **Edit** (LP-6.6); clicking a subphase section on a bar (LP-3.14) | The item's saved values | Updates that item |
| **Duplicate** | Right-click → **Duplicate** (LP-6.8) | All of the source item's values, label included | Creates a new, independent item; the source is unchanged |
| **Edit instance** | Hold menu → **Edit task instance** (LP-6.3) | That one occurrence's values | Updates that occurrence only (TW-6.3) |

- **TW-1.3 Pre-fill by "+".** In **New** mode, the "+" that opened the window decides the starting tab and values:

| "+" location | Tab | Pre-filled |
|---|---|---|
| Add Timed Task (timeline) | Task | Timing = timed; start = next whole hour today, end = one hour later |
| Goals for the day | Goal | Horizon = day |
| Goals for the month | Goal | Horizon = month |
| Themes and Values | Theme | none |
| A category board | Task | Folder = that category |
| A sub-folder | Task | Folder = that sub-folder |
| A board's Social lane | Task | Folder = that category; Social = checked |

- **TW-1.4 Subphase entry.** Clicking a subphase's colour section on a task bar opens the window in **Edit** mode for the parent task, already slid to that subphase's panel (TW-4.3).

---

## 2. Tabs

- **TW-2.1 Tab bar.** Below the title, a tab bar offers **Task**, **Goal**, and **Theme**. Selecting a tab shows that type's fields.
- **TW-2.2 Switching tabs while creating.** In **New** mode the user can switch tabs freely. Fields that both types share (Label) carry over; the rest keep their own values until Save.
- **TW-2.3 Tabs are locked when editing.** In **Edit**, **Duplicate**, and **Edit instance** modes the tab bar shows the item's type and can't be changed: an existing item can't be turned into a different type.

---

## 3. Fields by tab

### 3.1 Goal tab
- **TW-3.1 Label** (required).
- **TW-3.2 Horizon:** how long-term the goal is: **day**, **week**, **month**, or **year**. Required; default from the "+" (TW-1.3), otherwise day.
- **TW-3.2a Timing and Repeat.** A goal can also have **Timing** (TW-3.7) and **Repeat** (TW-3.8), with the same rules as a task. Both are optional; a goal with no timing just sits in its section. *(Resolves TW-OQ-5.)*
- Goals are checked off on the page and reset at the end of their horizon (LP-4.2). Nothing about checking is set in this window.

### 3.2 Theme tab
- **TW-3.3 Label** (required).
- **TW-3.3a Month.** Which month the theme is for. Default: the current month. The "Themes and Values for the month" section shows the themes for the month being viewed. *(Resolves TW-OQ-2.)*
- Themes reset daily and can never be Missed (LP-4.2).

### 3.3 Task tab
| # | Field | Rules |
|---|---|---|
| TW-3.4 | **Folder** | Required. A picker for browsing the task directory: Productivity, Self-Care, or Leisure, then any sub-folder inside (LP-7). Default from the "+", otherwise the category's top level. The three categories can't be added to or renamed (LP-7.1). |
| TW-3.5 | **Social** | Checkbox. Social tasks show in the board's Social lane (LP-7.2) and use the social colours on the timeline (LP-3.12). |
| TW-3.6 | **Label** | Required. The task's name. |
| TW-3.7 | **Timing** | One of: **Timed** (start and end time), **All Day**, or **Not timed**. Timed requires end after start. All Day and Not timed tasks live behind the All Day button, not on the time sheet (LP-3.11a). |
| TW-3.8 | **Repeat** | **Never** (default), **Daily**, **Weekly**, **Monthly**, or **Custom**. **Custom** = every **N days, weeks, or months**; when the unit is weeks, also pick the **weekdays** (e.g. Mon/Wed/Fri). Every repeat can end **never**, **on a date**, or **after N times**. Each repeat is an instance of the same task (see §6). *(Resolves TW-OQ-3.)* |
| TW-3.9 | **Milestones** | Zero or more, each with a **label** and a **time**. A milestone's time must fall inside the task's start–end. Drawn as a clickable vertical line on the task bar (LP-3.13). Only for Timed tasks. |
| TW-3.10 | **Subphases** | Optional; see §4. Only for Timed tasks. |
| TW-3.12 | **Counts toward goal** | Optional. Pick one goal this task contributes to (e.g. "Gym" → "Get fit this month"). Only a link for now: checking the task doesn't check the goal. *(Resolves TW-OQ-8.)* |

- **TW-3.11 Existing folders only.** The folder picker only chooses folders that already exist. New sub-folders are created on the boards (LP-7.3), not from the window. *(Resolves TW-OQ-6.)*

---

## 4. Subphases

A subphase is a timed child of a task (or of another subphase), drawn as a coloured section of the parent's bar. Subphases form a **tree**.

### 4.1 Creating subphases
- **TW-4.1 Split.** In the Task tab (or a subphase panel), the user chooses **how many** subphases to split into and whether they are **evenly spaced** or have **custom** start and end times.
  - **Even:** the parent's start–end is divided into that many equal, back-to-back subphases.
  - **Custom:** each subphase gets its own start and end, set in its panel (TW-4.4). They must stay inside the parent's start–end and must not overlap each other.
- **TW-4.2 Bar preview.** As soon as a split is chosen, the task's bar in the window splits into that many differently coloured sections.

### 4.2 Editing a subphase
- **TW-4.3 Subphase panel.** Clicking a coloured section **slides** the window to that subphase's panel. A back control (and Escape) slides back to the parent. A breadcrumb shows the path, e.g. *F101 Assignment › Phase 2 › Phase 2.1*.
- **TW-4.4 Subphase fields:**

| Field | Rules |
|---|---|
| **Label** | Optional. If blank, it's shown as "Phase n". |
| **Member assigned** | Optional free text (a person's name). |
| **Start and end** | Only when the parent was split **custom**. Inside the parent's span; no overlap with siblings. |
| **Milestones** | As TW-3.9, inside this subphase's span. |
| **Subphases** | The same split control (TW-4.1), so subphases can contain subphases to any depth. |

### 4.3 Deleting a subphase
- **TW-4.5 Delete cascades down.** Deleting a subphase also deletes all of its child subphases and every milestone inside them.
- **TW-4.6 Siblings stay.** Its sibling subphases are kept unchanged. The time it covered becomes an empty, **unsorted** gap in the parent's bar; nothing expands to fill it. *(Resolves TW-OQ-4.)*
- **TW-4.7 Confirm.** Deleting a subphase that has children asks for confirmation, saying how many subphases and milestones will go with it.

---

## 5. Saving, validation, and closing

- **TW-5.1 Save.** A **Save** button commits the window. Nothing is saved before Save: no autosave.
- **TW-5.2 Required fields.** Save is refused while a required field is empty or a rule is broken: label, folder, end after start, milestones and subphases inside their parent's span, custom subphases not overlapping. Each problem is shown next to its field and announced to screen readers, and focus moves to the first one.
- **TW-5.3 Unsaved-changes warning.** Closing the window (close button, Escape at the top level, clicking outside) with unsaved changes asks: **Discard changes** or **Keep editing**. With no changes it just closes.
- **TW-5.4 After Save.** The window closes and the page updates straight away: the timeline (timed tasks), the All Day list, the boards (folder and Social lane), and the goal and theme sections.
- **TW-5.5 Edit any time.** Any saved item can be reopened with Edit, including to add or change subphases and milestones later.

---

## 6. Instances

A task can occur more than once, for example a repeating task (TW-3.8) or a manually created instance (LP-6.7). Every occurrence is an **instance** of the same task: it shares the task's label, folder, social flag, and subphase structure, but has its own start and end time and its own Done/Missed status.

- **TW-6.1 Create new instance** (LP-6.7, LP-6.3 hold menu). Opens a small form asking only for the new instance's **start and end** (timing type as the task). Save adds the occurrence to the schedule. It does not create a new task or appear as a new item in the folder.
- **TW-6.2 See instances.** Lists the instances' start–end times, newest first (LP-6.7 "See previous task instances", LP-6.3 "See all task instances"; scope open as LP-OQ-11).
- **TW-6.4 Editing a repeating task's time.** When Save changes the start or end of a task that repeats, the window asks which occurrences to change: **Only this one**, **This and following**, or **All**. *(Resolves TW-OQ-7.)*
- **TW-6.3 Edit instance.** Edits only that occurrence's start, end, and milestones. Changing the label, folder, social flag, or subphase structure is done with **Edit** on the task and applies to all instances.

---

## 7. Data model changes (for implementers)

The current types (`src/domain/types.ts`) don't hold everything this window edits. The implementing brief needs to add, at least:

| Need | Today | Change |
|---|---|---|
| Folder and category | `Task` has none; boards use a separate `BoardItem` | **Merge `BoardItem` into `Task`** (TW-OQ-1): a task has a folder (board group) and categories, and boards render tasks |
| Social flag | Only via `BoardItem.categoryIds` | `Task.social: boolean` |
| Milestones | None | `milestones: { id, label, at }[]` on tasks and phases |
| Subphase extras | `Phase` has `title`, `start`, `end`, `subphases` | Add `member?: string`, `milestones`, and the split mode (even/custom) |
| Repeat | `seriesId` only | A recurrence rule (daily/weekly/monthly/custom); see PROJECT_BRIEF's RRULE `recurrence` |
| Goal horizon | `GoalScope = 'day' \| 'month' \| 'theme'` | Add `week` and `year`; themes get a `month`; goals get optional timing and repeat |
| Goal link | `Task.goalId` exists, unused | Set from "Counts toward goal" (TW-3.12) |

---

## 8. Decisions (were open questions)

| ID | Question | Decision |
|---|---|---|
| ~~TW-OQ-1~~ | Task vs. board item | **Merge** into one type: boards render `Task`s grouped by folder. |
| ~~TW-OQ-2~~ | Theme fields | **Label + month** (TW-3.3a). |
| ~~TW-OQ-3~~ | Custom repeat | **Both**: every N days/weeks/months, weekdays when weekly, end never/on date/after N times (TW-3.8). |
| ~~TW-OQ-4~~ | Deleting a subphase | The deleted span becomes an **empty gap**; siblings keep their times (TW-4.6). |
| ~~TW-OQ-5~~ | Goal fields | Label, horizon, **plus optional timing and repeat** (TW-3.2a). |
| ~~TW-OQ-6~~ | New sub-folder from the picker | **No**: folders are made on the boards only (TW-3.11). |
| ~~TW-OQ-7~~ | Editing a repeating task | **Ask each time**: Only this one / This and following / All (TW-6.4). |
| ~~TW-OQ-8~~ | Link a task to a goal | **Yes, optional** "Counts toward goal" (TW-3.12). |
| ~~TW-OQ-9~~ | Visual design | **Design from the existing tokens and primitives**; revise if a mockup arrives. |
