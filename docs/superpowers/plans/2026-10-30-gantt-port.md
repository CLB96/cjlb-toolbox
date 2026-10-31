# Plan: port Gantt Tracker to the v2 SPA

Branch `claude/elegant-almeida-6a8612` (base origin/v2 f5b4168). Mockup approved by the owner on 2026-10-30
(`v2/legacy-fixtures/private/mockups/gantt.html`, private). Behavior source: `gantt-inventory.md` + `gantt/index.html`.

## Scope

- New tab `gantt` in `v2/src/tools/gantt/`, same pattern as GapCheck/Bondline: per-instance Zustand store,
  `usePersistentTool('gantt')`, history dialog, toolbox theme/lang.
- Pure logic (`logic/`) ported from L1024–L1106, L1446–L1479 with `tasks`/`today` as parameters instead of globals.
  Verbatim copy in `v2/legacy-fixtures/gantt/legacyReference.ts`; differential tests compare both.
- ES/EN dictionary copied verbatim from L461–L781; v2-only keys appended at the end of each language.
- UI: overview (6 stats + progress band), Nueva tarea, Vista general (search/filter/sort, Días/Semanas),
  timeline table (day/week), inline edit, duplicate, delete subtree, collapse, row reorder (subtasks between siblings),
  bar drag/resize with undo (day view), column resize 80–520, donut with selectable segment, Excel (ExcelJS, bundled) and PNG.
- Owner decisions: no JSONBin/`?bin=`, no demo/"Restaurar demo", no password lock; up to 5 charts per user
  (create/rename/delete, selector in header); an empty chart stays empty.

## Not changed (pending owner decision)

Every quirk listed in `gantt-mejoras-propuestas.md` keeps the original behavior.

## Tests (~100)

Differential (new logic vs legacy reference on fixtures), store (charts, CRUD, reorder, duplicate, prefs, snapshot),
component/integration (render, add/edit/delete, filters, view switch, drag undo, charts selector), exports (model only).
