# CapaFlow inventory — logically bounded sections

This corrected set replaces the earlier fixed 500-line slices. It contains 24 ordered sections; every Markdown file is at most 500 lines, including navigation and added context.

## Verified guarantees

- Every original inventory line is included exactly once, in its original order.
- Original content is byte-preserved; only navigation/context and two presentation fence lines were added.
- Every Markdown file has balanced code fences; no table or prose paragraph crosses a file boundary.
- All code blocks remain in one file except the single unavoidable oversized block described below.
- No original application code, formula, translation, sample value or source-line citation was changed.

## One necessary, explicit continuation

The `_drawGuide()` function occupies 505 source lines, or 507 lines with its Markdown fences. It cannot fit unmodified in a 500-line file. It is therefore presented as A/2 and B/2 in adjacent, explicitly linked files. The boundary is after the complete PPM section and before CONTROL CHARTS, never inside an expression, string, array or nested callback. Both fragments passed syntax-only checks with only their missing outer-function delimiter supplied. Each Markdown fragment opens/closes its own fence; the function is one logical implementation, not two standalone functions.

## How to send to Claude

1. Send this README first, then all numbered sections in ascending order.
2. Ask Claude to wait for the final section before implementing the migration.
3. Treat CODE CONTINUATION A/2 and B/2 as the same `_drawGuide()` function.
4. References to inventory lines identify the complete Markdown; original `index.html` citations remain unchanged.

**Verification:** 9347 original lines; 149 code blocks; 29 intact tables; 24 sections; maximum file length 492 lines. Exact original-byte reconstruction: PASS. Original unchanged: PASS.

Original inventory SHA-256: `9191a9141839f4a00ccea65b3815f02b80e49c44e451043f0cfd538921cad699`.

| Order | File | Original inventory lines | Total file lines | Continuity |
|---|---|---|---:|---|
| 01/24 | [capaflow-inventory-section-01-of-24.md](capaflow-inventory-section-01-of-24.md) | 1–477 | 489 | Complete blocks |
| 02/24 | [capaflow-inventory-section-02-of-24.md](capaflow-inventory-section-02-of-24.md) | 478–957 | 492 | Complete blocks |
| 03/24 | [capaflow-inventory-section-03-of-24.md](capaflow-inventory-section-03-of-24.md) | 958–1170 | 225 | Complete blocks |
| 04/24 | [capaflow-inventory-section-04-of-24.md](capaflow-inventory-section-04-of-24.md) | 1171–1615 | 457 | Complete blocks |
| 05/24 | [capaflow-inventory-section-05-of-24.md](capaflow-inventory-section-05-of-24.md) | 1616–2064 | 461 | Complete blocks |
| 06/24 | [capaflow-inventory-section-06-of-24.md](capaflow-inventory-section-06-of-24.md) | 2065–2473 | 421 | Complete blocks |
| 07/24 | [capaflow-inventory-section-07-of-24.md](capaflow-inventory-section-07-of-24.md) | 2474–2929 | 468 | Complete blocks |
| 08/24 | [capaflow-inventory-section-08-of-24.md](capaflow-inventory-section-08-of-24.md) | 2930–3385 | 468 | Complete blocks |
| 09/24 | [capaflow-inventory-section-09-of-24.md](capaflow-inventory-section-09-of-24.md) | 3386–3798 | 425 | Complete blocks |
| 10/24 | [capaflow-inventory-section-10-of-24.md](capaflow-inventory-section-10-of-24.md) | 3799–4195 | 409 | Complete blocks |
| 11/24 | [capaflow-inventory-section-11-of-24.md](capaflow-inventory-section-11-of-24.md) | 4196–4590 | 407 | Complete blocks |
| 12/24 | [capaflow-inventory-section-12-of-24.md](capaflow-inventory-section-12-of-24.md) | 4591–5052 | 474 | Complete blocks |
| 13/24 | [capaflow-inventory-section-13-of-24.md](capaflow-inventory-section-13-of-24.md) | 5053–5199 | 159 | Complete blocks |
| 14/24 | [capaflow-inventory-section-14-of-24.md](capaflow-inventory-section-14-of-24.md) | 5200–5668 | 481 | Complete blocks |
| 15/24 | [capaflow-inventory-section-15-of-24.md](capaflow-inventory-section-15-of-24.md) | 5669–6122 | 466 | Complete blocks |
| 16/24 | [capaflow-inventory-section-16-of-24.md](capaflow-inventory-section-16-of-24.md) | 6123–6338 | 228 | Complete blocks |
| 17/24 | [capaflow-inventory-section-17-of-24.md](capaflow-inventory-section-17-of-24.md) | 6339–6798 | 472 | Complete blocks |
| 18/24 | [capaflow-inventory-section-18-of-24.md](capaflow-inventory-section-18-of-24.md) | 6799–7161 | 375 | Complete blocks |
| 19/24 | [capaflow-inventory-section-19-of-24.md](capaflow-inventory-section-19-of-24.md) | 7162–7546 | 398 | A/2: _drawGuide continues |
| 20/24 | [capaflow-inventory-section-20-of-24.md](capaflow-inventory-section-20-of-24.md) | 7547–8005 | 472 | B/2: continued _drawGuide |
| 21/24 | [capaflow-inventory-section-21-of-24.md](capaflow-inventory-section-21-of-24.md) | 8006–8333 | 340 | Complete blocks |
| 22/24 | [capaflow-inventory-section-22-of-24.md](capaflow-inventory-section-22-of-24.md) | 8334–8768 | 447 | Complete blocks |
| 23/24 | [capaflow-inventory-section-23-of-24.md](capaflow-inventory-section-23-of-24.md) | 8769–9245 | 489 | Complete blocks |
| 24/24 | [capaflow-inventory-section-24-of-24.md](capaflow-inventory-section-24-of-24.md) | 9246–9347 | 114 | Complete blocks |
