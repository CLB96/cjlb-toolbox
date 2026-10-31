# CapaFlow inventory — section 07 of 24

**Original inventory lines:** 2474–2929 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 4. Displayed results → Complete result-card composition.
**Previous:** [capaflow-inventory-section-06-of-24.md](capaflow-inventory-section-06-of-24.md). **Next:** [capaflow-inventory-section-08-of-24.md](capaflow-inventory-section-08-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Complete renderResults function — verbatim source [L3873–4160].**

```javascript
    function renderResults(r, name) {
      const idx = _analysisCounter++;
      _results[idx] = r;
      _lastResult = r;
      _ccTypes[idx] = 'auto';

      const cpkColor = r.Cpk !== null ? colorForCpk(r.Cpk) : 'var(--accent)';
      const cpkClass = r.Cpk !== null ? classifyCpk(r.Cpk) : { label: '—', cls: '' };
      const ppkClass = r.Ppk !== null ? classifyCpk(r.Ppk) : { label: '—', cls: '' };
      const cpClass = r.Cp !== null ? classifyCpk(r.Cp) : { label: t('classify.potential'), cls: '' };
      const sigmaBarW = r.sigLvl !== null ? Math.min(100, (r.sigLvl / 6) * 100) : 0;
      const fmt = (v, d = 3) => v !== null && !isNaN(v) ? v.toFixed(d) : '—';
      const fmtN = (v) => v !== null && !isNaN(v) ? Math.round(v).toLocaleString() : '—';
      const blockTitle = name || (currentLang === 'es' ? `Punto de Medición ${idx + 1}` : `Measurement Point ${idx + 1}`);
      const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      // Hide empty state, show clear button
      const emptyState = document.getElementById('emptyState');
      if (emptyState) emptyState.style.display = 'none';
      const clearBtn = document.getElementById('btnClearProject');
      if (clearBtn) clearBtn.classList.add('visible');

      const container = document.getElementById('analysesContainer');
      const CB = `<button class="collapse-btn" onclick="toggleCard(this)" title="${currentLang === 'es' ? 'Minimizar/Maximizar' : 'Collapse/Expand'}"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 3L5 7L9 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;

      const wrapper = document.createElement('div');
      wrapper.className = 'analysis-block';
      wrapper.dataset.analysisIdx = idx;
      wrapper.innerHTML = `
  <div class="analysis-block-header">
    <span class="analysis-block-title">⬡ ${blockTitle}</span>
    <span class="analysis-block-meta">${r.N} datos · ${timestamp}</span>
    <div class="analysis-block-actions">
      <button class="btn-analysis-action active-export" id="btnExportActive_${idx}" onclick="setActiveExport(${idx})" title="${currentLang === 'es' ? 'Usar para exportar PNG' : 'Use for PNG export'}">PNG</button>
      <button class="btn-analysis-action danger" onclick="deleteAnalysis(${idx})" title="${currentLang === 'es' ? 'Eliminar análisis' : 'Delete analysis'}">✕</button>
    </div>
  </div>
  <div class="analysis-block-body">

  <!-- KPI semaphore row -->
  <div class="grid-results">
    <div class="kpi-card" style="--kpi-color:${cpkColor}">
      <div class="kpi-label">Cpk <span class="info-tip" data-tip="${t('tip.cpk')}">?</span></div>
      <div class="kpi-value">${fmt(r.Cpk)}</div>
      <div class="kpi-badge ${cpkClass.cls}">${cpkClass.label}</div>
    </div>
    <div class="kpi-card" style="--kpi-color:${r.Cp !== null ? colorForCpk(r.Cp) : 'var(--accent)'}">
      <div class="kpi-label">Cp <span class="info-tip" data-tip="${t('tip.cp')}">?</span></div>
      <div class="kpi-value">${fmt(r.Cp)}</div>
      <div class="kpi-badge ${cpClass.cls}">${t('classify.potential')}</div>
    </div>
    <div class="kpi-card" style="--kpi-color:${r.Ppk !== null ? colorForCpk(r.Ppk) : 'var(--accent)'}">
      <div class="kpi-label">Ppk <span class="info-tip" data-tip="${t('tip.ppk')}">?</span></div>
      <div class="kpi-value">${fmt(r.Ppk)}</div>
      <div class="kpi-badge ${ppkClass.cls}">${ppkClass.label}</div>
    </div>
  </div>

  <!-- GAUGE + HISTOGRAM — collapsible -->
  <div class="grid-charts">
    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-title"><span class="dot-indicator" style="background:${cpkColor};box-shadow:0 0 8px ${cpkColor}"></span><span data-i18n="results.cpkTitle">${t('results.cpkTitle')}</span></div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <div class="gauge-container">
          <canvas id="gaugeCanvas_${idx}" width="280" height="158"></canvas>
          <div class="gauge-value-display">
            <div class="gauge-number" style="color:${cpkColor}">${fmt(r.Cpk)}</div>
            <div class="gauge-sub">Cpk · <span data-i18n="gauge.sigmaLevel">${t('gauge.sigmaLevel')}</span>: ${fmt(r.sigLvl, 2)}</div>
          </div>
          <div class="sigma-bar-container">
            <div class="sigma-bar-track" id="sigmaTrack_${idx}"><div class="sigma-bar-fill" id="sigmaBarFill_${idx}"></div></div>
            <div class="sigma-labels"><span>1σ</span><span>2σ</span><span>3σ</span><span>4σ</span><span>5σ</span><span>6σ</span></div>
          </div>
        </div>
      </div></div>
    </div>

    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-title"><span class="dot-indicator" style="background:var(--accent2);box-shadow:0 0 8px var(--accent2)"></span><span data-i18n="results.histTitle">${t('results.histTitle')}</span></div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <canvas id="histCanvas_${idx}" height="220"></canvas>
        <div class="normality-pill" style="background:${r.isNormal ? 'rgba(105,240,174,0.1)' : 'rgba(255,215,64,0.1)'};border:1px solid ${r.isNormal ? 'rgba(105,240,174,0.25)' : 'rgba(255,215,64,0.25)'}">
          <div class="np-dot" style="background:${r.isNormal ? 'var(--accent-green)' : 'var(--accent-yellow)'}"></div>
          <span style="font-size:0.7rem;font-family:'DM Mono',monospace;color:${r.isNormal ? 'var(--accent-green)' : 'var(--accent-yellow)'}">
            Anderson-Darling: p=${fmt(r.adTest.p, 4)} · ${r.isNormal ? t('png.normal') : t('png.notNormal')}
          </span>
        </div>
      </div></div>
    </div>
  </div>

  <!-- STATS + INDICES — collapsible -->
  <div class="grid-charts" style="margin-top:1.5rem">
    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-title"><span class="dot-indicator"></span><span data-i18n="results.statsTitle">${t('results.statsTitle')}</span></div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <table class="stats-table">
          <tr><td data-i18n="stats.n">${t('stats.n')}</td><td>${r.N}</td></tr>
          <tr><td data-i18n="stats.mean">${t('stats.mean')}</td><td>${fmt(r.xBar, 4)}</td></tr>
          <tr><td data-i18n="stats.median">${t('stats.median')}</td><td>${fmt(r.med, 4)}</td></tr>
          <tr><td data-i18n="stats.stdOverall">${t('stats.stdOverall')}</td><td>${fmt(r.sOverall, 4)}</td></tr>
          <tr><td data-i18n="stats.stdWithin">${t('stats.stdWithin')}</td><td>${fmt(r.sWithin, 4)}</td></tr>
          <tr><td data-i18n="stats.min">${t('stats.min')}</td><td>${fmt(r.minV, 4)}</td></tr>
          <tr><td data-i18n="stats.max">${t('stats.max')}</td><td>${fmt(r.maxV, 4)}</td></tr>
          <tr><td data-i18n="stats.range">${t('stats.range')}</td><td>${fmt(r.range, 4)}</td></tr>
          <tr><td data-i18n="stats.lsl">${t('stats.lsl')}</td><td>${r.hasLSL ? fmt(r.lsl, 3) : '—'}</td></tr>
          <tr><td data-i18n="stats.usl">${t('stats.usl')}</td><td>${r.hasUSL ? fmt(r.usl, 3) : '—'}</td></tr>
          ${!isNaN(r.targetVal) ? `<tr><td data-i18n="stats.target">${t('stats.target')}</td><td>${fmt(r.targetVal, 3)}</td></tr>` : ''}
        </table>
      </div></div>
    </div>

    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-title"><span class="dot-indicator" style="background:var(--accent-yellow);box-shadow:0 0 8px var(--accent-yellow)"></span>${t('results.indicesTitle')}</div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <div class="section-label">${t('results.capacity')}</div>
        <table class="stats-table">
          <tr><td>Cp</td><td>${fmt(r.Cp)}</td></tr>
          <tr><td>Cpk</td><td>${fmt(r.Cpk)}</td></tr>
          <tr><td>Cpu</td><td>${fmt(r.Cpu)}</td></tr>
          <tr><td>Cpl</td><td>${fmt(r.Cpl)}</td></tr>
          <tr><td>${t('idx.cpmLabel')}</td><td>${fmt(r.Cpm)}</td></tr>
          <tr><td>${t('idx.cmkLabel')}</td><td>${fmt(r.Cmk)}</td></tr>
        </table>
        <hr class="divider">
        <div class="section-label">${t('results.performance')}</div>
        <table class="stats-table">
          <tr><td>Pp</td><td>${fmt(r.Pp)}</td></tr>
          <tr><td>Ppk</td><td>${fmt(r.Ppk)}</td></tr>
          <tr><td>Ppu</td><td>${fmt(r.Ppu)}</td></tr>
          <tr><td>Ppl</td><td>${fmt(r.Ppl)}</td></tr>
        </table>
        <hr class="divider">
        <div class="ppm-display"><span class="ppm-label">${t('results.ppmCpk')}</span><span class="ppm-value" style="color:${cpkColor}">${fmtN(r.ppm)}</span></div>
        <div class="ppm-display"><span class="ppm-label">${t('results.ppmPpk')}</span><span class="ppm-value" style="color:${r.Ppk !== null ? colorForCpk(r.Ppk) : 'var(--accent)'}">${fmtN(r.ppmOverall)}</span></div>
      </div></div>
    </div>
  </div>

  <!-- INTERPRETATION — collapsible -->
  <div class="card" style="margin-top:1.5rem">
    <div class="card-header" onclick="toggleCard(this.parentElement)">
      <div class="card-title"><span class="dot-indicator" style="background:var(--accent-green);box-shadow:0 0 8px var(--accent-green)"></span>${t('results.interpretation')}</div>
      ${CB}
    </div>
    <div class="card-body"><div class="card-body-inner">
      <div class="interpretation" id="interpretationText_${idx}"></div>
    </div></div>
  </div>

  <!-- CONTROL CHARTS — collapsible -->
  <div class="cc-section" id="ccSection_${idx}">
    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="cc-header" style="flex:1;margin:0">
          <div class="cc-title-block">
            <span class="dot-indicator" style="background:var(--accent-orange);box-shadow:0 0 8px var(--accent-orange)"></span>
            <span class="card-title" style="margin:0">${t('cc.title')}</span>
          </div>
          <div class="cc-type-pills" onclick="event.stopPropagation()">
            <button class="cc-pill active" id="ccPillAuto_${idx}" onclick="setCCType('auto',${idx})">${t('cc.imr_full')} / ${t('cc.xbar_r')} / ${t('cc.xbar_s')}</button>
            <button class="cc-pill" id="ccPillImr_${idx}" onclick="setCCType('imr',${idx})">${t('cc.imr_full')}</button>
            <button class="cc-pill" id="ccPillXr_${idx}" onclick="setCCType('xr',${idx})">X̄-R</button>
            <button class="cc-pill" id="ccPillXs_${idx}" onclick="setCCType('xs',${idx})">X̄-S</button>
          </div>
        </div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <div class="cc-pair" id="ccPair_${idx}"></div>
        <div class="cc-note" id="ccNote_${idx}"></div>
      </div></div>
    </div>
  </div>

  <!-- RUN CHART — collapsible -->
  <div style="margin-top: 1.5rem;">
    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-title"><span class="dot-indicator" style="background:#a78bfa;box-shadow:0 0 8px #a78bfa"></span>${t('results.runChartTitle')}</div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <canvas id="runChartCanvas_${idx}" height="200" style="width: 100%; display: block;"></canvas>
        <div class="cc-note" id="runChartNote_${idx}"></div>
      </div></div>
    </div>
  </div>

  <!-- NORMAL PROBABILITY PLOT — collapsible -->
  <div style="margin-top: 1.5rem;">
    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-title"><span class="dot-indicator" style="background:#fb923c;box-shadow:0 0 8px #fb923c"></span>${t('results.qqTitle')}</div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <canvas id="qqCanvas_${idx}" height="200" style="width: 100%; display: block;"></canvas>
        <div class="cc-note" id="qqNote_${idx}"></div>
      </div></div>
    </div>
  </div>

  <!-- BOX PLOT — collapsible -->
  <div style="margin-top: 1.5rem;">
    <div class="card">
      <div class="card-header" onclick="toggleCard(this.parentElement)">
        <div class="card-title"><span class="dot-indicator" style="background:#8b5cf6;box-shadow:0 0 8px #8b5cf6"></span>${t('results.boxPlotTitle')}</div>
        ${CB}
      </div>
      <div class="card-body"><div class="card-body-inner">
        <canvas id="boxPlotCanvas_${idx}" height="340" style="width: 100%; display: block;"></canvas>
        <div class="cc-note" id="boxPlotNote_${idx}"></div>
      </div></div>
    </div>
  </div>

  </div>`; // end analysis-block-body

      container.prepend(wrapper);

      // ── Update carousel ──
      _analysisOrder.push(idx);                        // oldest→newest
      _carouselCurrent = _analysisOrder.length - 1;   // always show newest
      // Hide all previous blocks
      document.querySelectorAll('.analysis-block').forEach(block => {
        const bIdx = parseInt(block.dataset.analysisIdx);
        if (bIdx !== idx) block.classList.add('carousel-hidden');
        else block.classList.remove('carousel-hidden', 'barrel-enter-right', 'barrel-enter-left');
      });
      // Barrel-enter animation on first block too if there's >1
      if (_analysisOrder.length > 1) wrapper.classList.add('barrel-enter-right');
      updateCarouselUI();

      // ── Update project folder ──
      const badge = document.getElementById('folderBadge');
      if (badge) badge.textContent = _analysisOrder.length;
      if (_analysisOrder.length === 2) _showProjectFolder();
      if (_folderOpen) updateFolderContents();

      // ── Update photo widget ──
      if (_analysisOrder.length === 2) _showPhotoWidget();
      document.getElementById('photoBadge').textContent = _analysisOrder.length;
      if (_photoOpen) _refreshPhotoTray();

      setTimeout(() => {
        const fill = document.getElementById(`sigmaBarFill_${idx}`);
        if (fill) fill.style.width = sigmaBarW + '%';

        const track = document.getElementById(`sigmaTrack_${idx}`);
        if (track) {
          track.onmousemove = (e) => {
            const rect = track.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const sigmaValue = pct * 6;
            let classification = 'No Capaz';
            if (sigmaValue >= 5) classification = 'World Class';
            else if (sigmaValue >= 4) classification = 'Capaz';
            else if (sigmaValue >= 3) classification = 'Marginal';
            showTooltip(`${sigmaValue.toFixed(2)}σ\n${classification}`, e.clientX, e.clientY);
          };
          track.onmouseleave = hideTooltip;
        }
      }, 120);

      drawGauge(r.Cpk, cpkColor, idx);
      drawHistogram(r, idx);
      buildInterpretation(r, idx);
      setTimeout(() => drawControlCharts(r, 'auto', idx), 80);
      setTimeout(() => drawRunChart(r, idx), 120);
      setTimeout(() => drawQQPlot(r, idx), 160);
      setTimeout(() => drawBoxPlot(r, idx), 200);

      // Scroll results panel into view (top)
      setTimeout(() => document.getElementById('carouselNav')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 250);
    }
```

### Automatic interpretation: screen and export differ

Screen emits one Cpk class paragraph, optional centering when `Cp/Cpk > 1.15`, between-subgroup variation when `abs(Cpk-Ppk) > 0.15`, and nonnormality warning. Emoji/HTML emphasis and `<br><br>` are literal output; prose assertions are not all derived from stability/centering checks. [L4800–4824]

**Complete screen interpretation, exact ES/EN strings and conditions — verbatim source [L4800–4824].**

```javascript
    function buildInterpretation(r, idx) {
      const el = document.getElementById(idx !== undefined ? `interpretationText_${idx}` : 'interpretationText');
      if (!el) return;
      const lines = [];
      const es = currentLang === 'es';
      const cpk = r.Cpk;

      if (cpk !== null) {
        if (cpk >= 1.67) lines.push(es ? `✅ <strong>Proceso World Class.</strong> Tu Cpk de ${cpk.toFixed(3)} supera 1.67 — variación mínima, perfectamente centrado. Menos de 0.6 PPM esperados.` : `✅ <strong>World Class Process.</strong> Your Cpk of ${cpk.toFixed(3)} exceeds 1.67 — minimal variation, perfectly centered. Less than 0.6 PPM expected.`);
        else if (cpk >= 1.33) lines.push(es ? `✅ <strong>Proceso Capaz.</strong> Cpk de ${cpk.toFixed(3)} cumple el estándar Six Sigma (≥1.33). Proceso bajo control con buena capacidad.` : `✅ <strong>Capable Process.</strong> Cpk of ${cpk.toFixed(3)} meets the Six Sigma standard (≥1.33). Process under control with good capability.`);
        else if (cpk >= 1.00) lines.push(es ? `⚠️ <strong>Proceso Marginal.</strong> Cpk de ${cpk.toFixed(3)} entre 1.0 y 1.33 — el proceso produce defectos. Se recomienda mejora.` : `⚠️ <strong>Marginal Process.</strong> Cpk of ${cpk.toFixed(3)} between 1.0 and 1.33 — producing some defects. Improvement recommended.`);
        else lines.push(es ? `❌ <strong>Proceso No Capaz.</strong> Cpk de ${cpk.toFixed(3)} menor a 1.0. Produciendo defectos fuera de especificación. <strong>Acción correctiva urgente.</strong>` : `❌ <strong>Not Capable.</strong> Cpk of ${cpk.toFixed(3)} below 1.0. Producing out-of-spec defects. <strong>Urgent corrective action needed.</strong>`);
      }

      if (r.Cp !== null && cpk !== null && r.Cp / cpk > 1.15)
        lines.push(es ? `📍 <strong>Problema de centrado:</strong> Cp (${r.Cp.toFixed(3)}) > Cpk (${cpk.toFixed(3)}) — el proceso tiene potencial pero no está centrado. Ajustar la media hacia el target puede mejorar significativamente.` : `📍 <strong>Centering issue:</strong> Cp (${r.Cp.toFixed(3)}) > Cpk (${cpk.toFixed(3)}) — the process has potential but is off-center. Shifting the mean toward target may significantly improve capability.`);

      if (r.Ppk !== null && r.Cpk !== null && Math.abs(r.Cpk - r.Ppk) > 0.15)
        lines.push(es ? `📊 <strong>Variación entre subgrupos:</strong> Diferencia Cpk/Ppk (${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}) sugiere causas asignables (turnos, materiales, operadores). Investiga con gráficas de control.` : `📊 <strong>Between-subgroup variation:</strong> Cpk/Ppk gap (${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}) suggests assignable causes (shifts, materials, operators). Investigate with control charts.`);

      if (!r.isNormal)
        lines.push(es ? `🔔 <strong>Precaución — no normalidad:</strong> Anderson-Darling p=${r.adTest.p.toFixed(4)} sugiere distribución no normal. Los índices Cpk asumen normalidad. Considera transformación de datos o análisis no-paramétrico.` : `🔔 <strong>Non-normality warning:</strong> Anderson-Darling p=${r.adTest.p.toFixed(4)} suggests non-normal distribution. Cpk indices assume normality. Consider data transformation or non-parametric analysis.`);

      el.innerHTML = lines.join('<br><br>');
    }
```

Plain export returns an array, adds rounded PPM, has different wording/diacritics, adds `r.Cp > 0` to centering condition. Do not reuse one as byte-identical to the other. [L6849–6865]

**Complete plain-text exported interpretation — verbatim source [L6849–6865].**

```javascript
    function _buildInterpretationPlain(r, es) {
      const lines = [];
      const cpk = r.Cpk;
      if (cpk !== null) {
        if (cpk >= 1.67) lines.push(es ? `Proceso World Class. Cpk=${cpk.toFixed(3)} supera 1.67 — variacion minima, perfectamente centrado. PPM esperados: ${Math.round(r.ppm || 0)}.` : `World Class Process. Cpk=${cpk.toFixed(3)} exceeds 1.67 — minimal variation, perfectly centered. Expected PPM: ${Math.round(r.ppm || 0)}.`);
        else if (cpk >= 1.33) lines.push(es ? `Proceso Capaz. Cpk=${cpk.toFixed(3)} cumple el estandar Six Sigma (>= 1.33). Proceso bajo control con buena capacidad. PPM: ${Math.round(r.ppm || 0)}.` : `Capable Process. Cpk=${cpk.toFixed(3)} meets Six Sigma standard (>= 1.33). Process under control with good capability. PPM: ${Math.round(r.ppm || 0)}.`);
        else if (cpk >= 1.00) lines.push(es ? `Proceso Marginal. Cpk=${cpk.toFixed(3)} entre 1.0 y 1.33 — produce defectos. Accion de mejora recomendada. PPM: ${Math.round(r.ppm || 0)}.` : `Marginal Process. Cpk=${cpk.toFixed(3)} between 1.0 and 1.33 — producing some defects. Improvement action recommended. PPM: ${Math.round(r.ppm || 0)}.`);
        else lines.push(es ? `Proceso No Capaz. Cpk=${cpk.toFixed(3)} menor a 1.0. Produciendo defectos fuera de especificacion. Accion correctiva urgente requerida. PPM: ${Math.round(r.ppm || 0)}.` : `Not Capable. Cpk=${cpk.toFixed(3)} below 1.0. Producing out-of-spec defects. Urgent corrective action required. PPM: ${Math.round(r.ppm || 0)}.`);
      }
      if (r.Cp !== null && cpk !== null && r.Cp > 0 && r.Cp / cpk > 1.15)
        lines.push(es ? `Problema de centrado: Cp (${r.Cp.toFixed(3)}) es mayor que Cpk (${cpk.toFixed(3)}). El proceso tiene potencial pero no esta centrado en el target. Ajustar la media puede mejorar significativamente.` : `Centering issue: Cp (${r.Cp.toFixed(3)}) > Cpk (${cpk.toFixed(3)}). The process has potential but is off-center. Shifting the mean toward target may significantly improve capability.`);
      if (r.Ppk !== null && r.Cpk !== null && Math.abs(r.Cpk - r.Ppk) > 0.15)
        lines.push(es ? `Variacion entre subgrupos detectada: diferencia Cpk/Ppk = ${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}. Investiga causas asignables como turnos, cambios de material u operadores distintos.` : `Between-subgroup variation detected: Cpk/Ppk = ${r.Cpk.toFixed(3)} / ${r.Ppk.toFixed(3)}. Investigate assignable causes such as shifts, material changes, or different operators.`);
      if (!r.isNormal)
        lines.push(es ? `Precaucion — no normalidad: Anderson-Darling p=${r.adTest.p.toFixed(4)}. Los indices Cpk asumen distribucion normal. Considera una transformacion de datos o analisis no-parametrico.` : `Non-normality warning: Anderson-Darling p=${r.adTest.p.toFixed(4)}. Cpk indices assume normal distribution. Consider a data transformation or non-parametric analysis.`);
      return lines;
    }
```

### Chart-associated result boxes and control-chart cards

- Run note shows total and expected runs, not separate “runs above”/“runs below” despite dictionary keys. [L3160–3164, L3364–3368, L4914–4920]
- Q-Q note appends leading space plus `Anderson-Darling: p=` at4decimals. Box note string identical ES/EN; box mouse handlers disabled. [L5066–5068, L5323–5331]
- Each control-chart card shows label, count followed by `cc.subgroups` (even individuals), badge `.ooc`/`.ok`. Badge text=`⚠ `+count+` `+`cc.ooc`, else `✓ `+`cc.inControl`. Legends and note assignment exact below. [L7060–7115]

**Exact run-chart note — verbatim source [L4914–4920].**

```javascript
      // Stats note
      const noteEl = document.getElementById(idx !== undefined ? `runChartNote_${idx}` : 'runChartNote');
      if (noteEl) {
        const es = currentLang === 'es';
        noteEl.textContent = `${t('rc.runCount')}: ${runs} | ${t('rc.expected')}: ~${expectedRuns} | ` +
          (es ? `Variación aleatoria esperada si los datos son independientes (aprox. (2n-1)/3).` : `Random variation expected when data is independent (approx. (2n-1)/3).`);
      }
```


**Exact Q-Q note — verbatim source [L5066–5068].**

```javascript
      // AD result note
      const noteEl = document.getElementById(idx !== undefined ? `qqNote_${idx}` : 'qqNote');
      if (noteEl) noteEl.textContent = t('qq.qqNote') + ` Anderson-Darling: p=${r.adTest.p.toFixed(4)}`;
```


**Exact box note and disabled tooltip handlers — verbatim source [L5323–5331].**

```javascript
      // Nota
      const noteEl = document.getElementById(idx !== undefined ? `boxPlotNote_${idx}` : 'boxPlotNote');
      if (noteEl) noteEl.textContent = es
        ? `Q1=${Q1.toFixed(3)}, Q2=${Q2.toFixed(3)}, Q3=${Q3.toFixed(3)}, Outliers=${outliers.length}`
        : `Q1=${Q1.toFixed(3)}, Q2=${Q2.toFixed(3)}, Q3=${Q3.toFixed(3)}, Outliers=${outliers.length}`;
      
      // Tooltips deshabilitados por simplicidad en versión horizontal
      canvas.onmousemove = null;
      canvas.onmouseleave = null;
```


**Control-chart card composition, counts, legends and note — verbatim source [L7060–7115].**

```javascript
      // Build HTML
      const topOOC = topViol.length;
      const botOOC = botViol.length;
      const totalPts = topFiltered.length + botFiltered.length;
      const totalOOC = topOOC + botOOC;

      const CCB = `<button class="collapse-btn" onclick="toggleCard(this.closest('.cc-card'))" title="${currentLang === 'es' ? 'Minimizar/Maximizar' : 'Collapse/Expand'}"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 3L5 7L9 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;

      pair.innerHTML = `
    <div class="cc-card">
      <div class="card-header" onclick="toggleCard(this.closest('.cc-card'))">
        <div class="cc-card-title" style="margin:0;flex:1">
          <span>${topLabel}</span>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="cc-card-subtitle">${topFiltered.length} ${t('cc.subgroups')}</span>
            <span class="cc-ooc-badge ${topOOC > 0 ? 'ooc' : 'ok'}">
              ${topOOC > 0 ? '⚠ ' + topOOC + ' ' + t('cc.ooc') : '✓ ' + t('cc.inControl')}
            </span>
          </div>
        </div>
        ${CCB}
      </div>
      <div class="card-body"><div class="card-body-inner" style="padding-top:0.6rem">
        <canvas class="cc-canvas" id="ccTopCanvas_${idx}" height="180"></canvas>
        <div class="cc-legend">
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent)"></div><span>X̄ / CL</span></div>
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent-red);border-top:2px dashed var(--accent-red);height:0"></div><span>UCL / LCL</span></div>
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:rgba(255,215,64,0.7);border-top:2px dashed;height:0"></div><span>±2σ</span></div>
          <div class="cc-legend-item"><div class="cc-legend-dot" style="background:var(--accent-red)"></div><span>${t('cc.ooc')}</span></div>
        </div>
      </div></div>
    </div>
    <div class="cc-card">
      <div class="card-header" onclick="toggleCard(this.closest('.cc-card'))">
        <div class="cc-card-title" style="margin:0;flex:1">
          <span>${botLabel}</span>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="cc-card-subtitle">${botFiltered.length} ${t('cc.subgroups')}</span>
            <span class="cc-ooc-badge ${botOOC > 0 ? 'ooc' : 'ok'}">
              ${botOOC > 0 ? '⚠ ' + botOOC + ' ' + t('cc.ooc') : '✓ ' + t('cc.inControl')}
            </span>
          </div>
        </div>
        ${CCB}
      </div>
      <div class="card-body"><div class="card-body-inner" style="padding-top:0.6rem">
        <canvas class="cc-canvas" id="ccBotCanvas_${idx}" height="160"></canvas>
        <div class="cc-legend">
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent2)"></div><span>R̄ / S̄ / MR̄</span></div>
          <div class="cc-legend-item"><div class="cc-legend-line" style="background:var(--accent-red);border-top:2px dashed;height:0"></div><span>UCL</span></div>
          <div class="cc-legend-item"><div class="cc-legend-dot" style="background:var(--accent-red)"></div><span>${t('cc.ooc')}</span></div>
        </div>
      </div></div>
    </div>`;

      if (noteEl) noteEl.textContent = noteText;
```


<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 07/24. Continue: [capaflow-inventory-section-08-of-24.md](capaflow-inventory-section-08-of-24.md).
