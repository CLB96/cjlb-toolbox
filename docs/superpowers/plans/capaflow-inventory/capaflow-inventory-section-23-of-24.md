# CapaFlow inventory — section 23 of 24

**Original inventory lines:** 8769–9245 of 9347. Source `index.html` citations inside the content are unchanged.
**Context:** 9. Theme / language / menu / login / storage → Theme.
**Previous:** [capaflow-inventory-section-22-of-24.md](capaflow-inventory-section-22-of-24.md). **Next:** [capaflow-inventory-section-24-of-24.md](capaflow-inventory-section-24-of-24.md).

**Boundary status:** complete original Markdown blocks; no code block, table or prose paragraph is split at either boundary.

<!-- ORIGINAL-CONTENT-BEGIN -->
**Complete root/dark/light theme tokens — verbatim source [L17–71].**

```css
    :root {
      --transition-theme: 0.55s cubic-bezier(0.4, 0, 0.2, 1);
    }

    [data-theme="dark"] {
      --bg-base: #050d2a;
      --bg-surface: rgba(255, 255, 255, 0.055);
      --bg-surface2: rgba(255, 255, 255, 0.09);
      --glass-border: rgba(255, 255, 255, 0.13);
      --glass-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
      --text-primary: rgba(255, 255, 255, 0.95);
      --text-secondary: rgba(255, 255, 255, 0.5);
      --text-tertiary: rgba(255, 255, 255, 0.28);
      --accent: #00E5FF;
      --accent2: #4FC3F7;
      --accent-green: #69F0AE;
      --accent-yellow: #FFD740;
      --accent-red: #FF5252;
      --accent-orange: #FF7043;
      --blur-amount: blur(20px);
      --particle-color-a: 79, 195, 247;
      --particle-color-b: 0, 229, 255;
      --particle-color-c: 105, 240, 174;
      --glow-primary: rgba(0, 229, 255, 0.18);
      --input-bg: rgba(255, 255, 255, 0.06);
      --input-border: rgba(255, 255, 255, 0.12);
      --divider: rgba(255, 255, 255, 0.08);
      --tag-bg: rgba(255, 255, 255, 0.07);
    }

    [data-theme="light"] {
      --bg-base: #dde2ea;
      --bg-surface: rgba(255, 255, 255, 0.60);
      --bg-surface2: rgba(255, 255, 255, 0.80);
      --glass-border: rgba(255, 255, 255, 0.75);
      --glass-shadow: 0 8px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      --text-primary: #1a2340;
      --text-secondary: #4a5580;
      --text-tertiary: #8a95b0;
      --accent: #0077cc;
      --accent2: #2196F3;
      --accent-green: #1b8a52;
      --accent-yellow: #c17f00;
      --accent-red: #d32f2f;
      --accent-orange: #e64a19;
      --blur-amount: blur(24px);
      --particle-color-a: 100, 140, 200;
      --particle-color-b: 70, 120, 190;
      --particle-color-c: 180, 200, 220;
      --glow-primary: rgba(0, 119, 204, 0.08);
      --input-bg: rgba(255, 255, 255, 0.7);
      --input-border: rgba(30, 60, 120, 0.18);
      --divider: rgba(30, 60, 120, 0.1);
      --tag-bg: rgba(30, 60, 120, 0.07);
    }
```


**Original theme toggle and initial switch state — verbatim source [L3447–3459].**

```javascript
    function toggleTheme() {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      const sw = document.getElementById('themeSwitch');
      const ic = document.getElementById('themeIcon');
      sw.classList.toggle('on', currentTheme === 'dark');
      ic.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
      initParticles();
      applyLogo(); // swap logo for new theme
    }

    // Init theme switch state
    document.getElementById('themeSwitch').classList.add('on');
```


**Theme wrapper retaining original function — verbatim source [L3725–3730].**

```javascript
    // Override toggleTheme to also update gate logo
    const originalToggleTheme = toggleTheme;
    toggleTheme = function () {
      originalToggleTheme();
      loadGateLogo();
    };
```

### Language

- `t(key)` returns `TRANSLATIONS[currentLang][key] || key`, so missing/falsy values fall back to key. No arbitrary language validation; UI pills only pass es/en. [L3409, L2679–2680]
- applyTranslations writes truthy dictionary values through innerHTML for data-i18n, data-tip for data-i18n-tip, placeholder for data-i18n-placeholder. Does not translate arbitrary text, title, aria-label, canvas pixels. [L3411–3430]
- setLang writes state/data-lang/active pills, applies tagged translations, schedules all stored results' CC redraw after80ms using remembered type. Wrapper then updates header date. No stored preference. [L3432–3442, L8604–8609]
- No unconditional startup applyTranslations call; static Spanish HTML stays until language switch, while date badge initialized directly. **observed bug:** initial gate subtitle names capability analysis, but dictionary applied after switch changes it to ES `Análisis Térmico` / EN `Thermal Analysis`, a different domain. [L2631, L2997, L3201, L3437, L8613; full script L2991–8614]
- Header date uses local current date, two-digit day/long month/numeric year; en-US for English else es-ES; exact innerHTML prefix `V1.0 &middot; `. Runs at script end and language switch, not periodic/midnight timer. [L8593–8613]

**Exact translation lookup — verbatim source [L3409–3409].**

```javascript
    function t(key) { return TRANSLATIONS[currentLang][key] || key; }
```


**Translation application and original language setter — verbatim source [L3411–3442].**

```javascript
    function applyTranslations() {
      // Standard innerHTML keys
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = TRANSLATIONS[currentLang][key];
        if (val) el.innerHTML = val;
      });
      // Tooltip data-tip attributes
      document.querySelectorAll('[data-i18n-tip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tip');
        const val = TRANSLATIONS[currentLang][key];
        if (val) el.setAttribute('data-tip', val);
      });
      // Placeholder attributes
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = TRANSLATIONS[currentLang][key];
        if (val) el.placeholder = val;
      });
    }

    function setLang(lang) {
      currentLang = lang;
      document.documentElement.setAttribute('data-lang', lang);
      document.getElementById('pillES').classList.toggle('active', lang === 'es');
      document.getElementById('pillEN').classList.toggle('active', lang === 'en');
      applyTranslations();
      // Redraw control charts in all analyses when language changes
      Object.entries(_results).forEach(([idxStr, r]) => {
        if (r) setTimeout(() => drawControlCharts(r, _ccTypes[parseInt(idxStr)] || 'auto', parseInt(idxStr)), 80);
      });
    }
```


**Date formatting, setLang wrapper and startup update — verbatim source [L8593–8613].**

```javascript
    function updateHeaderDate() {
      const badge = document.getElementById('headerBadge');
      if (badge) {
        const today = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        const dateStr = today.toLocaleDateString(typeof currentLang !== 'undefined' && currentLang === 'en' ? 'en-US' : 'es-ES', options);
        badge.innerHTML = `V1.0 &middot; ${dateStr}`;
      }
    }
    
    // Interceptar setLang para actualizar la fecha si cambia el idioma
    if (typeof setLang === 'function') {
      const originalSetLang = setLang;
      setLang = function(lang) {
        originalSetLang(lang);
        updateHeaderDate();
      };
    }
    
    // Inicializar fecha
    updateHeaderDate();
```

### Menu, panels and modal

- Hamburger toggles sidePanel.open then synchronizes button/overlay open classes. Overlay click removes all three. No Escape handler/focus trap/keyboard-navigation controller/route-history integration. [L3512–3526; full script L2991–8614]
- Sidebar contains appearance/language, fixed Cpk quick reference, executive PNG, guide and converter controls; branding `CapaFlow v1.0` is static. Full exact markup below includes all labels and actions. [L2665–2738]
- Converter open adds mwxModalOverlay.open and closes sidebar. Close removes open then clears queue/count/list/log/picker and disables convert. Backdrop click closes only when target.id matches overlay exactly. [L8345–8364, L8585–8590]
- Photo/project are independent widgets shown on second analysis; pw-open/pf-open manage expansion and opening refreshes lists. Complete controls/reset boundary section6. [L4122–4128, L4274–4286, L5406–5420]

**Hamburger listeners and closePanel — verbatim source [L3512–3526].**

```javascript
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidePanel = document.getElementById('sidePanel');
    const panelOverlay = document.getElementById('panelOverlay');

    hamburgerBtn.addEventListener('click', () => {
      const open = sidePanel.classList.toggle('open');
      hamburgerBtn.classList.toggle('open', open);
      panelOverlay.classList.toggle('open', open);
    });
    panelOverlay.addEventListener('click', closePanel);
    function closePanel() {
      sidePanel.classList.remove('open');
      hamburgerBtn.classList.remove('open');
      panelOverlay.classList.remove('open');
    }
```


**Complete sidebar and quick-reference markup — verbatim source [L2665–2738].**

```html
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
```


**Converter open/close/clear — verbatim source [L8345–8364].**

```javascript
    function openMwxConverter() {
      document.getElementById('mwxModalOverlay').classList.add('open');
      closePanel(); // Cierra el panel lateral
    }

    function closeMwxConverter() {
      document.getElementById('mwxModalOverlay').classList.remove('open');
      clearMwxFiles();
    }

    function clearMwxFiles() {
      mwxFiles = [];
      mwxProcessedCount = 0;
      document.getElementById('mwxFileList').style.display = 'none';
      document.getElementById('mwxFileList').innerHTML = '';
      document.getElementById('mwxConvertBtn').disabled = true;
      document.getElementById('mwxLog').classList.remove('visible');
      document.getElementById('mwxLog').innerHTML = '';
      document.getElementById('mwxFileInput').value = '';
    }
```


**Converter backdrop handler — verbatim source [L8585–8590].**

```javascript
    // Click outside modal to close
    document.getElementById('mwxModalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'mwxModalOverlay') {
        closeMwxConverter();
      }
    });
```

### Password / lock screen (password deliberately omitted)

- Credential is hardcoded in client-side `CORRECT_PASSWORD` declaration at **L3668**; value deliberately never copied. This is a visual front-end gate, not server authentication: app/source/libraries delivered before unlock. No remote login, account model, hashing, credential/session storage, attempt counter, rate limiter or relock timer. [L11–12, L2625–2640, L3668, L3687–3720; full file L1–8617]
- Submit reads exact input.value, no trim/case conversion, compares `password === CORRECT_PASSWORD`. Success sets `password-message visible success`, data-i18n gate.success, localized text, schedules passwordGate.hidden after1200ms. Failure sets visible error, gate.error/text, clears/focuses input. No persisted unlocked flag. [L3687–3707]
- window.checkPassword exposes onclick handler; DOMContentLoaded registers keypress on field and submits when key Enter. Gate logo reads startup/theme changes. [L3710–3730]

| Gate key | ES exact string | EN exact string | Source lines |
|---|---|---|---|
| gate.instruction | Ingresa la contraseña para comenzar a usar esta aplicación. | Enter the password to start using this application. | L2998, L3202 |
| gate.placeholder | Contraseña de acceso | Access password | L2999, L3203 |
| gate.enter | Entrar | Enter | L3000, L3204 |
| gate.footer | Esta puerta de acceso protege la vista antes de comenzar. | This access gate protects the view before starting. | L3001, L3205 |
| gate.success | Gracias por usar la app | Thanks for using the app | L3002, L3206 |
| gate.error | Contraseña incorrecta, por favor ingresa la contraseña correcta | Incorrect password, please enter the correct password | L3003, L3207 |

Only handlers are copied below, never credential declaration. [L3687–3720]

**Complete password check and Enter listener, credential declaration excluded — verbatim source [L3687–3720].**

```javascript
    function checkPassword() {
      const input = document.getElementById('passwordInput');
      const message = document.getElementById('passwordMessage');
      const password = input.value;

      if (password === CORRECT_PASSWORD) {
        message.className = 'password-message visible success';
        message.setAttribute('data-i18n', 'gate.success');
        message.textContent = TRANSLATIONS[currentLang]['gate.success'];

        setTimeout(() => {
          document.getElementById('passwordGate').classList.add('hidden');
        }, 1200);
      } else {
        message.className = 'password-message visible error';
        message.setAttribute('data-i18n', 'gate.error');
        message.textContent = TRANSLATIONS[currentLang]['gate.error'];
        input.value = '';
        input.focus();
      }
    }

    // Exponer checkPassword al scope global para onclick
    window.checkPassword = checkPassword;

    // Allow Enter key to submit password
    document.addEventListener('DOMContentLoaded', () => {
      const pwdInput = document.getElementById('passwordInput');
      if (pwdInput) {
        pwdInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') checkPassword();
        });
      }
    });
```


**Gate success/error styles — verbatim source [L247–257].**

```css
    .password-message.success {
      background: rgba(105, 240, 174, 0.15);
      border: 1px solid rgba(105, 240, 174, 0.3);
      color: var(--accent-green);
    }

    .password-message.error {
      background: rgba(255, 82, 82, 0.15);
      border: 1px solid rgba(255, 82, 82, 0.3);
      color: var(--accent-red);
    }
```

### Logos and complete persistent-storage inventory

| Key | API / exact stored shape | Read sites / triggers | Write sites / triggers | Source lines |
|---|---|---|---|---|
| `capaflow_logo_dark` | localStorage plain FileReader DataURL string, no JSON | applyLogo using LOGO_KEYS; loadGateLogo using GATE_LOGO_KEYS, startup/theme changes when dark | handleLogoUpload onload using callback-time currentTheme | L3466–3507, L3669–3685, L3723–3730 |
| `capaflow_logo_light` | Same DataURL-string shape | Same functions when light | Same callback when light | L3466–3504, L3669–3685 |
| sessionStorage / other localStorage keys | None | None | None | Full file L1–8617 |

- Header logo toggles logoImg.visible, logoLetter display, logoUploadTip. Stored-logo tip ES `Click<br>cambiar`/EN `Click<br>change`; missing-logo tip `Click<br>logo` in both. Missing value clears image, falls back to C; gate has no letter fallback. [L2787–2789, L3468–3487, L3671–3685]
- Upload reads first-file DataURL, attempts storage, reapplies header, shows ES `Logo guardado ✓`/EN `Logo saved ✓`, clears picker. It does not call loadGateLogo in upload callback; gate updates through separate paths. [L2792, L3490–3504, L3723–3730]
- **observed bug:** storage failure swallowed yet success toast still shown. Async theme change before FileReader completion can save logo to callback-time theme rather than selection-time theme. No fix made. [L3490–3504]
- Measurements/results/chart choice/photo/markers/name/project are runtime-only; downloads do not implement reloadable project browser persistence. No service worker, IndexedDB, cookie or server-sync implementation. [L4268–4272, L5347–5357, L5971–6032; full file L1–8617]

**Header logo key/read/upload/startup implementation — verbatim source [L3466–3507].**

```javascript
    const LOGO_KEYS = { dark: 'capaflow_logo_dark', light: 'capaflow_logo_light' };

    function applyLogo() {
      const key = LOGO_KEYS[currentTheme];
      const img = document.getElementById('logoImg');
      const letter = document.getElementById('logoLetter');
      const tip = document.getElementById('logoUploadTip');
      if (!img) return;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          img.src = stored;
          img.classList.add('visible');
          if (letter) letter.style.display = 'none';
          if (tip) tip.innerHTML = currentLang === 'es' ? 'Click<br>cambiar' : 'Click<br>change';
        } else {
          img.classList.remove('visible');
          img.src = '';
          if (letter) letter.style.display = '';
          if (tip) tip.innerHTML = currentLang === 'es' ? 'Click<br>logo' : 'Click<br>logo';
        }
      } catch (e) { /* localStorage unavailable */ }
    }

    function handleLogoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const b64 = e.target.result;
        const key = LOGO_KEYS[currentTheme];
        try { localStorage.setItem(key, b64); } catch (e) { }
        applyLogo();
        showToast(currentLang === 'es' ? 'Logo guardado ✓' : 'Logo saved ✓');
      };
      reader.readAsDataURL(file);
      // Reset input so same file can be re-selected
      event.target.value = '';
    }

    // Apply logo on load
    applyLogo();
```


**Gate logo key/reader; password declaration excluded — verbatim source [L3669–3685].**

```javascript
    const GATE_LOGO_KEYS = { dark: 'capaflow_logo_dark', light: 'capaflow_logo_light' };

    function loadGateLogo() {
      const key = GATE_LOGO_KEYS[currentTheme];
      const img = document.getElementById('gateLogo');
      if (!img) return;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          img.src = stored;
          img.classList.add('visible');
        } else {
          img.classList.remove('visible');
          img.src = '';
        }
      } catch (e) { /* localStorage unavailable */ }
    }
```

## 10. Edge cases handled and observed bugs

**Evidence standard.** This is a preservation inventory, not a fix or a statistical redesign. “observed bug” below means an anomalous behavior directly evidenced by this source, including observable inconsistencies and limitations; it does not imply that a browser end-to-end test was run. Selected pure utilities were additionally evaluated in an isolated Node VM using their exact source bodies, without loading the application, CDN scripts, DOM, password gate or files into the application. All other findings are static observations. [L3735–3807, L6907–6948; application scope L1–8617]

**Edge cases explicitly handled by the code**

<!-- ORIGINAL-CONTENT-END -->

**Reading order:** 23/24. Continue: [capaflow-inventory-section-24-of-24.md](capaflow-inventory-section-24-of-24.md).
