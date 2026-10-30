# Bondline technical inventory

Source: `bondline/index.html` (3177 lines, single file, vanilla JS). All line numbers refer to that file.
Libraries (CDN, lines 7-9): Chart.js 4.4.4, chartjs-plugin-annotation 3.0.1 (auto-registered by UMD), SheetJS xlsx 0.18.5.
Structure: CSS 11-281, `<body class="app-locked">` 283, lock screen 286-304, shell/HTML 306-655, defaults modal 658-722, `<script>` 724-3175.
`<html lang="es">` static, but `setLang`/`applyLangToDOM` set `document.documentElement.lang` (981, 997). `<title>` static: `Análisis Térmico — Activación de Adhesivo` (line 6). Favicon inline SVG.
Tool nature: thermocouple (TC) temperature profile viewer. Data has NO headers and NO time column; each column = one TC, each row = 1 second. Adhesive activation = first second where all TCs >= adhesive min, then a fixed 30 s window that must stay within [min,max]. Optional cooling target check, event markers, layout image with draggable TC markers, PNG export.
There are NO ramp rates, NO time-above-threshold, NO averages (except `avgFirst` for y-axis min), NO interpolation (only Chart.js `tension:.3` smoothing), NO unit conversions.

localStorage keys: `tcLangPref` (lang), `tc-theme` (theme), `bondlineDefaults` (adhesive ranges + cooling target). sessionStorage: `bondlineAuthSession`.

---

## 1. Global state variables

| Name | Type | Initial | Line | Notes |
|---|---|---|---|---|
| `LANG_KEY` | const string | `'tcLangPref'` | 728 | |
| `currentLang` | `'es'`/`'en'` | `localStorage.getItem('tcLangPref') \|\| ((navigator.language\|\|'').toLowerCase().startsWith('en')?'en':'es')` | 729 | stored value not validated |
| `I18N` | const `{es,en}` | sec. 8 | 731-970 | values strings or functions |
| `prefersDark` | MediaQueryList | `matchMedia('(prefers-color-scheme:dark)')` | 1114 | |
| `adhesiveType` | `'waterbase'`/`'hotmelt'` | `'waterbase'` | 1160 | |
| `substrateType` | `'pcabs'`/`'pp'` | `'pcabs'` | 1160 | display only; does NOT affect any calculation |
| `parsedData` | `null` or `{columns:(number\|null)[][], totalRows:number}` | `null` | 1160 | `columns[c][r]` = TC c at second r |
| `chartInstance` | Chart/null | `null` | 1160 | destroyed + recreated every `renderChart` |
| `tcVisibility` | `boolean[]` | `[]` | 1163 | per TC; re-init to all true if length != columns.length (1787) |
| `timeRangeActive` | boolean | `false` | 1166 | |
| `timeRangeStart` | number (s) | `0` | 1167 | |
| `timeRangeEnd` | number/null | `null` | 1168 | null = totalRows |
| `workbookData` | SheetJS workbook/null | `null` | 1171 | |
| `availableSheets` | `string[]` | `[]` | 1172 | `workbook.SheetNames` |
| `currentSheetIndex` | number | `0` | 1173 | |
| `sheetConfigs` | `{[sheetName]: config}` | `{}` | 1174 | in-memory only; never cleared on new file |
| `FACTORY_DEFAULTS` | const | `{waterbase:{min:55,max:75},hotmelt:{min:60,max:80},coolingTarget:35}` | 1177-1181 | |
| `currentDefaults` | object | `loadDefaults()` | 1196 | |
| `SUBSTRATE_INFO` | const | `{pcabs:{label:'PC-ABS'},pp:{label:'PP'}}` | 1206 | |
| `ACTIVATION_DURATION` | const | `30` | 1207 | seconds (rows) |
| `TC_COLORS` | const string[20] | `'#4f8cff','#ef5b67','#43b36b','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#84cc16','#f43f5e','#14b8a6','#6366f1','#d97706','#0ea5e9','#e11d48','#10b981','#a855f7','#ca8a04','#0891b2','#be185d','#3b82f6'` | 1208 | color for TC i = `TC_COLORS[i%TC_COLORS.length]` everywhere |
| `EVENTS_CONFIG`, `EVENTS_LABELS` | const | sec. 5C | 1239-1268 | |
| `dropZone`, `fileInput` | DOM | | 1315 | |
| `timeRangeCollapsed`, `paramsCollapsed`, `rawMaterialCollapsed`, `fileCollapsed`, `eventsCollapsed`, `layoutCollapsed` | boolean | `false` | 1707, 2787, 2794, 2801, 2808, 2815 | panel collapse |
| `layoutImageLoaded` | boolean | `false` | 2825 | |
| `tcMarkers` | `Array<{element, tcIndex, x, y}>` | `[]` | 2826 | x,y = percent numbers |
| `layoutDropZone`, `layoutImageInput`, `layoutCanvas` (an `<img id="layoutCanvas">`, NOT a canvas), `layoutCanvasWrap`, `tcMarkersContainer` | DOM | | 2829-2833 | |
| `leisterCount` | number | `1` | 3108 | |
| `AUTH_KEY` | const | `'bondlineAuthSession'` | 3129 | |
| `CORRECT_PASSWORD` | const string | hardcoded plaintext at line 3130 (value not reproduced) | 3130 | client-side only |

Observed bug: `layoutImg` is read at 1426 (`src:layoutImg.src`) and assigned at 1539 but never declared at top level (only a block-scoped `const layoutImg` inside `downloadChart` line 2660).

---

## 2. Functions

### 2A. PURE CALCULATION logic (port byte-identical)

All inside `renderChart` (1769-2172) and duplicated in `downloadChart` (2177-2783).

#### Adhesive config (1198-1204)
```js
function getAdhesiveConfig(){
  return {
    waterbase:{min:currentDefaults.waterbase.min,max:currentDefaults.waterbase.max,label:'Water Base'},
    hotmelt:{min:currentDefaults.hotmelt.min,max:currentDefaults.hotmelt.max,label:'Hotmelt'}
  };
}
```
Factory: waterbase 55..75, hotmelt 60..80. `cfg = getAdhesiveConfig()[adhesiveType]`. `cfg.label` is not translated.

#### Time range (renderChart 1775-1784; downloadChart 2226-2232)
```js
const effectiveStart=timeRangeActive?timeRangeStart:0;
const effectiveEnd=timeRangeActive&&timeRangeEnd!==null?timeRangeEnd:totalRows;
const effectiveRows=effectiveEnd-effectiveStart;
const labels=Array.from({length:effectiveRows},(_,i)=>i);   // always starts at 0 (relative)
const trimmedColumns=columns.map(col=>col.slice(effectiveStart,effectiveEnd));
```

#### Activation start (1791-1794; PNG 2236-2237) - FULL data, ALL TCs (visibility ignored)
```js
let activationStart=null;
for(let r=0;r<totalRows;r++){if(columns.every(col=>col[r]!==null&&col[r]>=cfg.min)){activationStart=r;break;}}
const activationEnd=activationStart!==null?activationStart+ACTIVATION_DURATION:null;
```
Threshold `>=` min.

#### Window validity (1796-1819)
```js
let allInRange=false;
if(activationStart!==null){
  const windowFullyVisible=activationStart>=effectiveStart&&activationEnd<=effectiveEnd;
  if(windowFullyVisible){
    allInRange=true;
    const end=Math.min(activationEnd,totalRows);
    for(let r=activationStart;r<end;r++){
      for(let c=0;c<columns.length;c++){
        const v=columns[c][r];
        if(v===null||v<cfg.min||v>cfg.max){ allInRange=false; break; }
      }
      if(!allInRange)break;
    }
  }else{ allInRange=false; }
}
```
Checks rows start..start+29 (30 samples), inclusive [min,max]. If the window passes the end of the data (activationEnd > totalRows) or is cut by the time range -> NOK.

#### Y limits (1821-1824; PNG 2497-2499)
```js
const firstValues=trimmedColumns.map(col=>{for(let r=0;r<col.length;r++){if(col[r]!==null)return col[r];}return null;}).filter(v=>v!==null);
const avgFirst=firstValues.length?firstValues.reduce((a,b)=>a+b,0)/firstValues.length:0;
const yMax=80,yMin=Math.floor(avgFirst*0.95);
```

#### Min/Max stats (1826-1828; PNG 2234-2235) - full columns, all TCs
```js
let maxTemp=-Infinity,minTemp=Infinity;
columns.forEach(col=>col.forEach(v=>{if(v!==null){if(v>maxTemp)maxTemp=v;if(v<minTemp)minTemp=v;}}));
```

#### Cooling check (1931-1941, 2134-2171) - full data, all TCs
```js
const coolingStartTime=parseFloat(document.getElementById('eventCoolingStart').value);
const coolingClosed=parseFloat(document.getElementById('eventCoolingClosed').value);
const coolingEnd=parseFloat(document.getElementById('eventCoolingEnd').value);
const hasCoolingEvents=!isNaN(coolingStartTime)||!isNaN(coolingClosed)||!isNaN(coolingEnd);
const coolingTargetTemp=currentDefaults.coolingTarget;
if(hasCoolingEvents&&!isNaN(coolingStartTime)){
  let coolingAchievedTime=null;
  for(let r=Math.floor(coolingStartTime);r<totalRows;r++){
    const allCooled=columns.every(col=>col[r]!==null&&col[r]<=coolingTargetTemp);
    if(allCooled){coolingAchievedTime=r;break;}
  }
  // pass: const timeAfterCoolingStart=coolingAchievedTime-coolingStartTime;
}
```
Default target 35 (`<=`). `coolingClosed`/`coolingEnd` do not affect the result.

#### Active events (1270-1288)
```js
const value=parseFloat(input.value);
if(!isNaN(value)&&value>=0){ events.push({x:value,label:EVENTS_LABELS[currentLang][config.label],color:config.color,id:config.id}); }
```
Order = EVENTS_CONFIG insertion order: press(start,closed,open,end), manipulation(start,end), cooling(start,closed,end).

#### Temperature loss (3083-3101)
```js
const thermo=parseFloat(thermoEl.value); const nest=parseFloat(nestEl.value);
if(!isNaN(thermo)&&!isNaN(nest)){
  const loss=thermo-nest;
  lossEl.textContent=loss.toFixed(1)+' °C';
  lossEl.className='param-computed'+(loss>0?' loss-positive':' loss-zero');
}else{ lossEl.textContent='— °C'; lossEl.className='param-computed loss-zero'; }
```
Zones: upper (`thermoUpper`,`nestUpper`,`lossUpper`), lower (`thermoLower`,`nestLower`,`lossLower`). `loss-positive` amber text, otherwise gray.

#### Default marker positions (createTCMarkers 2905-2936), percent; vi = index among VISIBLE TCs, n = visible count
```js
if(n<=2){ x=30+(vi*40); y=50; }
else if(n<=4){ row=Math.floor(vi/2); col=vi%2; x=25+(col*50); y=30+(row*40); }
else if(n<=6){ row=Math.floor(vi/3); col=vi%3; x=20+(col*30); y=30+(row*40); }
else if(n<=9){ row=Math.floor(vi/3); col=vi%3; x=20+(col*30); y=25+(row*30); }
else        { row=Math.floor(vi/5); col=vi%5; x=15+(col*18); y=20+(row*20); }
```

#### Number formatting summary
- Stat min/max: `v.toFixed(1)+'°'`. TC count raw. Duration `${totalRows}s` (screen) / `effectiveRows+'s'` (PNG). Activation `'t='+activationStart+'s'` or `'—'`.
- Adhesive info and annotations: raw `cfg.min`/`cfg.max` + `°C`.
- Tooltip title `` `t = ${items[0].label}s` ``; label `` ` ${item.dataset.label}: ${item.parsed.y?.toFixed(1)??'—'}°C` ``. Y ticks `v+'°C'`.
- Result messages: raw numbers; shown activation time = `activationStart-effectiveStart` (can be negative with a time range).

### 2B. UI / DOM functions

| Function | Lines | Purpose / DOM |
|---|---|---|
| `T(key,...args)` | 972-975 | `I18N[currentLang]?.[key] ?? I18N.es[key]`; call if function; `?? key` |
| `setLang(lang)` | 977-987 | guard `I18N[lang]`; set currentLang, localStorage `tcLangPref`, `html lang`, `#currentLangLabel`=upper, `applyLangToDOM()`, `updateAdhesiveInfo()`, `updateSubstrateInfo()`, re-render chart if parsedData |
| `toggleLangMenu()` | 989-993 | es<->en then `closeMenu()` |
| `applyLangToDOM()` | 995-1010 | `[data-i18n]` -> `innerHTML` (skips function entries); `[data-i18n-placeholder]` -> placeholder |
| `toggleMenu/closeMenu/closeMenuOutside` | 1015-1041 | `#hamburgerBtn`/`#menuDropdown` `.active`; outside click closes (listener added after 10 ms) |
| `openDefaultsModal()` | 1046-1057 | fills `#defaultWaterBaseMin/Max`, `#defaultHotmeltMin/Max`, `#defaultCoolingTarget`; `#defaultsModal.active` |
| `closeDefaultsModal(event)` | 1059-1065 | with event: closes only if target has class `modal-overlay`; without: closes |
| `saveDefaults()` / `resetDefaults()` | 1067-1109 | sec. 6 |
| `applyTheme()` | 1115 | stored `tc-theme` -> `data-theme`; else dark if prefersDark |
| `toggleTheme()` | 1116-1123 | `dark`->`light`, otherwise ->`dark`; stores; `updateLogo()`; re-render chart |
| `isDark()` | 1125 | `data-theme==='dark'` |
| `updateLogo()` | 1128-1154 | `#appLogo.src`/`#lockLogo.src` = dark ? `logo2.png` : `logo1.png`; onload adds `loaded`, onerror removes |
| `loadDefaults()` | 1184-1194 | JSON.parse `bondlineDefaults`, fallback `{...FACTORY_DEFAULTS}` |
| `updateAdhesiveInfo()` | 1210-1213 | `#tempInfo` = `` `${T('adhesiveMin')}: <span class="temp-val">${cfg.min}°C</span> &nbsp;|&nbsp; ${T('adhesiveMax')}: <span class="temp-val">${cfg.max}°C</span>` `` |
| `updateSubstrateInfo()` | 1215-1219 | `#substrateInfo` = `` `${T('needsFlame')}: <span class="substrate-val">${pp?T('flameYes'):T('flameNo')}</span>` `` |
| `setAdhesive(type)` | 1221-1227 | classes: `#btnWaterBase` `adhesive-btn`+` active-waterbase`; `#btnHotmelt` `adhesive-btn`+` active-hotmelt`; info; re-render |
| `setSubstrate(type)` | 1229-1234 | `#btnPCABS`,`#btnPP` `substrate-btn`+` active-substrate`; info (no re-render) |
| `updateEvents()` | 1290-1292 | re-render if parsedData |
| `checkCoolingParams()` | 1295-1310 | `#coolingParamsContainer` display block iff all 3 cooling inputs non-empty |
| `handleFile(file)` | 1329-1381 | sec. 3 |
| `saveCurrentSheetConfig()` | 1387-1434 | snapshot into `sheetConfigs` |
| `loadSheetConfig(name)` | 1436-1578 | restore snapshot (broken, sec. 10) |
| `loadSheet(index)` | 1580-1668 | sec. 3 |
| `switchSheet/previousSheet/nextSheet` | 1670-1684 | `loadSheet(parseInt(i))`; prev/next bounded, no wrap |
| `toggleTC(i)` | 1689-1702 | flip visibility, `renderChart()`, `updateLayoutMarkers()` if layout loaded |
| `toggleTimeRange()` | 1708-1712 | collapse `#timeRangeBody` |
| `applyTimeRange()` / `resetTimeRange()` | 1714-1764 | sec. 6 |
| `renderChart()` | 1769-2172 | stats, chart, legend, results |
| `downloadChart()` | 2177-2783 | PNG export |
| `toggleParams/RawMaterial/File/Events/Layout` | 2788-2820 | collapse `#paramsBody`,`#rawMaterialBody`,`#fileBody`,`#eventsBody`,`#layoutBody`; button text `+`/`−` |
| layout drop zone listeners | 2835-2856 | |
| `handleLayoutImage(file)` | 2858-2880 | non-image -> alert (es 'Por favor selecciona una imagen' / en 'Please select an image'); FileReader dataURL -> `#layoutCanvas.src`; onload: `layoutImageLoaded=true`, `#layoutDropZone.loaded`, `#layoutCanvasWrap.active`, `#layoutFileName`=name, `createTCMarkers()` if parsedData |
| `createTCMarkers()` | 2882-2954 | rebuild markers for VISIBLE TCs at default positions (resets dragged positions); `.tc-marker`, bg `TC_COLORS[idx%20]`, text `idx+1`, `data-label="TC-${idx+1}"` |
| `makeTCMarkerDraggable(marker)` | 2956-3074 | mouse + touch drag, clamp to wrap (marker size 32), store `left/top` percent in `tcMarkers[].x/y` on release |
| `updateLayoutMarkers()` | 3077-3081 | |
| `calcLoss(zone)` / `updateTemperatureLoss()` | 3083-3106 | 2A |
| `addLeister()` | 3109-3117 | `leisterCount++`, appends `.leister-item` label `Leister ${n}` + `.leister-input` (number, step 0.1, placeholder `°C`) |
| `removeLeister()` | 3119-3124 | no-op at 1 |
| `checkAuth/unlockApp/lock submit` | 3132-3167 | sec. 9 |

---

## 3. Excel / CSV import

- `#fileInput` (`accept=".xlsx,.xls,.csv"`, hidden, absolute overlay) inside `#dropZone`. Dropzone click -> `fileInput.click()` unless target is the input (1318-1322). Drag/drop (1324-1326) and `change` (1327) -> `handleFile(files[0])`. No extension/MIME validation in JS. Input value never reset (same file re-selected does not fire `change`).
- `handleFile` (1329-1381): `#fileName`=file.name; `#dropZone` gets `loaded` BEFORE parsing (even on failure). `FileReader.readAsArrayBuffer`; `XLSX.read(new Uint8Array(buf),{type:'array'})` (no cellDates/raw options). CSV goes through the same call (SheetJS auto-detect; one sheet). `workbookData=workbook; availableSheets=workbook.SheetNames`.
- Sheet selection: if `availableSheets.length>1` -> `#sheetSelectorContainer` display block and `#sheetSelector` options rebuilt (`value=idx`, text `` `${idx+1}. ${name}` ``); else container hidden. `#sheetTitle` and `#testDate` live inside this container, so with a single sheet there is no test-date input. Default sheet = index 0 (`currentSheetIndex=0; loadSheet(0)`). User picks via select (`onchange=switchSheet(this.value)`) or `←`/`→` buttons (titles hardcoded ES 'Hoja anterior'/'Hoja siguiente'). Header `📊 Hoja Activa` is hardcoded Spanish (485).
- `loadSheet(index)` (1580-1668):
  1. guard `!workbookData||index<0||index>=availableSheets.length` -> return.
  2. If `parsedData` exists -> `saveCurrentSheetConfig()`.
  3. `raw=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null})` (array of arrays; NO header interpretation: any header row is just data, non-numeric -> null).
  4. `rows=raw.filter(r=>r.some(v=>v!==null&&v!==''))`: blank rows removed (time index = index in filtered array, not original Excel row). Empty -> `console.warn` + ``alert(`La hoja "${sheetName}" no contiene datos válidos`)`` (ES only), return (previous state untouched).
  5. `numCols=Math.max(...rows.map(r=>r.length))`; each cell: `val=parseFloat(rows[r][c]); col.push(isNaN(val)?null:val)` (`"12abc"`->12, `"1,5"`->1, text/empty/bool -> null; Excel dates are serial numbers -> data).
  6. `activeColumns=allColumns.filter(col=>col.some(v=>v!==null))` (all-null columns dropped, e.g. text time column; a numeric time column would be kept as a TC). If none: ``alert(`La hoja "${sheetName}" no contiene datos de temperatura válidos`)``, return.
  7. `lastRow` = max over columns of (last non-null row index + 1); `columns=activeColumns.map(col=>col.slice(0,lastRow))`; `parsedData={columns,totalRows:lastRow}`. Interior nulls kept (chart `spanGaps:true`; checks treat null as failing).
  8. `loadSheetConfig(sheetName)`; `tcVisibility` = saved copy if same length else all true; `if(!config||!config.timeRangeActive)resetTimeRange()`; `renderChart()`; `updateLayoutMarkers()`.
- Time: NO time-column detection; seconds = row index (0-based) after blank-row filtering, 1 row = 1 s. TC number = order of non-empty columns (TC-1 first). Duration = `totalRows`.
- Errors: `reader.onerror` -> `alert('Error al leer el archivo. Por favor intenta de nuevo.')`; parse exception -> `alert('Error al procesar el archivo: '+err.message)` (ES only).

---

## 4. KPI / summary cards and result boxes

### 4A. `#statsBar` (rebuilt in `renderChart` 1830-1837; `display:grid`, 5 columns, 2 columns <=768px). Each `.stat` > `.stat-top > .stat-chip` + `.stat-num` + `.stat-label`.

| # | Chip (text, style) | Value | Label key: ES / EN |
|---|---|---|---|
| 1 | `TC`, bg `--blue-bg` / text `--blue-text` | `columns.length` | `statThermocouples` Termopares / Thermocouples |
| 2 | `⏱`, `--purple-bg`/`--purple-text` | `${totalRows}s` | `statDuration` Duración ciclo / Cycle duration |
| 3 | `↓`, `--cyan-bg`/`--cyan-text` | `${minTemp.toFixed(1)}°` | `statMinTemp` Temp mín registrada / Min temp recorded |
| 4 | `↑`, `--red-bg`/`--red-text` | `${maxTemp.toFixed(1)}°` | `statMaxTemp` Temp máx registrada / Max temp recorded |
| 5 | `⚡`, green (`--green-bg`/`--green-text`) if activated else red | `activationStart!==null?'t='+activationStart+'s':'—'` | activated: `statActivation` Inicio activación / Activation start; else `statNotReached` No alcanzada / Not reached |

### 4B. `#activationResult` (2117-2132)
- `activationStart===null`: class `activation-result fail`; `resultFailTitle` + `T('resultFail',cfg.min,cfg.label)`.
- `allInRange`: class `pass`; `resultPassTitle` + `T('resultPass',cfg.min,displayActivationStart,ACTIVATION_DURATION,cfg.max)`.
- else class `fail`; `resultOutTitle` + `T('resultOut',displayActivationStart,ACTIVATION_DURATION,cfg.min,cfg.max)`.
- `displayActivationStart=activationStart-effectiveStart`. HTML `<div class="result-title">{title}</div>{body}`.

### 4C. `#coolingResult` (2134-2171)
Shown only when `hasCoolingEvents&&!isNaN(coolingStartTime)`. Pass: class `activation-result pass`, display block, `coolingResultTitle` + `T('coolingResult',timeAfterCoolingStart,coolingTargetTemp)`. Fail: class `fail`, `coolingResultFailTitle` + `T('coolingResultFail',coolingTargetTemp)`. Otherwise `className='activation-result'`, `display:none`.

### 4D. Others
Loss boxes `#lossUpper`/`#lossLower` (initial `— °C`), `#tempInfo` ("Mín: 55°C | Máx: 75°C"), `#substrateInfo`. No data table.

---

## 5. Charts (Chart.js 4.4.4 + annotation 3.0.1)

Canvas `#chartCanvas` in `#chartWrapper` (500px high); `#placeholder` hidden on first render. Instance destroyed and recreated every `renderChart`.

### 5A. On-screen config (1978-1986)
```js
new Chart(canvas,{type:'line',data:{labels,datasets},options:{
  responsive:true,maintainAspectRatio:false,animation:false,
  interaction:{mode:'index',intersect:false},
  scales:{
    x:{title:{display:true,text:T('axisTime'),color:txtC,font:{size:13,weight:'600'}},ticks:{color:txtM,font:{size:11},maxTicksLimit:30},grid:{color:gridC}},
    y:{min:yMin,max:yMax,title:{display:true,text:T('axisTemp'),color:txtC,font:{size:13,weight:'600'}},ticks:{color:txtM,font:{size:11},callback:v=>v+'°C'},grid:{color:gridC}}
  },
  plugins:{legend:{display:false},tooltip:{backgroundColor:tipBg,titleColor:tipTxt,bodyColor:tipBody,borderColor:tipBdr,borderWidth:1,titleFont:{weight:'800'},bodyFont:{size:12},padding:12,cornerRadius:10,callbacks:{title:items=>`t = ${items[0].label}s`,label:item=>` ${item.dataset.label}: ${item.parsed.y?.toFixed(1)??'—'}°C`}},annotation:{annotations}}
}});
```
X = category scale with numeric labels 0..effectiveRows-1. Theme colors (1840-1841): `txtC=dark?'#a9b6cd':'#5f6b7d'`, `txtM=dark?'#71809c':'#8a95a6'`, `gridC=dark?'rgba(255,255,255,.06)':'rgba(15,23,42,.06)'`, `tipBg=dark?'#131e35':'#ffffff'`, `tipBdr=dark?'rgba(255,255,255,.12)':'rgba(15,23,42,.12)'`, `tipTxt=dark?'#edf3ff':'#142033'`, `tipBody=dark?'#a9b6cd':'#5f6b7d'`.

### 5B. Datasets (1844-1856), one per TC (all, hidden via flag)
```js
{label:`TC-${i+1}`,data:col /*trimmed, nulls kept*/,borderColor:TC_COLORS[i%TC_COLORS.length],backgroundColor:'transparent',
 borderWidth:2.5,pointRadius:0,pointHoverRadius:5,tension:.3,spanGaps:true,hidden:!tcVisibility[i]}
```

### 5C. Annotations (1858-1970)
Colors: `isHM=adhesiveType==='hotmelt'`; `lc` = hotmelt ? (dark `'rgba(248,184,79,'` : light `'rgba(245,158,11,'`) : waterbase (dark `'rgba(34,211,238,'` : light `'rgba(6,182,212,'`); `gc` = dark `'rgba(89,201,127,'` : light `'rgba(67,179,107,'`; opacity appended (`'0.8)'` etc.).
- `minLine`: `{type:'line',yMin:cfg.min,yMax:cfg.min,borderColor:lc+'0.8)',borderWidth:2,borderDash:[8,4],label:{display:true,content:T('annotMin',cfg.min),position:'start',backgroundColor:lc+'0.60)',color:lc+'1)',font:{size:11,weight:'700'},padding:{top:4,bottom:4,left:8,right:8},borderRadius:8,yAdjust:15}}`
- `maxLine`: same, `yMin/yMax:cfg.max`, content `T('annotMax',cfg.max)`, `yAdjust:-15`.
- `activationWindow` (if `activationStart!==null` and `adjEnd>=0&&adjStart<effectiveRows`): `{type:'box',xMin:Math.max(0,adjStart),xMax:Math.min(effectiveRows-1,adjEnd),yMin:cfg.min,yMax:cfg.max,backgroundColor:gc+'0.08)',borderColor:gc+'0.45)',borderWidth:2,borderDash:[6,3],label:{display:true,content:T('annotWindow',ACTIVATION_DURATION),position:{x:'center',y:'start'},color:dark?'#9ae5b1':'#217543',font:{size:11,weight:'800'},padding:{top:4,bottom:4,left:8,right:8},backgroundColor:gc+'0.14)',borderRadius:8}}`; `adjStart=activationStart-effectiveStart`, `adjEnd=activationEnd-effectiveStart`.
- `event_${idx}` for each active event with `adjustedX=evt.x-effectiveStart` in `[0,effectiveRows)`: `{type:'line',xMin:adjustedX,xMax:adjustedX,borderColor:evt.color,borderWidth:2,borderDash:[5,5],label:{display:true,content:evt.label,position:'start',backgroundColor:evt.color+'33',color:evt.color,font:{size:10,weight:'700'},padding:{top:3,bottom:3,left:6,right:6},borderRadius:6,rotation:270,yAdjust:-8},enter({element}){element.options.borderWidth=3;},leave({element}){element.options.borderWidth=2;}}`

| Input id | label key | color |
|---|---|---|
| `eventPressStart` | `pressStart` | `#4f8cff` |
| `eventPressClosed` | `pressClosed` | `#72a8ff` |
| `eventPressOpen` | `pressOpen` | `#a8cbff` |
| `eventPressEnd` | `pressEnd` | `#235fd2` |
| `eventManipStart` | `manipStart` | `#43b36b` |
| `eventManipEnd` | `manipEnd` | `#217543` |
| `eventCoolingStart` | `coolingStart` | `#06b6d4` |
| `eventCoolingClosed` | `coolingClosed` | `#22d3ee` |
| `eventCoolingEnd` | `coolingEnd` | `#0e7490` |

`EVENTS_LABELS` ES: pressStart 'Inicia Prensa', pressClosed 'Prensa Cerrada', pressOpen 'Prensa Abierta', pressEnd 'Termina Prensa', manipStart 'Inicia Manipulación', manipEnd 'Termina Manipulación', coolingStart 'Inicia Cooling', coolingClosed 'Cooling Cerrado', coolingEnd 'Termina Cooling'. EN: 'Press Start','Press Closed','Press Open','Press End','Manip. Start','Manip. End','Cooling Start','Cooling Closed','Cooling End'.
- `coolingTargetLine` (if `hasCoolingEvents&&!isNaN(coolingStartTime)` and `adjustedCoolingStart<effectiveRows`): `purple = dark?'rgba(167,139,250,':'rgba(139,92,246,'`; `{type:'line',xMin:Math.max(0,adjustedCoolingStart),xMax:effectiveRows-1,yMin:T,yMax:T,borderColor:purple+'0.9)',borderWidth:3,borderDash:[10,5],label:{display:true,content:`🎯 ${T}°C`,position:'end',backgroundColor:purple+'0.18)',color:purple+'1)',font:{size:11,weight:'800'},padding:{top:4,bottom:4,left:8,right:8},borderRadius:8,yAdjust:-15}}` (T = `currentDefaults.coolingTarget`).

### 5D. Custom legend `#customLegend` (2090-2115, flex)
- Per TC: `.legend-item.tc-legend[.hidden]` with `.legend-line` colored `TC_COLORS[i%20]`, text `TC-${i+1}`, button `.tc-toggle-btn[.hidden]` `onclick=toggleTC(i)` text `T('hideTC')` (Ocultar/Hide) if visible, `T('showTC')` (Mostrar/Show) if hidden. Hidden items opacity .4.
- `<div class="legend-item"><div class="legend-dash" style="border-color:{limC}"></div>{legendLimits}</div>`, `limC=isHM?'var(--amber)':'var(--cyan)'`.
- `<div class="legend-item"><div class="legend-box"></div>{legendWindow}</div>`.
- If `hasCoolingEvents`: `<div class="legend-item"><div class="legend-dash" style="border-color:var(--purple)"></div>🎯 Cooling ${coolingTargetTemp}°C</div>`.
- Visibility toggles affect chart, layout markers and PNG, NOT activation/cooling/min/max.

### 5E. Drag-to-edit event lines (2015-2088)
Listeners on `#chartCanvas` (re-added on every render). `click`: x pixel vs `xScale.getPixelForValue(evt.x)`, `<10px` selects (last match wins), cursor grab. `mousedown` + selected -> dragging. `mousemove`: `newX=Math.round(xScale.getValueForPixel(x))`; if `0<=newX<=totalRows-1`: floating `#dragEventTooltip` (position fixed at `clientX+12`,`clientY-35`) HTML `<span style="color:{deltaColor}">{deltaText}s</span> — t={newX}s`, delta=`newX-originalX`, text `+N`/`N`/`±0`, color `var(--green-text)`/`var(--red-text)`/`var(--text-3)`; writes `newX` into the event input and `updateEvents()`. `mouseup` ends; `mouseleave` resets. Tooltip style: gradient panel, 1.5px border, radius 10, padding 6px 10px, 11px/800, z-index 9999.

---

## 6. Inputs / settings

| Id | Type / attrs | Default | Behaviour |
|---|---|---|---|
| `fileInput` | file `.xlsx,.xls,.csv` | | sec. 3 |
| `btnWaterBase`/`btnHotmelt` | buttons "Water Base"/"Hotmelt" (not i18n) | waterbase | `setAdhesive` |
| `btnPCABS`/`btnPP` | buttons "PC-ABS"/"PP" | pcabs | `setSubstrate` |
| `thermoUpper`,`nestUpper`,`thermoLower`,`nestLower` | number step 0.1, placeholder `°C` | empty | oninput `calcLoss('upper'|'lower')` |
| `.leister-input` | number step 0.1, placeholder `°C` | 1 leister | add/remove buttons; no oninput |
| `slidersTemp` | number step 0.1 | empty | |
| `testDate` | text, placeholder `testDatePlaceholder` (DD/MM/YYYY ES, MM/DD/YYYY EN) | empty | free text; inside sheet selector container; used in PNG filename |
| `timeRangeStart` | number step 1 min 0 placeholder `0` | empty | |
| `timeRangeEnd` | number step 1 min 0 placeholder `Auto` (hardcoded) | empty | |
| `eventPressStart/Closed/Open/End`, `eventManipStart/End`, `eventCoolingStart/Closed/End` | number step 1 min 0 placeholder `s` | empty | oninput `updateEvents()` (cooling ones also `checkCoolingParams()`); active only if parseFloat >= 0 |
| `coolingChiller`,`coolingNestUpper`,`coolingNestLower` | number step 0.1 placeholder `°C` | empty | shown when all 3 cooling events set; only used in PNG |
| `layoutImageInput` | file `image/*` | | sec. 2B |
| `defaultWaterBaseMin/Max`, `defaultHotmeltMin/Max`, `defaultCoolingTarget` | number step 0.1 (no min/max) | modal | below |

Time range (`applyTimeRange` 1714-1751): `start=parseInt(startInput)||0`; `end=endInput?parseInt(endInput):null`. Alerts (ES/EN by currentLang): `start<0` 'El tiempo de inicio debe ser mayor o igual a 0' / 'Start time must be 0 or greater'; `end!==null&&end<=start` 'El tiempo final debe ser mayor al inicial' / 'End time must be greater than start time'; `end!==null&&end>totalRows` `` `El tiempo final no puede exceder ${totalRows}s` `` / `` `End time cannot exceed ${totalRows}s` ``. On success `timeRangeActive=true`, start/end set, re-render. Reset: active=false,start=0,end=null, clears inputs, re-render. Button titles hardcoded ES ('Aplicar rango','Restaurar'), `✓` and `↻`.

### `bondlineDefaults` (localStorage)
- JSON `{"waterbase":{"min":N,"max":N},"hotmelt":{"min":N,"max":N},"coolingTarget":N}`.
- Read once at load (`loadDefaults()` 1196); invalid JSON -> factory; no shape validation.
- Written by `saveDefaults()` (1082) and `resetDefaults()` (1100).
- `saveDefaults` (1067-1095): `parseFloat(...)||55` / `||75` (waterbase), `||60` / `||80` (hotmelt), `||35` (cooling); so empty/0 -> factory; no min<max check. Then localStorage, `currentDefaults=newDefaults`, `updateAdhesiveInfo()`, re-render if parsedData, close modal.
- `resetDefaults` (1097-1109): `confirm(es '¿Restaurar valores de fábrica?' / en 'Restore factory values?')`; `currentDefaults={...FACTORY_DEFAULTS}`; persists immediately; refills modal inputs; does NOT refresh `#tempInfo`, chart or close the modal.
- No other presets.

Per-sheet in-memory snapshot (`saveCurrentSheetConfig` 1387-1434): testDate, adhesiveType, substrateType, tcVisibility, timeRangeActive/Start/End, events{pressStart,pressOpen,pressClose,pressEnd,manipStart,manipEnd,coolingStart,coolingClosed,coolingEnd}, coolingParams{chiller,nestUpper,nestLower}, params{thermoUpper,nestUpper,thermoLower,nestLower,slidersTemp,leisters[]}, layoutImage, layoutMarkers[{tcIndex,x,y}].

---

## 7. Exports

Only PNG: menu item `📥` (`menuDownload`) -> `downloadChart()` (2177-2783). No Excel/PDF/CSV.

Errors: no data -> `alert('Por favor carga datos primero' / 'Please load data first')`; exception -> `alert('Error al generar la imagen. Por favor intenta de nuevo.' / 'Error generating image. Please try again.')`. Success: console only.

Composition (offscreen canvas **1920 x 1280**):
1. Background `dark?'#0f172a':'#ffffff'`.
2. Title (60,70) `bold 42px Inter, sans-serif`, `dark?'#edf3ff':'#142033'`, text es `Bondline — Activación de Adhesivo` / en `Bondline — Adhesive Activation` (hardcoded; `exportTitle` key unused).
3. Timestamp (60,100) `14px`, `dark?'#71809c':'#8a95a6'`, `new Date().toLocaleString(es?'es-MX':'en-US')`.
4. Stats: 5 boxes at x=60+190*i, y=130, 180x50, fill `color+'33'`; icon `18px` at (x+10,150); value `bold 24px` (x+40,155); label `11px` `dark?'#a9b6cd':'#5f6b7d'` (x+40,173). Items: TC count (`dark?'#72a8ff':'#4f8cff'`), duration `effectiveRows+'s'` (`dark?'#a78bfa':'#8b5cf6'`), min `toFixed(1)+'°'` (`dark?'#22d3ee':'#06b6d4'`), max (`dark?'#ff7683':'#ef5b67'`), activation `'t='+activationStart+'s'`/`'—'` (green `dark?'#59c97f':'#43b36b'` / red `dark?'#ff7683':'#ef5b67'`). Activation time is absolute here.
5. Parameters panel at (60,200), h 95, width `hasLayoutImage?1010:1800`, padding 16; border gradient (`rgba(79,140,255,.5|.35)` -> `rgba(239,91,103,.5|.35)`, dark|light) lineWidth 2 radius 14; fill `dark?'rgba(15,23,42,.93)':'rgba(255,255,255,.93)'`. Header: 28x28 icon box (gradient `#11284c|#e9f1ff` -> `#24183d|#f3edff`) with `⚙️`, title `T('exportParams')` bold 13px. Columns (width 280, start x=76, y base 254): 
   - `'▲ '+T('paramUpper')` (renders "▲ ▲ Superior", double triangle bug), sub-rows hardcoded ES: "Termoreg." + `thermoU+'°C'`, "Nido" + `nestU+'°C'`, "Pérdida" + `lossU` (DOM text, e.g. `5.0 °C`), loss color `dark?'#ffd78f':'#9a6800'` if `parseFloat(lossU)>0` else `dark?'#edf3ff':'#142033'`. Missing values print `'—'`.
   - vertical divider (`dark?'rgba(255,255,255,.09)':'rgba(15,23,42,.10)'`), same for `'▼ '+T('paramLower')`.
   - Leisters column only if any `.leister-input` has a value: `T('paramLeistersLabel')`, rows `Leister ${n}` + `v+'°C'` (18px steps).
   - Sliders column only if `sliders!=='—'`: `T('paramSlidersLabel')`, "Temperatura" + `sliders+'°C'`.
   - Cooling column if any cooling param set AND `colX+colW<=panelX+panelW-panelPad` (usually dropped with layout): `❄️ Cooling`, "Chiller", "Nido Sup", "Nido Inf".
6. Chart: new offscreen `Chart` on 1800x845 canvas (`responsive:false,animation:false`), drawn at (60,315) 1800x845. Only visible TCs, `borderWidth:3`,`tension:.3`,`spanGaps:true`. Axis titles font 16/600, ticks 13 (x without maxTicksLimit); y min/max as screen; no tooltip. Annotations: min/max lines `lc+'0.9)'` width 3 dash `[10,5]`, labels font 14/700 padding 6/10 `yAdjust` ±20; box fill `gc+'0.12)'` border `gc+'0.6)'` width 3 dash `[8,4]`, label font 14/800 padding 5/10 bg `gc+'0.18)'`; events width 3 dash `[6,6]`, label bg `evt.color+'44'`, font 11/700, padding 4/7, radius 7, rotation 270, yAdjust -10; cooling line width 4 dash `[12,6]`, color `purple+'0.95)'`, `xMin:coolingStartTime, xMax:totalRows` (not offset-adjusted), label font 12/800 padding 5/9 bg `purple+'0.22)'` yAdjust -18.
7. Legend at y=1180: per visible TC 28x4 swatch + `TC-n` (14px), step 100; dashed sample (width 3, dash `[10,5]`, `isHM?(dark?'#f8b84f':'#f59e0b'):(dark?'#22d3ee':'#06b6d4')`) + `T('legendLimits')`, step 200; green box 24x16 (stroke `dark?'#59c97f':'#43b36b'` w2, fill `dark?'rgba(89,201,127,.12)':'rgba(67,179,107,.12)'`) + `T('legendWindow')`, step 200; if `hasCoolingEvents` purple dashed (`dark?'#a78bfa':'#8b5cf6'`) + `` `🎯 Cooling ${T}°C` ``.
8. Layout (if `layoutImageLoaded` and `#layoutCanvas` img complete): max image 750x250 preserving aspect; frame = image x1.05 at x=1120, y so frame bottom = panel bottom (`295-layoutH`); rounded r=12 gradient stroke w3 (`rgba(239,91,103,.8|.6)` -> `rgba(79,140,255,.8|.6)`); image centered; markers for visible TCs at `imgX+(x/100)*imgW`, `imgY+(y/100)*imgH`, diameter 16, shadow (`rgba(0,0,0,.4)`, blur 6, offsetY 3), fill `TC_COLORS[tcIndex%20]`, stroke `rgba(255,255,255,.7)` w2, number `tcIndex+1` white `bold 9px` centered.
9. Footer (60,1240) `12px`, `dark?'#71809c':'#8a95a6'`, `T('footer')`.
10. `toDataURL('image/png')` -> anchor download.
Filename: `` `Bondline - ${testDate} - ${cleanSheetName}.png` ``; `testDate=#testDate.value||'SinFecha'`; `sheetName=availableSheets.length>0?availableSheets[currentSheetIndex]:'Hoja1'`; `cleanSheetName=sheetName.replace(/[/\\:*?"<>|]/g,'-')` (testDate not sanitized).

---

## 8. i18n (verbatim, lines 731-970)

`T()` falls back current lang -> ES -> key. `applyLangToDOM` sets `innerHTML` for non-function entries.

```js
const I18N={
  es:{
    appKicker:'R&D Process Engineering',
    appTitle:'Bondline',
    appSubtitle:'Visualización de ciclo térmico y ventana de activación de adhesivo',
    fileTitle:'📂 Archivo de datos',
    fileSubtitle:'.xlsx / .xls / .csv — sin encabezados, cada columna = termopar',
    fileDrop:'Arrastra tu archivo aquí o <strong>haz clic para seleccionar</strong>',
    rawMaterialTitle:'🧪 Materia Prima',
    rawMaterialSubtitle:'Adhesivo y sustrato',
    adhesiveSection:'Tipo de adhesivo',
    adhesiveTitle:'🧪 Tipo de adhesivo',
    adhesiveSubtitle:'Define los rangos de temperatura',
    adhesiveMin:'Mín',
    adhesiveMax:'Máx',
    substrateSection:'Tipo de sustrato',
    needsFlame:'Necesita Flama',
    flameYes:'SÍ',
    flameNo:'NO',
    chartPlaceholder:'Carga un archivo Excel para visualizar el perfil térmico',
    statThermocouples:'Termopares',
    statDuration:'Duración ciclo',
    statMinTemp:'Temp mín registrada',
    statMaxTemp:'Temp máx registrada',
    statActivation:'Inicio activación',
    statNotReached:'No alcanzada',
    legendLimits:'Límites adhesivo',
    legendWindow:'Ventana activación',
    axisTime:'Tiempo (segundos)',
    axisTemp:'Temperatura (°C)',
    annotMin:(v)=>`Temp Mín: ${v}°C`,
    annotMax:(v)=>`Temp Máx: ${v}°C`,
    annotWindow:(s)=>`Ventana de Activación (${s}s)`,
    resultPassTitle:'✓ Ventana de activación exitosa',
    resultPass:(min,t,dur,max)=>`Todos los termopares alcanzaron ${min}°C en t=${t}s. Durante los ${dur}s siguientes, todas las lecturas se mantuvieron entre ${min}°C y ${max}°C.`,
    resultFailTitle:'⚠ Activación no alcanzada',
    resultFail:(min,label)=>`No todos los termopares alcanzaron la temperatura mínima de ${min}°C del adhesivo ${label}.`,
    resultOutTitle:'⚠ Ventana de activación fuera de rango',
    resultOut:(t,dur,min,max)=>`La activación inició en t=${t}s, pero durante la ventana de ${dur}s algunos termopares salieron del rango ${min}°C – ${max}°C.`,
    coolingResultTitle:'✓ Enfriamiento correcto',
    coolingResult:(time,target)=>`La pieza alcanzó el correcto enfriamiento (${target}°C) ${time}s después de haber iniciado el ciclo de cooling.`,
    coolingResultFailTitle:'⚠ Enfriamiento no alcanzado',
    coolingResultFail:(target)=>`No todos los termopares alcanzaron la temperatura objetivo de ${target}°C durante el ciclo de cooling.`,
    showHideTCs:'Mostrar/Ocultar TCs',
    hideTC:'Ocultar',
    showTC:'Mostrar',
    footer:'Desarrollado por CJLB — R&D Process Engineering',
    eventsTitle:'⏱ Sucesos',
    eventsSubtitle:'Marcadores de eventos del proceso',
    eventsPrensa:'🔧 Prensa',
    eventPressStart:'Inicia Ciclo Prensa',
    eventPressClosed:'Prensa Cerrada',
    eventPressOpen:'Prensa Abierta',
    eventPressEnd:'Termina Ciclo Prensa',
    eventsManipulation:'🤲 Manipulación',
    eventManipStart:'Inicia Manipulación',
    eventManipEnd:'Termina Manipulación',
    eventsCooling:'❄️ Cooling',
    eventCoolingStart:'Inicia Ciclo Cooling',
    eventCoolingClosed:'Cooling Cerrado',
    eventCoolingEnd:'Termina Ciclo Cooling',
    coolingParamsTitle:'Parámetros de Cooling',
    coolingChiller:'Chiller',
    coolingNestUpper:'Cooling Nido Superior',
    coolingNestLower:'Cooling Nido Inferior',
    timeRangeTitle:'⏱ Rango Temporal',
    timeRangeSubtitle:'Recorta el tiempo visible en la gráfica',
    timeRangeStart:'Inicio (s)',
    timeRangeEnd:'Fin (s)',
    timeRangeReset:'Mostrar todo',
    timeRangeApply:'Aplicar rango',
    testDateLabel:'Fecha de Prueba',
    testDatePlaceholder:'DD/MM/YYYY',
    layoutTitle:'📍 Bondline Layout',
    layoutSubtitle:'Diagrama visual de ubicación de termopares',
    layoutDrop:'Arrastra una imagen del guante o <strong>haz clic para seleccionar</strong>',
    layoutFileName:'Imagen cargada:',
    layoutInstructions:'Arrastra los termopares para ubicarlos en el diagrama',
    paramsTitle:'⚙ Parámetros del proceso',
    paramsSubtitleFull:'Temperaturas de termoreguladores, nidos, leisters y sliders',
    paramUpper:'▲ Superior',
    paramLower:'▼ Inferior',
    paramThermoregUpper:'Termoregulador Superior',
    paramNestUpper:'Nido Superior',
    paramThermoregLower:'Termoregulador Inferior',
    paramNestLower:'Nido Inferior',
    paramLoss:'Temperatura Pérdida',
    paramLeistersLabel:'Leisters',
    paramSlidersLabel:'Sliders',
    paramSliders:'Temperatura Sliders',
    menuDownload:'Descargar gráfica PNG',
    menuDefaults:'Valores Default',
    menuTheme:'Cambiar tema',
    menuLanguage:'Idioma:',
    defaultsTitle:'⚙️ Valores Default',
    defaultsSubtitle:'Configura los rangos de temperatura predeterminados',
    defaultsTempMin:'Temp Mín',
    defaultsTempMax:'Temp Máx',
    defaultsCoolingTarget:'Temp Objetivo Cooling',
    defaultsReset:'Restaurar valores de fábrica',
    defaultsSave:'Guardar',
    defaultsCancel:'Cancelar',
    exportTitle:'Perfil Térmico — Activación de Adhesivo',
    exportParams:'Parámetros del proceso',
    lockSubtitle:'Análisis Térmico',
    lockPrompt:'Ingresa la contraseña para comenzar a usar esta aplicación.',
    lockPlaceholder:'Contraseña de acceso',
    lockButton:'Entrar',
    lockDisclaimer:'Esta puerta de acceso protege la vista antes de comenzar.',
    lockError:'Contraseña incorrecta. Intenta de nuevo.',
  },
  en:{
    appKicker:'R&D Process Engineering',
    appTitle:'Bondline',
    appSubtitle:'Thermal cycle visualization and adhesive activation window',
    fileTitle:'📂 Data file',
    fileSubtitle:'.xlsx / .xls / .csv — no headers, each column = thermocouple',
    fileDrop:'Drag your file here or <strong>click to select</strong>',
    rawMaterialTitle:'🧪 Raw Material',
    rawMaterialSubtitle:'Adhesive and substrate',
    adhesiveSection:'Adhesive type',
    adhesiveTitle:'🧪 Adhesive type',
    adhesiveSubtitle:'Sets the temperature range',
    adhesiveMin:'Min',
    adhesiveMax:'Max',
    substrateSection:'Substrate type',
    needsFlame:'Needs Flame',
    flameYes:'YES',
    flameNo:'NO',
    chartPlaceholder:'Load an Excel file to visualize the thermal profile',
    statThermocouples:'Thermocouples',
    statDuration:'Cycle duration',
    statMinTemp:'Min temp recorded',
    statMaxTemp:'Max temp recorded',
    statActivation:'Activation start',
    statNotReached:'Not reached',
    legendLimits:'Adhesive limits',
    legendWindow:'Activation window',
    axisTime:'Time (seconds)',
    axisTemp:'Temperature (°C)',
    annotMin:(v)=>`Min Temp: ${v}°C`,
    annotMax:(v)=>`Max Temp: ${v}°C`,
    annotWindow:(s)=>`Activation Window (${s}s)`,
    resultPassTitle:'✓ Activation window successful',
    resultPass:(min,t,dur,max)=>`All thermocouples reached ${min}°C at t=${t}s. During the following ${dur}s, all readings stayed between ${min}°C and ${max}°C.`,
    resultFailTitle:'⚠ Activation not reached',
    resultFail:(min,label)=>`Not all thermocouples reached the minimum temperature of ${min}°C for ${label} adhesive.`,
    resultOutTitle:'⚠ Activation window out of range',
    resultOut:(t,dur,min,max)=>`Activation started at t=${t}s, but during the ${dur}s window some thermocouples went outside the ${min}°C – ${max}°C range.`,
    coolingResultTitle:'✓ Correct cooling achieved',
    coolingResult:(time,target)=>`The part reached correct cooling (${target}°C) ${time}s after the cooling cycle started.`,
    coolingResultFailTitle:'⚠ Cooling not achieved',
    coolingResultFail:(target)=>`Not all thermocouples reached the target temperature of ${target}°C during the cooling cycle.`,
    showHideTCs:'Show/Hide TCs',
    hideTC:'Hide',
    showTC:'Show',
    footer:'Developed by CJLB — R&D Process Engineering',
    eventsTitle:'⏱ Events',
    eventsSubtitle:'Process event markers',
    eventsPrensa:'🔧 Press',
    eventPressStart:'Press Cycle Start',
    eventPressClosed:'Press Closed',
    eventPressOpen:'Press Open',
    eventPressEnd:'Press Cycle End',
    eventsManipulation:'🤲 Manipulation',
    eventManipStart:'Manipulation Start',
    eventManipEnd:'Manipulation End',
    eventsCooling:'❄️ Cooling',
    eventCoolingStart:'Cooling Cycle Start',
    eventCoolingClosed:'Cooling Closed',
    eventCoolingEnd:'Cooling Cycle End',
    coolingParamsTitle:'Cooling Parameters',
    coolingChiller:'Chiller',
    coolingNestUpper:'Cooling Upper Nest',
    coolingNestLower:'Cooling Lower Nest',
    timeRangeTitle:'⏱ Time Range',
    timeRangeSubtitle:'Trim visible time in the chart',
    timeRangeStart:'Start (s)',
    timeRangeEnd:'End (s)',
    timeRangeReset:'Show all',
    timeRangeApply:'Apply range',
    testDateLabel:'Test Date',
    testDatePlaceholder:'MM/DD/YYYY',
    layoutTitle:'📍 Bondline Layout',
    layoutSubtitle:'Visual diagram of thermocouple locations',
    layoutDrop:'Drag a glove diagram image here or <strong>click to select</strong>',
    layoutFileName:'Image loaded:',
    layoutInstructions:'Drag thermocouples to position them on the diagram',
    paramsTitle:'⚙ Process parameters',
    paramsSubtitleFull:'Thermoregulator, nest, leister and slider temperatures',
    paramUpper:'▲ Upper',
    paramLower:'▼ Lower',
    paramThermoregUpper:'Upper Thermoregulator',
    paramNestUpper:'Upper Nest',
    paramThermoregLower:'Lower Thermoregulator',
    paramNestLower:'Lower Nest',
    paramLoss:'Temperature Loss',
    paramLeistersLabel:'Leisters',
    paramSlidersLabel:'Sliders',
    paramSliders:'Slider Temperature',
    menuDownload:'Download chart PNG',
    menuDefaults:'Default Values',
    menuTheme:'Change theme',
    menuLanguage:'Language:',
    defaultsTitle:'⚙️ Default Values',
    defaultsSubtitle:'Configure default temperature ranges',
    defaultsTempMin:'Min Temp',
    defaultsTempMax:'Max Temp',
    defaultsCoolingTarget:'Cooling Target Temp',
    defaultsReset:'Restore factory values',
    defaultsSave:'Save',
    defaultsCancel:'Cancel',
    exportTitle:'Thermal Profile — Adhesive Activation',
    exportParams:'Process Parameters',
    lockSubtitle:'Thermal Analysis',
    lockPrompt:'Enter the password to start using this app.',
    lockPlaceholder:'Access password',
    lockButton:'Enter',
    lockDisclaimer:'This access gate protects the view before you begin.',
    lockError:'Incorrect password. Try again.',
  }
};
```
(Original has `// ...` section comments between keys; omitted here.) Hardcoded non-dictionary strings: lock title `Bondline — R&D Process Engineering` (293); `Water Base`, `Hotmelt`, `PC-ABS`, `PP`; `📊 Hoja Activa` (485); sheet nav titles; `Auto` placeholder; `Leister N`; PNG labels `Termoreg.`, `Nido`, `Pérdida`, `Nido Sup`, `Nido Inf`, `Temperatura`, `❄️ Cooling`; `🎯 Cooling`; all file/sheet alerts (ES only). Static HTML lock texts are English until `applyLangToDOM()` runs at init. Unused keys: `adhesiveTitle`, `adhesiveSubtitle`, `showHideTCs`, `timeRangeReset`, `timeRangeApply`, `layoutFileName`, `exportTitle`.

---

## 9. Theme / language / menu / login / storage

- Menu (321-345) items: Download PNG (📥 `menuDownload`), Default Values (⚙️ `menuDefaults`, opens modal), Change theme (🌓 `menuTheme`), Language (🌐 `menuLanguage` + `<strong id="currentLangLabel">ES|EN</strong>`; toggles es<->en). Hamburger icon becomes X when active. Outside click closes.
- Language: initial `tcLangPref`, else `navigator.language` starts with `en` -> en, otherwise es. Persisted in `setLang`. Init (3169-3174): `checkAuth(); applyLangToDOM(); updateAdhesiveInfo(); updateSubstrateInfo(); #currentLangLabel=currentLang.toUpperCase()`.
- Theme: `data-theme` on `<html>`; tokens light 13-27, dark 28-41. Stored `tc-theme`; else dark if system dark (light = no attribute). `toggleTheme` also re-renders the chart and updates logos (`logo1.png` light / `logo2.png` dark, hidden unless they load).
- Lock screen (286-304, 3126-3170): overlay `#lockScreen` z-index 10020, `body.app-locked`. Password is hardcoded in JS (`CORRECT_PASSWORD`, line 3130) and compared client-side, case-sensitive exact match. Submit: disable button, clear feedback, after 400 ms: success -> `unlockApp()` (remove `app-locked`, `.hidden` on lock screen with 0.45s fade, `sessionStorage.bondlineAuthSession='true'`); failure -> `#lockFeedback`=`T('lockError')` with class `lock-feedback error`, clear + focus input; re-enable. `checkAuth()` unlocks on load if the sessionStorage flag is `'true'`. Input type=password, autocomplete=off, required.
- Defaults modal `#defaultsModal` (z-index 10000): groups Water Base min/max, Hotmelt min/max, Cooling target; footer Reset | spacer | Cancel | Save.
- Panels with collapse buttons (`−`/`+`): File, Raw Material, Process Parameters, Time Range, Events, Layout.
- Page order: topbar -> File -> Raw Material -> Process Parameters -> stats bar -> Chart card (sheet selector, placeholder, chart, legend, activation result, cooling result) -> Time Range -> Events -> Bondline Layout -> footer.
- Storage: localStorage `tcLangPref`, `tc-theme`, `bondlineDefaults`; sessionStorage `bondlineAuthSession`. Nothing else persists (no data, sheet configs, layout image).

---

## 10. Edge cases handled and observed bugs

Handled:
- Blank rows removed; trailing nulls trimmed; all-null columns dropped; non-numeric -> null; empty sheet / no numeric column -> alert, old state kept.
- `spanGaps:true` bridges interior gaps (checks still treat null as failing).
- Activation not reached -> red message + `—` stat.
- Time range cutting the window -> out-of-range; annotations clamped; events outside range skipped.
- Event inputs only valid if numeric and >= 0.
- `removeLeister` min 1; prev/next sheet bounded; `toggleTC` bounds; `T()` fallbacks; invalid `bondlineDefaults` JSON -> factory; zero/empty default fields -> factory on save.
- PNG guards: no data; hidden TCs excluded; layout drawing guarded by `complete && naturalHeight!==0`.

Observed bugs (not fixed):
1. `loadSheetConfig` (1461) calls undefined `updateSubstrate()` -> ReferenceError caught by try/catch; everything after is skipped, so events, cooling params, process params, leisters, layout and time range are never restored on revisiting a sheet (only testDate/adhesiveType/substrateType assigned before the throw; buttons/info not refreshed; `input[name=adhesive|substrate]` radios do not exist). tcVisibility restore in `loadSheet` (1652) works.
2. `saveCurrentSheetConfig` reads nonexistent `eventPressClose` (real id `eventPressClosed`), so `events.pressClose` is always `''` and Press Closed is never saved.
3. `saveCurrentSheetConfig` reads undeclared `layoutImg` when a layout image is loaded -> ReferenceError caught -> whole config not saved. Restore branch also calls `getContext` on an `<img>`.
4. Because restore aborts, a sheet with saved active time range keeps stale time-range state from the previous sheet.
5. `sheetConfigs` keyed by sheet name, never cleared on new file; new file with same sheet names inherits old configs.
6. `loadSheet` saves current config even on first load of a new file (stores old file's UI state under the new sheet 0 name).
7. `renderChart` adds new click/mousedown/mousemove/mouseup/mouseleave listeners to the same canvas on every render and appends a new `#dragEventTooltip` div to body each time (accumulating listeners, duplicate ids).
8. Event-line drag ignores time-range offset (hit-test uses absolute `evt.x` on a trimmed axis; written value lacks `+effectiveStart`).
9. `resetDefaults` does not refresh `#tempInfo`/chart and persists immediately (Cancel cannot undo).
10. `createTCMarkers` is re-run by `toggleTC`, `loadSheet` and layout load, resetting dragged positions. Marker percent positions are relative to `#layoutCanvasWrap` (and refer to the marker top-left while CSS centers with translate(-50%,-50%)), but PNG maps them onto the contained image box, so exported marker placement differs from screen.
11. Duration stat: screen `totalRows`, PNG `effectiveRows`; PNG activation time absolute, on-screen result relative to trimmed range (possibly negative).
12. Validation covers 30 samples (start..start+29), box spans start..start+30, and `activationEnd<=effectiveEnd` is required, so a window running past the data end is NOK even if existing samples are in range.
13. Activation/cooling/min/max ignore TC visibility and time range; `yMax` fixed 80 (higher data/adhesive max clipped).
14. PNG: double triangle in "▲ ▲ Superior"; hardcoded Spanish sub-labels in EN; `exportTitle` unused; cooling line not offset-adjusted; legend can overflow canvas width; cooling params column often dropped; export Chart never destroyed; `devicePixelRatio` handling on `responsive:false` temp chart may change resolution before `drawImage` scaling.
15. `applyTimeRange`: `parseInt` truncates decimals; no `start>=totalRows` check (empty chart).
16. `testDate` input and `#sheetTitle` exist only in the multi-sheet container; single-sheet files can't set a date (filename `SinFecha`).
17. `handleFile` marks drop zone loaded and shows filename even if parsing fails; re-selecting same file doesn't retrigger `change`.
18. `loadDefaults` doesn't validate shape; partial JSON would crash on `currentDefaults.waterbase.min`.
19. Cooling elapsed time prints raw float difference for non-integer start; negative start impossible via `getActiveEvents` but `hasCoolingEvents`/`coolingStartTime` use raw parseFloat (negative start would be accepted by the cooling check: `Math.floor` negative -> `col[-1]` undefined, `undefined!==null` true, `undefined<=t` false).
20. `toggleLangMenu` actually toggles the language directly; inline `onclick` handlers rely on globals.
21. `setSubstrate` doesn't re-render; substrate never affects calculations (PP shows "Needs Flame: YES").
22. Password gate is client-side only; password hardcoded at line 3130.
