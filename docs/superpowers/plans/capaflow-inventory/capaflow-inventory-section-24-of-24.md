# CapaFlow inventory — section 24 of 24

**Original inventory lines:** 9246–9347 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** CapaFlow technical inventory → 10. Edge cases handled and observed bugs.
**Previous:** [capaflow-inventory-section-23-of-24.md](capaflow-inventory-section-23-of-24.md). **Next:** none (last section).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
| Case | Actual handling, not an inferred requirement | Source lines |
|---|---|---|
| Unknown / falsy dictionary entry | `t(key)` returns the key itself, not the ES translation. Translation application skips falsy dictionary values. | L3409–3430 |
| Missing optional logo image element | `applyLogo` and `loadGateLogo` return without touching it. | L3473, L3674 |
| No stored logo | Removes `visible`; clears `src`; main logo restores fallback letter and tooltip. | L3481–3485, L3680–3683 |
| localStorage unavailable / quota error | Logo reads and writes catch exceptions; errors are not surfaced. | L3474–3487, L3497, L3675–3684 |
| No logo file selected | Upload returns immediately; successful selection resets the file input after starting a DataURL read so the same file can be selected again. | L3491–3503 |
| Reinitializing background animation | Cancels the previous animation frame when its handle is truthy; particle count is capped at180. | L3577, L3604–3605 |
| Frequent viewport resizing | Separate debounces schedule particle initialization after250ms and chart redraws through a different timeout property; chart handler only redraws the visible analysis. | L3658–3661, L8323–8331 |
| Incorrect password | Applies error class/key/text, empties the input and focuses it; correct password delays hiding the gate by1200ms. No server validation is involved. | L3687–3707 |
| Empty / nonnumeric input tokens | `parseFloat` results that are NaN are silently removed; the parser does not validate entire tokens. | L3735–3737 |
| Fewer than five parsed measurements | Alert and early return, before analysis creation. | L3827 |
| Neither specification bound parses numerically | Alert and early return. One valid bound is sufficient. | L3828–3834 |
| Only one specification bound | Cp/Pp/tolerance remain null; Cpk/Ppk use the available unilateral index; PPM uses one failing-tail expression. | L3833–3860 |
| Missing / nonnumeric target | Cpm stays null; there is no separate target validation message. | L3830, L3848–3849 |
| Empty / zero / unparsable subgroup input | `parseInt(...) \|\| 1` falls back to1; this is not a complete range check. | L3831 |
| Subgroup size1 | Within sigma uses successive moving ranges/1.128 rather than single-observation subgroup ranges. | L3748–3752 |
| Incomplete final subgroup | Excluded from range-based within sigma and `makeSubgroups`; overall statistics still use all original measurements. | L3756–3762, L3836–3837, L6940–6948 |
| Missing within-sigma d2 entry | Uses2.326, not interpolation. | L3754–3755 |
| SPC size not explicitly tabulated | Interpolates all eight fields between adjacent sizes; if no interval matches, returns the size25 entry. | L6887–6904 |
| AD logarithm near zero | Each probability passed to logarithm is lower-clamped at1e-10; final p-value is clamped to0…1 when finite. | L3784–3794 |
| Missing / NaN displayed metric | Main formatter prints em dash for null or NaN; Infinity is not excluded by this test. Integer formatter rounds before using the browser locale. | L3884–3885 |
| Gauge outside0…2 | Needle position clamps to0…2; this does not clamp the underlying numerical result or classification. | L4554, L4562–4564 |
| Missing selected analysis | Active-export setter and several chart/folder callbacks check for a result before updating it. | L4162–4171, L5362–5385, L5426–5445, L8327–8329 |
| No card supplied to collapse helper | Returns immediately. Expanded cards redraw their charts after480ms. | L4505–4530 |
| No photo / no dragged marker | Photo export returns without an image; marker-drop handler returns if drag identifier is null. | L4347, L4445 |
| Marker near photo boundary | Percentage coordinates clamp to3…97, preserving an inset from the edges. | L4349–4353 |
| Long mini-histogram point name | Removes trailing characters until measured width fits (or length reaches3); appends an ellipsis according to its separate comparison condition. | L5866–5874 |
| Too many rows for summary table | Computes bounded row height, displays `visibleOrder`, and records how many rows are clipped. This is deliberate row clipping, not the rejected column-width allegation below. | L5754–5759, L5829–5837 |
| Large project summary | Produces multiple pages for miniature histograms; photo and table receive the complete analysis order on every page. | L5460–5646, especially L5593–5599 |
| Fewer than two valid control-chart points | Drawing helper returns without drawing the remaining plot. Null points are removed while original index mapping is retained. | L7138–7140, L7340–7341 |
| Flat control-chart vertical extent | Adds fallback padding using center-line magnitude or a small constant. PNG version also substitutes finite fallback control limits. | L7144–7148, L7344–7350 |
| Converter dropped unsupported extension | Filters dropped files to `.mwx`, `.mwp`, `.mpx`, case-insensitively; if none survive, emits its warning log. | L8429–8441 |
| Missing archive sheet / zero columns | Throws explicit converter errors. | L8489–8503 |
| Empty converter queue / per-file conversion failure | Converter checks queue before work, processes files with per-file error handling, and restores button state; exact logs/messages are in sections3 and7. | L8451–8479 |
| ZIP resource cleanup | Revokes its generated object URL after2000ms. | L6019–6023 |

**Numbered observed bugs / preservation hazards**

1. **observed bug — duplicate dictionary properties.** Both languages repeat `panel.guideTitle` and `panel.guideSub`; the last declaration wins. There are202 declarations but200 effective keys per language. The section8 copy deliberately preserves both occurrences. [ES L3025–3026, L3141–3142; EN L3229–3230, L3345–3346]

2. **observed bug — gate identifies a different analysis domain.** `gate.subtitle` is `"Análisis Térmico"` / `"Thermal Analysis"`, whereas initial static gate markup, document title and header identify Six Sigma capability analysis. There is no unconditional startup translation pass: the gate subtitle changes domain after a language switch applies the dictionary. Do not normalize this away in an identity-preserving port. [L7, L2631, L2997, L3201, L3411–3442, L8613]

3. **observed bug — confidence setting is inert.** The numeric `confidence` field defaults to95 and permits80–99.9, but analysis never reads it. Normality classification remains `adTest.p >= 0.05`; Q-Q band expressions remain fixed. [L2875–2876, L3824–3868, L5024–5028, L6588–6593]

4. **observed bug — token parsing accepts numeric prefixes and Infinity, and comma is always a separator.** An isolated evaluation of the exact parser with `1.5 2abc Infinity nope 3,14` returned the values `1.5`, `2`, `Infinity`, `3`, `14`. Thus a decimal-comma token is two data points and partially numeric text need not be rejected. These are actual parsing rules, not proposed fixes. [L3735–3737]

5. **observed bug — specification-order validation is absent.** Any bounds that parse are accepted, including equal bounds or USL below LSL; tolerance and indices use the resulting zero or negative difference. No `USL > LSL` error message exists. [L3828–3847]

6. **observed bug — subgroup HTML bounds are not enforced by the analysis function.** The input declares1…25 but `runAnalysis` only applies `parseInt(...) || 1`. With five values and n=6, an isolated exact `withinSigma` evaluation returned NaN because no complete subgroup exists. A negative n makes the `i += n` loop progress away from its upper bound; that nonterminating case was identified statically and deliberately not executed. [L2872, L3831, L3756–3762]

7. **observed bug — constant / nonfinite data have no variance guard.** Five identical values satisfy the length gate; isolated evaluation gives sample sigma0 and Anderson-Darling p=NaN. Capability divisions and plot coordinate expressions can then receive zero deviations or nonfinite values. Infinity is also accepted by the parser. Main `fmt` suppresses NaN but not Infinity. [L3736, L3739–3743, L3781–3794, L3827, L3836–3860, L3884–3885]

8. **observed bug — two-sided PPM uses twice the nearer-tail probability.** The code first reduces the two unilateral indices to their minimum, then uses that single `3 * cpkV` in both tails. When the process is off-center this is not a calculation using the two distinct distances to the actual limits. The literal expression must remain unchanged for the requested port. [L3842–3847, L3853–3860]

9. **observed bug — Cmk is an alias, not an independently calculated machine index.** The entire assignment is `const Cmk = Cpk;`; no distinct machine-study variability calculation is performed for this displayed metric. This is an observed implementation limitation, not an instruction to invent another formula. [L3850, L4007]

10. **observed bug — generated collapse buttons also collapse their own button class.** Their inline `toggleCard(this)` toggles `collapsed` on the button, then event bubbling reaches the card header handler and toggles the actual card. Therefore it is incorrect to claim that the card never collapses: the odd behavior is the extra button-state mutation and double invocation. [L3896; generated header handlers L3934–4091; helper L4505–4530]

11. **observed bug — switching language does not fully regenerate existing results.** `applyTranslations` only handles tagged elements/attributes; `setLang` schedules control-chart redraws but does not rebuild saved result markup, interpretations, folder/photo labels or all existing statistical canvases. The final wrapper does update the header date, so the date must not be described as permanently stale. [L3411–3442, L3873–4160, L4375–4441, L5426–5445, L8604–8609]

12. **observed bug — some outputs ignore English mode.** Q-Q hover text uses literal Spanish `Punto`, `Observado`, `Teórico`, `Desviación`; analysis metadata uses literal `datos`; sigma-hover classifications remain Spanish; converter logs/errors and the converter remove-button title contain hardcoded Spanish. Exact strings are retained in the relevant literal blocks rather than translated speculatively. [L3904, L4140–4144, L5093, L8408, L8440, L8451–8583]

13. **observed bug — theme toggle does not redraw existing statistical canvases.** It updates the root attribute, switch/icon, particles and logos, but has no corresponding redraw pass for already-painted charts. Existing canvas pixels can therefore retain the former theme until another redraw event. [L3447–3456, L3726–3730; chart redraw path L8323–8331]

14. **observed bug — CSS variable color strings are passed to Canvas, and an alpha suffix is appended to a non-hex color.** `colorForCpk` returns strings such as `var(--accent-green)`. These are used directly for Canvas stroke/fill/shadow in gauge and photo export without resolving a computed CSS color. The tray also constructs a border value like `var(--accent-green)33`, which is not a valid hex-alpha or CSS-var color. Preserve source behavior; do not assume these strings are valid Canvas colors. [L3803–3807, L4410, L4463–4470, L4566–4571]

15. **observed bug — screen and PNG run charts do not represent the same window.** The screen uses only the last25 observations and their local median; the executive PNG uses all `r.data` and the full-data `r.med`, with different deviation/padding inputs. A long dataset can produce different plotted histories and center lines. [L4840–4862, L6502–6511]

16. **observed bug — screen and PNG Q-Q plots swap axis roles.** On screen X is observed and Y is theoretical; PNG X is theoretical and Y is observed. Their band construction also follows those respective orientations. They are not one reusable configuration with merely different dimensions. [L4990–5005, L5024–5031, L6575–6580, L6588–6593]

17. **observed bug — negative lower control limits are omitted from vertical extent candidates.** Screen extent uses `lcl > 0 ? lcl : 0`; PNG uses the same positive-only condition after a finite fallback. Negative data themselves remain in the candidate array, but a negative LCL below all data may lie outside the computed plot extent. This finding is about the lower limit, not a claim that all negative observations are discarded. [L7138–7148, L7340–7350]

18. **observed bug — WE rule2 can mark an in-band newest point.** If the preceding two points exceed2σ on one side, `viol.add(i)` executes unconditionally for the newest point. Isolated evaluation of `weViolations([2.1,2.2,0],0,1)` returned `[0,1,2]`, even though index2 is at the center line. [L6915–6923]

19. **observed bug — median-run reporting has a tie/expectation inconsistency.** `runs` starts at1 even for an all-median sequence; side changes only count nonzero sides, while `expectedRuns` is always `Math.round((2 * N - 1) / 3)` independently of the numbers above/below/equal to the median. Do not replace this with another runs-test formula under the guise of refactoring. [L4850–4856]

20. **observed bug — English unnamed mini-histograms acquire an unnecessary ellipsis.** The initial fallback is `Point ${posNum}` in English, but the post-truncation comparison always falls back to `Punto ${posNum}`. Thus English fallback names differ even if no characters were removed. [L5866–5874]

21. **observed bug — user-provided names are inserted as HTML without escaping.** Measurement names are interpolated into result, photo and folder `innerHTML`, and converter filenames into file-list `innerHTML`. Markup characters can be interpreted as DOM markup instead of preserved as literal name text. No sanitization is present on these rendering paths. [L3832, L3901–3904, L4432–4438, L5433–5443, L8402–8409]

22. **observed bug — multi-sheet converter only reads the first matching sheet.** Archive matching ends with `[0]`; other matching `sheet.json` entries are not selected, enumerated for the user or converted. This is a documented data-selection limitation, not evidence of a process-data spreadsheet importer. [L8488–8497]

23. **observed bug — executive PNG is not pixel-repeatable.** Its5000-grain background samples `Math.random()` for grayscale and coordinates on every render. Identical numerical inputs do not imply identical exported PNG bytes or pixels. [L6201–6207]

24. **observed bug — some number/time formatting follows the host locale rather than selected language.** Main integer formatting calls `toLocaleString()` without a locale and result timestamps call `toLocaleTimeString([],... )`; changing ES/EN does not select those locales. The header date, in contrast, explicitly uses `en-US` / `es-ES`. Matching a port requires preserving these distinctions and testing with a fixed environment. [L3885–3887, L8593–8601]

25. **observed bug — ZIP success can conceal missing reports.** Individual executive-PNG failures are caught and logged while iteration continues; comparative-summary failure is also caught without aborting ZIP creation. The success toast can therefore follow an archive missing one or more expected images. [L5991–6000, L6008–6024]

26. **observed bug — logo upload can report saved after storage failure.** `localStorage.setItem` exceptions are swallowed, yet `applyLogo()` and the `Logo guardado ✓` / `Logo saved ✓` toast still execute. A denied/quota-limited store need not have saved the uploaded image. [L3494–3499]

27. **observed bug — gauge tooltip misses the upper-right half.** For upper-right coordinates (`dx > 0`, `dy < 0`), `atan2` is between−π/2 and0, is not normalized by the `< -Math.PI / 2` branch, and yields a negative `normAngle`; no tooltip is shown for that plotted half. The within-radius-but-invalid-angle branch also does not call `hideTooltip()`, allowing previously visible tooltip content to linger. This is an angle-arithmetic observation, not a browser-pointer test. [L4581–4606]

28. **observed bug — English UI retains Spanish document language metadata.** `setLang` updates `data-lang`, language pills, tagged translations and control charts, but never updates the root `lang="es"` attribute. English mode therefore still advertises Spanish to language-aware browser/accessibility features. [L2, L3432–3442, L8604–8609]

29. **observed bug — logo storage destination follows the theme at read completion.** The file-read callback computes `LOGO_KEYS[currentTheme]` after the asynchronous read, rather than capturing the theme when upload started. A theme change during the read can store the image under the other theme's key. This is a source-derived timing hazard, not an executed race test. [L3490–3504, L3447–3456]

**Rejected allegation (not an observed bug):** the summary-table column widths total **804**, exactly matching the source comment's usable width `w - 16`; an earlier inspection hypothesis of832 was arithmetically wrong. No column-overflow defect is inferred from this sum. Actual row clipping remains documented separately above. [L5735–5748, L5754–5759]

**Verification and limits.** The input file's SHA-256 remained `8493D79C282A801324AA7B725A3803B497F7CFFC6A2101C3E51D9FD69406EFF8`. Dictionary declaration/key counts and literal blocks were checked against that snapshot. No React port, source correction, browser visual regression, CDN availability check, download operation, real conversion or access-gate bypass was performed. Selected exact utility probes established the parser, subgroup, constant-data and WE examples above; they are not a claim that the full application was browser-tested. [Inventory scope L1–8617; probed functions L3735–3807, L6907–6948]

**Summary:** **378 syntactic JavaScript function definitions** = **111 named declarations** (103 top-level +8 nested) + **265 arrow definitions** + **2 anonymous ordinary-function wrappers**; HTML event-handler attributes are catalogued separately and excluded from that syntactic total. **i18n:** 200 effective keys per language,400 language-qualified entries,404 source property declarations. **Observed bugs / preservation hazards:**29 numbered items. [Function definitions L3409–8609 and section2 function/callback index; dictionaries L2995–3404; findings1–29 above]
<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 24/24. Continue: none (last section).
