# CapaFlow inventory — section 13 of 24

**Original inventory lines:** 5053–5199 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 6. Inputs / settings → Exact static input markup.
**Previous:** [capaflow-inventory-section-12-of-24.md](capaflow-inventory-section-12-of-24.md). **Next:** [capaflow-inventory-section-14-of-24.md](capaflow-inventory-section-14-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Complete process input controls — verbatim source [L2824–2885].**

```html
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
```


**Photo picker — verbatim source [L2930–2931].**

```html
          <input type="file" id="photoFileInput" accept="image/*" style="display:none"
                 onchange="handlePhotoUpload(event)">
```


**Project name input — verbatim source [L2976–2979].**

```html
        <input class="folder-name-input" id="folderNameInput"
          data-i18n-placeholder="folder.namePlaceholder"
          placeholder="Nombre del proyecto…"
          oninput="updateFolderTabName(this.value)">
```

### Persistence and resets

| API / key | Stored value / JSON shape | Read timing | Write timing | Source lines |
|---|---|---|---|---|
| localStorage `capaflow_logo_dark` | Plain FileReader DataURL string, **not JSON** | applyLogo/loadGateLogo on startup/theme change when dark | Logo reader callback when current theme dark | L3466–3507, L3669–3685, L3723–3730 |
| localStorage `capaflow_logo_light` | Same plain DataURL | Same functions when light | Same callback when light | L3466–3504, L3669–3685 |
| sessionStorage | No keys/access | None | None | Full file L1–8617 |
| Other saved app state | None: no persisted theme/language/unlock/measurements/results/photo/markers/project/chart selection | In-memory defaults | No writes | L3406–3407, L4268–4272, L5347–5357; full file L1–8617 |

- `clearProject` resets generated results/carousel/folder/photo UI/state, not measurement/specification/name/confidence inputs, folderNameInput, logos, language/theme or converter queue. Photo-drop coordinate variables also remain. Exact reset boundary below. [L4225–4263]
- Deleting last result resets analysis counter and hides widgets, but does not wholesale clear photo source/markers or `_ccTypes`. IDs can be reused after counter reset; clearProject explicitly resets chart-type object. [L4173–4223, L4225–4237]

**Complete project reset implementation — verbatim source [L4225–4263].**

```javascript
    function clearProject() {
      _results = {};
      _ccTypes = {};
      _lastResult = null;
      _analysisCounter = 0;
      _analysisOrder = [];
      _carouselCurrent = 0;
      _folderOpen = false;
      // Reset photo widget state
      _photoOpen = false;
      _photoMarkers = {};
      _photoImageSrc = null;
      _draggedMarkerIdx = null;
      document.getElementById('analysesContainer').innerHTML = '';
      const emptyState = document.getElementById('emptyState');
      if (emptyState) emptyState.style.display = '';
      const clearBtn = document.getElementById('btnClearProject');
      if (clearBtn) clearBtn.classList.remove('visible');
      const fw = document.getElementById('projectFolderWidget');
      if (fw) fw.classList.remove('pf-visible', 'pf-open');
      const pw = document.getElementById('photoWidget');
      if (pw) pw.classList.remove('pw-visible', 'pw-open');
      // Reset photo UI
      const zone = document.getElementById('photoUploadZone');
      if (zone) zone.style.display = '';
      const container = document.getElementById('photoContainer');
      if (container) container.style.display = 'none';
      const tray = document.getElementById('photoMarkerTray');
      if (tray) { tray.style.display = 'none'; tray.innerHTML = ''; }
      const changeLink = document.getElementById('photoChangeLink');
      if (changeLink) changeLink.style.display = 'none';
      const exportBtn = document.getElementById('btnExportPhoto');
      if (exportBtn) exportBtn.classList.remove('visible');
      const layer = document.getElementById('photoMarkersLayer');
      if (layer) layer.innerHTML = '';
      const img = document.getElementById('photoImg');
      if (img) img.src = '';
      updateCarouselUI();
    }
```



### Complete initial static HTML

This full literal preserves initial visible text, unnamed controls, inline event attributes, dimensions, placeholders, disabled/hidden states, classes and data-i18n attributes before any language switch. Initial Spanish markup is not assumed identical to dictionary-generated text. It is body markup only; the credential declaration is outside this range and is not copied. [L2622–2990]

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 13/24. Continue: [capaflow-inventory-section-14-of-24.md](capaflow-inventory-section-14-of-24.md).
