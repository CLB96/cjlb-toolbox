# CapaFlow inventory — section 14 of 24

**Original inventory lines:** 5200–5668 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 6. Inputs / settings → Complete initial static HTML.
**Previous:** [capaflow-inventory-section-13-of-24.md](capaflow-inventory-section-13-of-24.md). **Next:** [capaflow-inventory-section-15-of-24.md](capaflow-inventory-section-15-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
```html
<body>

  <!-- ── PASSWORD GATE ── -->
  <div class="password-gate" id="passwordGate">
    <div class="password-card">
      <div class="password-logo-container">
        <img class="password-logo-img" id="gateLogo" src="" alt="Logo">
      </div>
      <h1 class="password-title">CapaFlow</h1>
      <p class="password-subtitle" data-i18n="gate.subtitle">Análisis de Capacidad Six Sigma</p>
      <p class="password-instruction" data-i18n="gate.instruction">Ingresa la contraseña para comenzar a usar esta
        aplicación.</p>
      <input type="password" class="password-input" id="passwordInput" placeholder="Contraseña de acceso"
        data-i18n-placeholder="gate.placeholder" autocomplete="off">
      <button class="password-btn" onclick="checkPassword()" data-i18n="gate.enter">Entrar</button>
      <div class="password-message" id="passwordMessage"></div>
      <p class="password-footer" data-i18n="gate.footer">Esta puerta de acceso protege la vista antes de comenzar.</p>
    </div>
  </div>

  <!-- ── BACKGROUND LAYERS ── -->
  <canvas id="bgCanvas"></canvas>
  <div class="bg-blobs">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>
  <div class="bg-grain"></div>

  <!-- Organic lines (light mode only, inspired by image 1) -->
  <div class="organic-line" style="inset:0;width:100%;height:100%">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-20,280 C80,200 200,380 340,300 S580,120 720,220 S960,380 1100,260 S1340,80 1460,180" stroke="#d4622a"
        stroke-width="1.5" fill="none" opacity="0.5" />
      <path d="M-20,520 C100,460 260,600 400,520 S680,340 820,450 S1080,600 1220,480 S1380,360 1460,420"
        stroke="#d4622a" stroke-width="1.2" fill="none" opacity="0.35" />
      <path d="M200,900 C280,780 180,640 300,560 S480,480 420,380 S360,200 500,140" stroke="#d4622a" stroke-width="1"
        fill="none" opacity="0.25" />
    </svg>
  </div>
  <!-- ── PANEL OVERLAY ── -->
  <div class="panel-overlay" id="panelOverlay"></div>

  <!-- ── SIDE PANEL ── -->
  <div class="side-panel" id="sidePanel">
    <div class="panel-block">
      <div class="panel-section-title" data-i18n="panel.appearance">Apariencia</div>
      <div class="toggle-row" onclick="toggleTheme()">
        <span class="toggle-label"><span class="icon" id="themeIcon">🌙</span> <span data-i18n="panel.darkMode">Modo
            Oscuro</span></span>
        <div class="switch" id="themeSwitch"></div>
      </div>
    </div>

    <div class="panel-block">
      <div class="panel-section-title" data-i18n="panel.language">Idioma</div>
      <div class="lang-pills">
        <div class="lang-pill active" id="pillES" onclick="setLang('es')">ES</div>
        <div class="lang-pill" id="pillEN" onclick="setLang('en')">EN</div>
      </div>
    </div>

    <div class="panel-block" style="margin-top:0.5rem">
      <div class="panel-section-title" data-i18n="panel.qref">Referencia Rápida</div>
      <table class="stats-table" style="font-size:0.72rem">
        <tr>
          <td>Cpk ≥ 1.67</td>
          <td style="color:var(--accent-green)" data-i18n="qref.worldClass">World Class</td>
        </tr>
        <tr>
          <td>Cpk ≥ 1.33</td>
          <td style="color:var(--accent-green)" data-i18n="qref.capable">Capaz</td>
        </tr>
        <tr>
          <td>Cpk ≥ 1.00</td>
          <td style="color:var(--accent-yellow)" data-i18n="qref.marginal">Marginal</td>
        </tr>
        <tr>
          <td>Cpk &lt; 1.00</td>
          <td style="color:var(--accent-red)" data-i18n="qref.notCapable">No Capaz</td>
        </tr>
      </table>
    </div>

    <div class="panel-block">
      <div class="panel-section-title" data-i18n="panel.export">Exportar</div>
      <button class="btn-export" id="btnExportPNG" onclick="generateExecutivePNG()">
        <span class="export-icon">⬇</span>
        <div>
          <div class="export-title" data-i18n="panel.exportTitle">Resumen Ejecutivo PNG</div>
          <div class="export-sub" data-i18n="panel.exportSub">Reporte listo para presentar</div>
        </div>
      </button>
      <button class="btn-export" id="btnExportGuide" onclick="generateReadingGuide()"
        style="margin-top:0.5rem;background:linear-gradient(135deg,rgba(105,240,174,0.1),rgba(74,222,128,0.06));border-color:rgba(105,240,174,0.22)">
        <span class="export-icon" style="background:var(--accent-green)">📖</span>
        <div>
          <div class="export-title" data-i18n="panel.guideTitle">Guía de Lectura</div>
          <div class="export-sub" data-i18n="panel.guideSub">Cómo leer un análisis Six Sigma</div>
        </div>
      </button>
      <button class="btn-export" id="btnMwxConverter" onclick="openMwxConverter()"
        style="margin-top:0.5rem;background:linear-gradient(135deg,rgba(255,215,64,0.1),rgba(255,152,0,0.06));border-color:rgba(255,215,64,0.22)">
        <span class="export-icon" style="background:var(--accent-yellow);color:#050d2a">🔄</span>
        <div>
          <div class="export-title" data-i18n="panel.mwxTitle">Conversor MWX/MWP/MPX → Excel</div>
          <div class="export-sub" data-i18n="panel.mwxSub">Rescata archivos Minitab legacy</div>
        </div>
      </button>
    </div>

    <div class="panel-footer">
      CapaFlow v1.0<br>
      <span data-i18n="panel.footer">Análisis estadístico en el navegador.<br>Sin servidores · Sin Minitab · 100%
        gratuito</span>
    </div>
  </div>

  <!-- ── TOAST ── -->
  <div class="toast" id="toast"></div>

  <!-- ── CHART TOOLTIP ── -->
  <div class="chart-tooltip" id="chartTooltip"></div>

  <!-- ── MWX CONVERTER MODAL ── -->
  <div class="mwx-modal-overlay" id="mwxModalOverlay">
    <div class="mwx-modal">
      <div class="mwx-modal-header">
        <div class="mwx-modal-title">
          <div class="mwx-modal-icon">🔄</div>
          <span>Conversor MWX/MWP/MPX → Excel</span>
        </div>
        <button class="mwx-close-btn" onclick="closeMwxConverter()">×</button>
      </div>

      <div class="mwx-dropzone" id="mwxDropzone">
        <div class="mwx-dropzone-icon">📁</div>
        <div class="mwx-dropzone-text" data-i18n="mwx.dropTitle">Arrastra archivos .MWX, .MWP o .MPX aquí</div>
        <div class="mwx-dropzone-sub" data-i18n="mwx.dropSub">o haz clic para seleccionar · Múltiples archivos
          permitidos</div>
        <input type="file" id="mwxFileInput" accept=".mwx,.MWX,.mwp,.MWP,.mpx,.MPX" multiple style="display:none">
      </div>

      <div class="mwx-file-list" id="mwxFileList" style="display:none"></div>

      <div class="mwx-actions">
        <button class="mwx-btn mwx-btn-secondary" onclick="clearMwxFiles()" data-i18n="mwx.clear">Limpiar Todo</button>
        <button class="mwx-btn mwx-btn-primary" id="mwxConvertBtn" onclick="convertMwxFiles()" disabled
          data-i18n="mwx.convert">
          Convertir a Excel
        </button>
      </div>

      <div class="mwx-log" id="mwxLog"></div>
    </div>
  </div>

  <!-- ── APP ── -->
  <div class="app">

    <!-- HEADER -->
    <header class="header">
      <div class="logo">
        <div class="logo-mark" id="logoMark" onclick="document.getElementById('logoFileInput').click()"
          title="Click to upload logo">
          <img class="logo-mark-img" id="logoImg" src="" alt="">
          <span class="logo-mark-letter" id="logoLetter">C</span>
          <div class="logo-upload-tip" id="logoUploadTip">Click<br>logo</div>
        </div>
        <!-- Hidden file input for logo upload -->
        <input type="file" id="logoFileInput" accept="image/*" style="display:none" onchange="handleLogoUpload(event)">
        <div>
          <div class="logo-text">CapaFlow</div>
          <div class="logo-sub" data-i18n="header.sub">Análisis de Capacidad Six Sigma</div>
        </div>
      </div>
      <div class="header-badge" id="headerBadge"></div>
      <button class="hamburger-btn" id="hamburgerBtn" aria-label="Menu">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </button>
    </header>

    <!-- MAIN GRID -->
    <div class="grid-main">

      <!-- ── LEFT: INPUT ── -->
      <div>
        <div class="card">
          <div class="card-header" onclick="toggleCard(this.parentElement)">
            <div class="card-title"><span class="dot-indicator"></span> <span data-i18n="form.title">Configuración del
                Proceso</span></div>
            <button class="collapse-btn" onclick="event.stopPropagation();toggleCard(this.closest('.card'))"
              title="Minimizar"><svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 3L5 7L9 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg></button>
          </div>
          <div class="card-body">
            <div class="card-body-inner">

              <div class="section-label" data-i18n="form.specs">Especificaciones</div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label"><span data-i18n="form.lsl">LSL — Límite Inferior</span> <span
                      class="info-tip" data-i18n-tip="tip.lsl">?</span></label>
                  <input class="form-input" id="lsl" type="number" data-i18n-placeholder="form.placeholder.lsl"
                    placeholder="Ej. 9.5" step="any">
                </div>
                <div class="form-group">
                  <label class="form-label"><span data-i18n="form.usl">USL — Límite Superior</span> <span
                      class="info-tip" data-i18n-tip="tip.usl">?</span></label>
                  <input class="form-input" id="usl" type="number" data-i18n-placeholder="form.placeholder.usl"
                    placeholder="Ej. 10.5" step="any">
                </div>
                <div class="form-group">
                  <label class="form-label"><span data-i18n="form.target">Target (Valor Nominal)</span> <span
                      class="info-tip" data-i18n-tip="tip.target">?</span></label>
                  <input class="form-input" id="target" type="number" data-i18n-placeholder="form.placeholder.target"
                    placeholder="Ej. 10.0 (opcional)" step="any">
                </div>
              </div>

              <hr class="divider">
              <div class="section-label" data-i18n="form.data">Datos del Proceso</div>
              <div class="form-group">
                <label class="form-label" data-i18n="form.dataLabel">Ingresa datos (separados por coma, espacio o salto
                  de línea)</label>
                <textarea class="form-input" id="dataInput" data-i18n-placeholder="form.placeholder.data"
                  placeholder="Ej: 9.8, 10.1, 9.95, 10.2, 9.7..."></textarea>
              </div>
              <button class="btn-secondary" onclick="loadSampleData()" data-i18n="form.sample">↓ Cargar datos de
                ejemplo</button>

              <hr class="divider">
              <div class="section-label" data-i18n="form.pointSection">Punto de Medición</div>
              <div class="form-group">
                <label class="form-label" data-i18n="form.pointLabel">Nombre del punto / característica</label>
                <input class="point-name-input" id="pointName" type="text"
                  data-i18n-placeholder="form.placeholder.pointName"
                  placeholder="Ej: Diámetro eje A, Espesor lámina 3…">
              </div>

              <hr class="divider">
              <div class="section-label" data-i18n="form.advanced">Opciones Avanzadas</div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label"><span data-i18n="form.subgroup">Subgrupo</span> <span class="info-tip"
                      data-i18n-tip="tip.subgroup">?</span></label>
                  <input class="form-input" id="subgroupSize" type="number" value="1" min="1" max="25">
                </div>
                <div class="form-group">
                  <label class="form-label"><span data-i18n="form.confidence">Confianza (%)</span></label>
                  <input class="form-input" id="confidence" type="number" value="95" min="80" max="99.9" step="0.1">
                </div>
              </div>

              <button class="btn-primary" onclick="runAnalysis()">
                ▶ <span data-i18n="form.calculate">Calcular Capacidad</span>
              </button>
              <button class="btn-clear-project" id="btnClearProject" onclick="clearProject()" data-i18n="form.clearProject">
                ✕ Limpiar Proyecto
              </button>
            </div>
          </div><!-- /card-body -->
        </div>
      </div>

      <!-- ── RIGHT: RESULTS ── -->
      <div id="resultsPanel">
        <div id="emptyState" class="empty-state card">
          <div class="icon">⬡</div>
          <p data-i18n="empty.hint">Ingresa tus especificaciones y datos del proceso,<br>luego presiona <strong
              style="color:var(--accent)">Calcular Capacidad</strong></p>
        </div>

        <!-- Carousel Navigation -->
        <div id="carouselNav">
          <button class="carousel-arrow" onclick="prevAnalysis()" title="Análisis anterior">&#8592;</button>
          <div class="carousel-info">
            <span class="carousel-name" id="carouselName"></span>
            <span class="carousel-counter" id="carouselCounter"></span>
          </div>
          <button class="carousel-arrow" onclick="nextAnalysis()" title="Análisis siguiente">&#8594;</button>
        </div>

        <div id="analysesContainer"></div>
      </div>

    </div>
  </div><!-- /app -->

  <!-- ══ PHOTO WIDGET ══ -->
  <div class="photo-widget" id="photoWidget">
    <!-- body expands to the LEFT when open -->
    <div class="photo-body">
      <div class="photo-panel-inner">
        <div class="photo-section-title" data-i18n="photo.title">📷 Plano de Medición</div>

        <!-- Upload zone (visible until photo loaded) -->
        <div class="photo-upload-zone" id="photoUploadZone"
             onclick="document.getElementById('photoFileInput').click()"
             ondragover="handlePhotoFileDragOver(event)"
             ondrop="handlePhotoFileDrop(event)">
          <div class="photo-upload-icon">📷</div>
          <div>Arrastra una fotografía o haz click para cargar</div>
          <div style="font-size:0.65rem;margin-top:0.3rem;color:var(--text-tertiary)">PNG, JPG, WEBP</div>
          <input type="file" id="photoFileInput" accept="image/*" style="display:none"
                 onchange="handlePhotoUpload(event)">
        </div>

        <!-- Photo with marker overlay (hidden until photo loaded) -->
        <div class="photo-container" id="photoContainer" style="display:none"
             ondragover="handlePhotoDragOver(event)"
             ondrop="handlePhotoMarkerDrop(event)"
             ondragleave="handlePhotoDragLeave(event)">
          <img id="photoImg" src="" alt="Plano">
          <div id="photoMarkersLayer"></div>
        </div>

        <!-- Change photo link -->
        <div id="photoChangeLink" style="display:none;text-align:center">
          <span style="font-family:'DM Mono',monospace;font-size:0.68rem;color:var(--text-tertiary);cursor:pointer"
                onclick="document.getElementById('photoFileInput').click()">
            <span data-i18n="photo.change">↺ Cambiar fotografía</span>
          </span>
        </div>

        <!-- Marker tray -->
        <div id="photoMarkerTray" class="photo-marker-tray" style="display:none"></div>

        <!-- Export button -->
        <button class="btn-export-photo" id="btnExportPhoto" onclick="exportPhotoWithMarkers()" data-i18n="photo.exportBtn">
          ⬇ Exportar Plano PNG
        </button>
      </div>
    </div>
    <!-- Tab on the right edge -->
    <div class="photo-tab" onclick="togglePhotoWidget()">
      <span style="writing-mode:vertical-rl;text-orientation:mixed;letter-spacing:.06em" data-i18n="photo.tab">📷 PLANO</span>
      <span class="photo-badge" id="photoBadge">0</span>
    </div>
  </div>

  <!-- ══ PROJECT FOLDER WIDGET ══ -->
  <div class="project-folder-widget" id="projectFolderWidget">
    <div class="folder-tab" onclick="toggleProjectFolder()">
      <span style="writing-mode:vertical-rl;text-orientation:mixed;letter-spacing:.06em" data-i18n="folder.tab">📁 PROYECTO</span>
      <span class="folder-badge" id="folderBadge">0</span>
    </div>
    <div class="folder-body">
      <div class="folder-inner">
        <div class="folder-section-title" data-i18n="folder.title">⬡ Proyecto CapaFlow</div>
        <input class="folder-name-input" id="folderNameInput"
          data-i18n-placeholder="folder.namePlaceholder"
          placeholder="Nombre del proyecto…"
          oninput="updateFolderTabName(this.value)">
        <div id="folderAnalysisList" class="folder-analysis-list"></div>
        <button class="btn-summary" id="btnGenerateSummary" onclick="generateComparativeSummary()" data-i18n="summary.genBtn">
          📊 Generar Resumen
        </button>
        <button class="btn-download-zip" id="btnDownloadZip" onclick="generateProjectZip()" data-i18n="folder.downloadZip">
          ⬇ Descargar Proyecto (ZIP)
        </button>
      </div>
    </div>
  </div>

```

## 7. Exports / sharing

Export is local browser download via temporary `<a>` elements. Image exports use newly rendered native canvases and `toDataURL('image/png', 1.0)`, not DOM screenshots or Chart.js plugins. ZIP uses JSZip3.10.1; MWX/MWP/MPX conversion uses JSZip plus SheetJS/XLSX0.18.5. No PDF, process-measurement CSV/JSON/Excel export, print action, clipboard export, hosted share link or Web Share API implementation exists. XLSX is exclusively converter output, not an export of `_results`. A `capaflow.app` string drawn in artwork is footer text, not a generated share URL. [L11–12, L4444–4502, L5460–6846, L7328–7453, L7459–8321, L8451–8583; full-file inspection L1–8617]

| Entry point / format | Exact composition and dimensions | Filename / library / behavior | Source lines |
|---|---|---|---|
| `exportPhotoWithMarkers()` / PNG | Natural image width×height. Original image plus placed markers in `_analysisOrder`, ordinal, point-name label pill, glow, white outline. Radius max20/min(imageW,imageH)×0.028; dimensions and text sizing use source formulas below. No data means silent return. | ``CapaFlow_Plano_${new Date().toISOString().slice(0,10)}.png``. Canvas2D+Image; PNG quality argument1.0. ES `✓ Plano exportado`; EN `✓ Drawing exported`. | L4444–4502 |
| `generateComparativeSummary(returnURLs=false)` / one or more PNGs | 2400×1440 landscape per page; header68/footer32/pad40/gap16; left photo+table width820, right grid4 columns. Balanced pages, max24 analyses/page; photo47% of content height; near-square mini-hist cells. Every page repeats the full-order photo and table; only the histogram grid is paginated. Global ordinal is shown in mini-hists. | ``CapaFlow_Resumen${pages > 1 ? `_Pag${i + 1}` : ''}.png`` (Spanish base even in EN). Download starts600ms apart. `returnURLs=true` returns DataURL array instead of downloads and bypasses summary-button updates. JS only, async image load and yields. | L5460–5646 |
| `_summaryDrawPhoto` / comparative-summary component | Fits image to card; placeholder when absent/failed image; placed markers rendered within fitted-image coordinate system. | Uses palette-specific Cpk colors and marker radius13–20; exact labels via `summary.*`. | L5649–5722 |
| `_summaryDrawTable` / comparative-summary component | Fixed column widths for `#`, point, N, mean, sigma-within, sigma-overall, Cp,Cpk,Pp,Ppk,sigma-level; row height16–30 and clipped visible subset. | Formats source values through summary `fmt`, caps/truncates names, uses Cpk-based cell colors; source copied below. | L5725–5838 |
| `_summaryDrawMiniHist` / comparative-summary component | Header point ordinal/name/Cpk; all observation values into mini-hist bins, normal curve, spec/mean lines, footer/labels; fallback for <2 data. | Separate renderer from on-screen histogram, own pad/bin scaling/font sizes. | L5841–5969 |
| `generateProjectZip()` / ZIP | Root folder named from project field. One PNG per retained analysis in creation order plus comparative summary page(s). Does not include raw measurements, editable JSON, source image, separate photo PNG, guide PNG or original converter files. | `${folderName}.zip`; folder name sanitizes `/[^a-zA-Z0-9_\-. ]/g`; default `CapaFlow_Proyecto`. Individual filename ``${String(pos + 1).padStart(2, '0')}_${rawPointName}.png``; summaries `00_Resumen_Comparativo.png` or `00_Resumen_Comparativo_Pag${i + 1}.png`. JSZip `DEFLATE`, blob URL revoked after2000ms. | L5971–6032 |
| `generateExecutivePNG()` → `_drawPNG(r,returnURL=false)` / PNG | Width1600; dynamically computed height. Header/name/banner, KPI cards, sigma progress, gauge+histogram, capability/performance/statistics tables, wrapped interpretation, two control charts, run+Q-Q, box plot, footer. Padding48, gap20, row38. Every palette/layout/font/text is in full source below. | ``CapaFlow_${currentLang === 'es' ? 'Resumen' : 'Report'}_${new Date().toISOString().slice(0, 10)}.png``. Uses active `_lastResult`; delayed80ms and button disabled during generation. `returnURL=true` returns DataURL for ZIP without downloading/toast. | L6034–6499 |
| `_pngRunChart`, `_pngQQPlot`, `_pngBoxPlot`, `_pngGauge2`, `_pngHistogram2`, `_pngCCChart` / report components | Render from result values and palette into supplied report rectangles; independent scaling from screen. `_buildCCData` in section2A supplies report limits/WE violations. | No hover handlers or individual downloads. All formulas/ticks/labels/dashes/colors below. | L6502–6846, L7328–7453 |
| `generateReadingGuide()` → `_drawGuide()` / PNG | 1600×6000 working canvas; final bitmap1600×min(Y,6000) after educational sections. Includes fixed examples, index explanations, capability thresholds, control charts, histogram, distribution comparisons, run chart,Q-Q,box plot, explanatory callouts and footer. Not an analysis-result export. | ``CapaFlow_${es ? 'Guia_Lectura' : 'Reading_Guide'}_${new Date().toISOString().slice(0, 10)}.png``. Delayed80ms; errors only console-logged. | L7459–7970 |
| `_drawGuideRunChart`, `_drawGuideQQPlot`, `_drawGuideBoxPlot`, `_drawGuideHistogram`, `_drawGuideCCChart`, `_drawGuideDistComp` | Fixed illustrative data/shapes, axes/labels and palettes. `_wrapText` measures font/string widths for guide prose; returns lines without changing text. | No independent file. Every example value and literal explanatory ES/EN string is retained below. | L7973–8321 |
| `convertMwxFiles()` → `convertSingleMwxFile(file)` / XLSX | Reads selected MWX/MWP/MPX as ZIP, first matching `sheets/.../sheet.json`; one worksheet, headers from columns, numeric values preferred to text, shorter columns blank-padded, calculated widths first100values/cap30, sheet title truncated31chars; chart/analysis content not converted. | Filename `file.name.replace(/\.(mwx\|mwp\|mpx)$/i, '.xlsx')`; one download/input, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; `XLSX.write(...,{ bookType: 'xlsx', type: 'array' })`. Blob URL revoked immediately after click. This does not load measurements into CapaFlow. | L8451–8583 |

**Export units and date/number formatting.** PNG pixel dimensions above are literal bitmap sizes, not physical paper sizes/DPI. Export filename date uses UTC `toISOString().slice(0, 10)` (photo omits the space after the comma in its source). Report, summary and guide display a separately localized local date, with `'es-MX'` or `'en-US'` and `{ year: 'numeric', month: 'long', day: 'numeric' }`; this can differ from the UTC filename date near midnight. Default-locale `toLocaleString()` is used for report rounded counts; locale is not tied to `currentLang` there. Exact expressions remain in source below. [L4496, L5539–5542, L6076–6080, L6260–6265, L6495, L7951–7952, L7966]

**Observed bugs / export discrepancies (not corrected).** Photo-export Cpk color can be a CSS `var(...)` string returned by `colorForCpk`, which Canvas2D does not resolve as a CSS custom property; summary uses a separate concrete palette. Executive PNG noise uses `Math.random()` and is therefore not pixel-repeatable. English unnamed mini-hists append an ellipsis because comparison uses Spanish fallback. ZIP swallows per-analysis/summary generation exceptions and can still report a successful but incomplete ZIP. These are source-level observations; no browser execution was performed. [L3803–3807, L4463–4470, L5471–5496, L5868–5873, L5993–6000, L6008–6017, L6024, L6201–6207]


**Dictionary-backed chart/export labels used by the following source blocks.** Raw string literals are shown rather than translated or normalized; full objects, including duplicates, are in section 8. [L2995–3404]

| Key | ES literal | EN literal | Call-site line |
|---|---|---|---|
| `summary.generating` | `"⏳ Generando…"` [L3195] | `"⏳ Generating…"` [L3399] | L5468 |
| `summary.subtitle` | `"Resumen Comparativo de Capacidad de Proceso"` [L3184] | `"Comparative Process Capability Summary"` [L3388] | L5578 |
| `summary.page` | `"Página"` [L3186] | `"Page"` [L3390] | L5585 |
| `summary.page.of` | `"de"` [L3197] | `"of"` [L3401] | L5585 |
| `summary.project` | `"Proyecto:"` [L3185] | `"Project:"` [L3389] | L5589 |
| `summary.footer` | `"CapaFlow · Análisis Sixpack de Capacidad de Proceso"` [L3193] | `"CapaFlow · Six Sigma Process Capability Sixpack"` [L3397] | L5619 |
| `summary.genBtn` | `"📊 Generar Resumen"` [L3194] | `"📊 Generate Summary"` [L3398] | L5628 |
| `summary.done` | `"✓ Resumen generado"` [L3196] | `"✓ Summary generated"` [L3400] | L5643 |
| `summary.photoTitle` | `"PLANO / FOTOGRAFÍA DE PIEZA"` [L3187] | `"MEASUREMENT PLAN / PART PHOTO"` [L3391] | L5662 |
| `summary.noPhoto` | `"Sin fotografía cargada"` [L3188] | `"No photo loaded"` [L3392] | L5676 |
| `summary.noPhotoSub` | `"Carga una imagen en el widget de plano"` [L3189] | `"Load an image in the measurement plan widget"` [L3393] | L5678 |
| `summary.colPoint` | `"Punto"` [L3191] | `"Point"` [L3395] | L5738 |
| `summary.colMean` | `"Media"` [L3192] | `"Mean"` [L3396] | L5740 |
| `summary.tableTitle` | `"TABLA COMPARATIVA"` [L3190] | `"COMPARATIVE TABLE"` [L3394] | L5764 |
| `folder.downloadZip` | `"⬇ Descargar Proyecto (ZIP)"` [L3183] | `"⬇ Download Project (ZIP)"` [L3387] | L6031 |
| `toast.noData` | `"Sin datos para exportar"` [L3145] | `"No data to export"` [L3349] | L6035 |
| `toast.generating` | `"Generando PNG..."` [L3143] | `"Generating PNG..."` [L3347] | L6036 |
| `png.n` | `"Datos (n)"` [L3095] | `"Data points (n)"` [L3299] | L6121 |
| `png.mean` | `"Media (x̄)"` [L3096] | `"Mean (x̄)"` [L3300] | L6122 |
| `png.median` | `"Mediana"` [L3097] | `"Median"` [L3301] | L6123 |
| `png.stdOverall` | `"StdDev Overall"` [L3098] | `"StdDev Overall"` [L3302] | L6124 |
| `png.stdWithin` | `"StdDev Within"` [L3099] | `"StdDev Within"` [L3303] | L6125 |
| `png.min` | `"Mínimo"` [L3100] | `"Minimum"` [L3304] | L6126 |
| `png.max` | `"Máximo"` [L3101] | `"Maximum"` [L3305] | L6127 |
| `png.range` | `"Rango"` [L3102] | `"Range"` [L3306] | L6128 |
| `png.lsl` | `"Límite Inf (LSL)"` [L3103] | `"Lower Spec (LSL)"` [L3307] | L6129 |
| `png.usl` | `"Límite Sup (USL)"` [L3104] | `"Upper Spec (USL)"` [L3308] | L6130 |
| `png.target` | `"Target"` [L3105] | `"Target"` [L3309] | L6132 |
| `png.subtitle` | `"Análisis de Capacidad de Proceso · Six Sigma"` [L3092] | `"Process Capability Analysis · Six Sigma"` [L3296] | L6258 |
| `png.generatedBy` | `"Generado por CapaFlow"` [L3093] | `"Generated by CapaFlow"` [L3297] | L6264 |
| `png.title` | `"RESUMEN EJECUTIVO"` [L3091] | `"EXECUTIVE SUMMARY"` [L3295] | L6272 |
| `classify.potential` | `"Potencial"` [L3047] | `"Potential"` [L3251] | L6280 |
| `png.sigmaLevel` | `"Nivel Sigma"` [L3119] | `"Sigma Level"` [L3323] | L6314 |
| `png.ppmCpk` | `"PPM vía Cpk"` [L3113] | `"PPM via Cpk"` [L3317] | L6323 |
| `png.ppmPpk` | `"PPM vía Ppk"` [L3114] | `"PPM via Ppk"` [L3318] | L6324 |
| `png.gauge` | `"ÍNDICE Cpk"` [L3109] | `"Cpk INDEX"` [L3313] | L6355 |
| `png.histogram` | `"HISTOGRAMA Y DISTRIBUCIÓN NORMAL"` [L3108] | `"HISTOGRAM & NORMAL DISTRIBUTION"` [L3312] | L6360 |
| `png.capacity` | `"CAPACIDAD (Within σ)"` [L3106] | `"CAPABILITY (Within σ)"` [L3310] | L6372 |
| `png.performance` | `"DESEMPEÑO (Overall σ)"` [L3107] | `"PERFORMANCE (Overall σ)"` [L3311] | L6378 |
| `png.stats` | `"ESTADÍSTICAS"` [L3111] | `"STATISTICS"` [L3315] | L6385 |
| `png.adTest` | `"Anderson-Darling"` [L3116] | `"Anderson-Darling"` [L3320] | L6394 |
| `png.normal` | `"Distribución Normal ✓"` [L3117] | `"Normal Distribution ✓"` [L3321] | L6394 |
| `png.notNormal` | `"Posible No-Normalidad"` [L3118] | `"Possible Non-Normality"` [L3322] | L6394 |
| `png.interpretation` | `"INTERPRETACIÓN"` [L3110] | `"INTERPRETATION"` [L3314] | L6411 |
| `cc.title` | `"Gráficas de Control"` [L3048] | `"Control Charts"` [L3252] | L6437 |
| `png.runChart` | `"GRÁFICA DE CORRIDA"` [L3169] | `"RUN CHART"` [L3373] | L6464 |
| `png.qqPlot` | `"PROBABILIDAD NORMAL (Q-Q)"` [L3170] | `"NORMAL PROBABILITY (Q-Q)"` [L3374] | L6470 |
| `png.boxPlot` | `"DIAGRAMA DE CAJA (BOX PLOT)"` [L3171] | `"BOX PLOT"` [L3375] | L6479 |
| `png.footNote` | `"Este reporte fue generado automáticamente por CapaFlow. Los índices Cp/Cpk asumen distribución normal."` [L3127] | `"This report was automatically generated by CapaFlow. Cp/Cpk indices assume normal distribution."` [L3331] | L6488 |
| `toast.ready` | `"¡PNG descargado!"` [L3144] | `"PNG downloaded!"` [L3348] | L6498 |
| `png.ccOOC` | `"Fuera de control"` [L3125] | `"Out of control"` [L3329] | L7358 |
| `png.ccInControl` | `"Bajo control"` [L3124] | `"In control"` [L3328] | L7358 |
| `cc.cl` | `"LC"` [L3056] | `"CL"` [L3260] | L7448 |

**Export error, status and library behavior.** Exact user-visible expressions are copied, including strings that do not have an EN branch. `t(...)` strings are indexed in the preceding table and fully preserved in section8. Other thrown ZIP/JSON/SheetJS exceptions are not reworded by this file; their `.message` is interpolated as shown below. [L5460–5468, L5633–5645, L5971–6043, L7459–7464, L8451–8583]

| Context | Exact expression(s) / behavior | Source lines |
|---|---|---|
| No comparative data | `showToast('No hay análisis para resumir')` only when not returning URLs; returns `[]` or `null`. | L5461–5464 |
| ZIP initial status | `es ? '⏳ Generando PNGs…' : '⏳ Generating PNGs…'`; `es ? 'Generando proyecto ZIP…' : 'Generating project ZIP…'`,8000ms. | L5976–5977 |
| ZIP progress/summary | `` `⏳ ${pos + 1} / ${_analysisOrder.length}` ``; `es ? '⏳ Generando resumen…' : '⏳ Generating summary…'`. | L6003, L6007 |
| ZIP success/error | ``es ? `✓ Proyecto "${folderName}" descargado` : `✓ Project "${folderName}" downloaded` ``; `showToast('Error: ' + e.message)`. Per-item errors only console-log. | L5999, L6017, L6024–6027 |
| Executive PNG | No-data `t('toast.noData')`; generation `t('toast.generating')`,4000ms; error `showToast('Error: ' + e.message)`; success `t('toast.ready')`. | L6035–6040, L6498 |
| Reading guide | `currentLang === 'es' ? 'Generando guía...' : 'Generating guide...'`,4000ms; success `es ? '¡Guía descargada!' : 'Guide downloaded!'`; failure console only. | L7460–7462, L7969 |
| Converter missing JSON | `throw new Error('No se encontró sheet.json en el archivo (verifica que sea un MWX/MWP/MPX válido)')`. No EN alternative. | L8491–8493 |
| Converter no columns | `throw new Error('No se encontraron columnas de datos')`. No EN alternative. | L8502–8504 |
| Converter logs | Spanish hardcoded processing/error/success/warning expressions, copied in full functions below. Row/column counts and filenames interpolated literally. | L8457–8475, L8506, L8533, L8567, L8582 |

**Definitive export implementations.** Blocks are source slices, not rewritten pseudocode. This preserves line layout, spaces, all ES/EN explanatory guide prose, nested helpers and every numeric constant. No ellipsis replaces any implementation. [L4444–4502, L5460–6846, L7328–7453, L7459–8321, L8451–8583]

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 14/24. Continue: [capaflow-inventory-section-15-of-24.md](capaflow-inventory-section-15-of-24.md).
