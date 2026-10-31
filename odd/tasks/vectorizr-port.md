# vectorizr-port
Objective: port VectoriZr (../Digitalizacion) as the last tab of the CJLB Toolbox v2, with the approved improvements.
Branch: claude/inspiring-keller-47a8d3 · Delivery: ask-on-risk (no push/publish without asking) · Runner: Vitest (`cd v2 && npx vitest run`), `npx tsc --noEmit`, `npm run build`.

## Specs

- **S1 Faithful port.** Results identical to the original unless an improvement below is approved; labels copied verbatim from `../Digitalizacion/src` (owner rule). Reference: `docs/vectorizr-inventario.md`, `docs/vectorizr-plan.md`. The copy inside v2 becomes the official source.
- **S2 Bilingual.** Owner: "Me parece bien, tienes razon faltaba el inglés para que tambien tenga ambas opciones." ES texts verbatim; EN texts = the proposal in `docs/vectorizr-inventario.md` §7; uses the toolbox ES/EN selector.
- **S3 Design.** Nebulosa glass, day/night, per the approved mockup (`v2/legacy-fixtures/private/mockups/vectorizr.html`, "Después"): toolbox tab, stepper with visible labels, side glass panel, canvas stays dark-neutral in both themes, "📖 Manual de usuario" and history buttons, no hamburger menu, no PWA.
- **S4 Persistence.** `usePersistentTool` per plan §4 (normalized image as JPEG Blob; no undo history, zoom, pan).
- **S5 OpenCV + CSP.** opencv.js served from `v2/public/vendor/opencv/opencv-806cb564.js` (byte-identical copy), loaded lazily in a classic worker; page CSP unchanged; only the worker and opencv.js responses get `'unsafe-eval' 'wasm-unsafe-eval'` (plan §3).
- **S6 Improvements.** Owner: "Todo menos rotar el dxf." → apply M1, M3–M13, M15–M19 from plan §9; **M2 (DXF Y flip) is NOT applied**. M20–M24 (section C) are out of scope.
- **S7 Large PDF.** Owner: "Usar un A0 o una donde quepa completo la pieza" → PDF at 1:1 on the smallest ISO A sheet (A4, A3, A2, A1, A0; portrait or landscape) where the whole drawing plus 15 mm margins fits; if it does not fit on A0, a custom page of exactly drawing + margins. Never clip.
- **S8 Tests.** ~100 essential tests; differential tests against verbatim legacy copies in `v2/legacy-fixtures/vectorizr/`; golden detection with the real opencv.js in Vitest.

## Shared contract (both writers)

`v2/src/tools/vectorizr/types.ts` (parent-owned; legacy types + `DetectionMethod`, `DetectParams`, `ImagePoint`, `OpencvStatus`).

Writer A provides, writer B consumes (all under `v2/src/tools/vectorizr/`):
- `logic/scale.ts`: `unitToMm(value, unit)`, `computeScaleFactor(p1, p2, realValue, unit): number`, `pxToMm(px, f)`.
- `logic/imageNormalize.ts`: `MAX_SIZE`, `clampDimensions(...)` (legacy signature), `normalizeImage(img: HTMLImageElement): Promise<{ image: HTMLImageElement; blob: Blob; width: number; height: number }>` (JPEG 0.92, white background, M6), `loadImageFromBlob(blob: Blob): Promise<HTMLImageElement>`.
- `logic/contourPath.ts`: `buildPath(pts, closed = true): string` (verbatim), `flattenContour(pts, closed = true): ImagePoint[]` (curve-sampled polyline, M3).
- `logic/exportDxf.ts` / `logic/exportSvg.ts`: `pointsToDxf|pointsToSvg(active, scaleFactor, extraPaths = []): string`; `downloadDxf|downloadSvg(active, scaleFactor, extraPaths = [], filename = 'vectorizr.dxf'|'vectorizr.svg'): void`.
- `logic/exportPdf.ts`: `downloadPdf(active, scaleFactor, extraPaths = [], filename = 'vectorizr.pdf'): Promise<void>` (jsPDF imported dynamically).
- `worker/useOpencv.ts`: `useOpencv(): { status: OpencvStatus; error: string | null; detect(imageData: ImageData, params: DetectParams): Promise<ImagePoint[]> }` — lazy singleton client; `detect` queues until ready and rejects on worker error.
- `worker/opencvClient.ts`: `preloadOpencv(): void`, `disposeOpencvClient(): void`.

## Tasks

| ID | Specs | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | S5 | inline | done | deps konva 9.3.22, react-konva 18.2.16, jspdf 4.2.1; opencv copy; `.gitattributes` |
| T2 | S1 S5 S6 S7 S8 | delegated (writer A, parallel) | done | 324c49c; 74 tests RED→GREEN |
| T3 | S1 S2 S3 S4 S6 S8 | delegated (writer B, parallel) | done | e8b3780; 41 tests |
| T4 | all | inline | done | full suite 86 files/605 passed; tsc OK; build OK; browser harness with vercel.json headers: steps 1-4, DXF/SVG/PDF (A0 landscape), EN + light, restore after reload |
| T5 | all | verifier | done | all S1-S8 PASS, 0 blockers; assess risk high, RDD off (no review) |
| T6 | S5 | owner | pending | publish: verify on a Vercel preview with `curl -I` that the opencv/worker paths get only the worker CSP |

Route evidence: T2 and T3 are independent units with disjoint edit surfaces, each far heavier than starting a subagent, launched together (Writer trigger a).

## Log

- L1 (2026-10-31) Original request: "Prepara en una sesión aparte todo lo que necesitaremos para integrar vectorizr."
- L2 (2026-10-31) Preparation delivered: commit d4de86a (inventory + plan), mockup sent. Spike: OpenCV needs `'unsafe-eval'` only inside the worker.
- L3 (2026-10-31) Owner: "Me parece bien, tienes razon faltaba el inglés para que tambien tenga ambas opciones."
- L4 (2026-10-31) Owner on improvements: "Todo menos rotar el dxf." On large PDF: "Usar un A0 o una donde quepa completo la pieza".
- L5 (2026-10-31) Browser check found 3 integration defects, fixed with RED→GREEN tests: blob URL revoked before `<img>` used it (step 2 blank); worker CSP blocked the embedded wasm (`connect-src 'self' data:`); Permissions-Policy `camera=()` blocked "📷 Tomar foto" → `camera=(self)`.
- L6 (2026-10-31) Independent verifier: S1-S8 PASS, no blockers. Advisories: Vercel duplicate-CSP behaviour unverified (check on preview); undo history empty after restore (by design §4); unrequested `errExport` text; manual EN not in the approved inventory table.
- L7 Next step: owner decides publishing (nothing pushed).
