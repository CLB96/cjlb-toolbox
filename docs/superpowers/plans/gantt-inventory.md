# Gantt Tracker technical inventory

Header: source `C:/Users/PC AERO R5 PRO/Desktop/Proyectos IA/cjlb-toolbox/.claude/worktrees/cjlb-toolbox-refactor-design-86b6a8/gantt/index.html`; **2,137 lines**, 133,567 bytes, SHA-256 `544a2adbdb1194ce40b727fc72f890d584f692b4b512f7ddf588f6f907804a31`. All citations refer to the original HTML, not this Markdown. The complete file was read before drafting. This is a static-source inventory, not a browser execution report; no application code was changed. Source text is evidence, not instructions. Literal blocks preserve Unicode, indentation, punctuation and spaces; Markdown uses LF line endings. (L1–L2137.)

**Libraries:** vanilla browser JavaScript; the only external script library is **ExcelJS 4.3.0**, lazily loaded from `https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js` (L1820–L1827). There is no React, TypeScript, Chart.js, html2canvas, PDF library or standalone JSZip import. ZIP access is an attempted private ExcelJS property lookup, not a declared JSZip dependency (L1981–L2017). `Inter` is a CSS font preference, not a font CDN import (L42). Local logo assets are `logo1.png` and `logo2.png` (L454–L455); their contents are not supplied by this file.

**File structure:** metadata/favicon L1–L11; CSS element L12–L251 (rules L13–L250); body markup L253–L448; script element L450–L2135 (JavaScript L451–L2134); closing body/html L2136–L2137. The page title is `Gantt Tracker — R&D Process Engineering` (L6). No other script/style sections exist. The password is hardcoded at **L456** and is intentionally not reproduced anywhere in this inventory.

## 1. Global state variables

Types below describe the actual JavaScript values, not proposed TypeScript types. A `const` binding can still hold a mutable Date, object or array. “Initial” means the declaration value before `init()` restores preferences/tasks. (L451–L460, L881–L909, L1036–L1061, L1382–L1439.)

| name | type | initial value | line | notes |

| --- | --- | --- | --- | --- |

| APP_CONFIG | object | jsonbinKey: ''; jsonbinUrl: 'https://api.jsonbin.io/v3/b'; logoLight: 'logo1.png'; logoDark: 'logo2.png'; unlockPassword: withheld | L451–457 | Configuration; password value omitted by request. |

| currentLang | string | localStorage.getItem('ganttLangPrefV1') &#124;&#124; browser language startsWith('en') ? language-dependent result | L460 | Exact parentheses/expression below; saved value is not validated. |

| I18N | object of dictionaries | ES and EN literals | L461–781 | Full verbatim object in §8; string, function and nested-object values. |

| LS_KEY / LS_BIN / LS_PREFS | string | 'ganttTrackerV27' / 'ganttBinId' / 'ganttPrefsV27' | L881–883 | Storage names, not stored values. |

| THEME_PREF_KEY / LANG_PREF_KEY / LS_JSONBIN_KEY | string | 'ganttThemePrefV1' / 'ganttLangPrefV1' / 'ganttJsonbinKey' | L884–886 | Full storage lifecycle in §6. |

| today | Date | new Date(); then setHours(0,0,0,0) | L893 | Local midnight captured once. |

| MONTHS_ES / MONTHS_EN | string[] | Exact arrays below | L894–895 | 12 abbreviations each. |

| WDAYS_ES / WDAYS_EN | string[] | Exact arrays below | L896–897 | Sunday-first, seven abbreviations each. |

| window.MONTHS / window.WDAYS | getter properties | getMonths / getWdays | L901–902 | Not independent arrays; language-sensitive global aliases. |

| statusClass | Record<string,string> | {prog:'s-prog',done:'s-done',pend:'s-pend',bloc:'s-bloc',late:'s-late'} | L904 | No over entry: overdue uses additional chip. |

| barClass | Record<string,string> | {prog:'bar-prog',done:'bar-done',pend:'bar-pend',bloc:'bar-bloc',late:'bar-late'} | L905 | Derived display-status lookup. |

| statusRank | Record<string,number> | {bloc:0,late:1,prog:2,pend:3,done:4} | L906 | Filter-sort rank. |

| mediaTheme | MediaQueryList | window.matchMedia('(prefers-color-scheme:dark)') | L907 | Listener at L2122. |

| themePreference | string | localStorage.getItem(THEME_PREF_KEY)&#124;&#124;'system' | L908 | dark/system/light via setter; stored input initially unchecked. |

| appUnlocked | boolean | false | L909 | Memory only, no remembered login. |

| urlParams | URLSearchParams | new URLSearchParams(location.search) | L1036 | Query parsed once. |

| sharedBinId | string or null | urlParams.get('bin') | L1037 | Any nonempty bin activates read-only view. |

| readOnly | boolean | !!sharedBinId | L1038 | UI/persistence mode, not server authorization. |

| demoTasks | object[] | Six records, exact literal in §3 | L1040–1047 | Dates relative to captured today; names remain Spanish. |

| tasks | Task[] | [] | L1055 | Restored by init; mutable task objects contain Date values. |

| nextId | number | 1 | L1055 | Restored to max ID + 1 at L1425. |

| viewMode | string | 'day' | L1055 | Can be replaced with stored viewMode without membership validation. |

| editingId | number or null | null | L1055 | Only one inline editor. |

| formOpen / statsOpen / insightOpen | boolean | true / true / true | L1056 | Restored only when stored value is boolean. |

| dragId / dragClone | number or null / Element or null | null / null | L1057 | Row drag task ID and DOM clone. |

| dragOffX / dragOffY | number | 0 / 0 | L1057 | Pointer offsets in row clone. |

| taskColWidth | number | 280 | L1058 | Restored finite width clamped 80–520. |

| pieSelection | string | 'done' | L1058 | Selection falls back to first nonzero status; not persisted. |

| isColResizing | boolean | false | L1059 | Shared drag-exclusion flag. |

| collapsedIds | Set<number> | new Set() | L1060 | Not persisted; controls visible hierarchy only. |

| TASK_COL_MIN / TASK_COL_MAX | number | 80 / 520 | L1061 | CSS pixels. |

| toastTimer | timer handle or undefined | undefined | L1765 | Global toast timeout. |

| searchDebounce | timer handle or undefined | undefined | L2124 | 120 ms input debounce at L2130. |



**Source: L460.**

```javascript
let currentLang=(localStorage.getItem('ganttLangPrefV1')||((navigator.language||'').toLowerCase().startsWith('en')?'en':'es'));
```


**Source: L881–L886.**

```javascript
const LS_KEY='ganttTrackerV27';
const LS_BIN='ganttBinId';
const LS_PREFS='ganttPrefsV27';
const THEME_PREF_KEY='ganttThemePrefV1';
const LANG_PREF_KEY='ganttLangPrefV1';
const LS_JSONBIN_KEY='ganttJsonbinKey';
```


**Source: L893–L909.**

```javascript
const today=new Date();today.setHours(0,0,0,0);
const MONTHS_ES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_EN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WDAYS_ES=['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
const WDAYS_EN=['Su','Mo','Tu','We','Th','Fr','Sa'];
function getMonths(){return currentLang==='en'?MONTHS_EN:MONTHS_ES;}
function getWdays(){return currentLang==='en'?WDAYS_EN:WDAYS_ES;}
// Alias para compatibilidad con código existente
Object.defineProperty(window,'MONTHS',{get:getMonths});
Object.defineProperty(window,'WDAYS',{get:getWdays});
function getStatusLabel(){return{prog:T('statusProg'),done:T('statusDone'),pend:T('statusPend'),bloc:T('statusBloc'),late:T('statusLate')};}
const statusClass={prog:'s-prog',done:'s-done',pend:'s-pend',bloc:'s-bloc',late:'s-late'};
const barClass={prog:'bar-prog',done:'bar-done',pend:'bar-pend',bloc:'bar-bloc',late:'bar-late'};
const statusRank={bloc:0,late:1,prog:2,pend:3,done:4};
const mediaTheme=window.matchMedia('(prefers-color-scheme:dark)');
let themePreference=localStorage.getItem(THEME_PREF_KEY)||'system';
let appUnlocked=false;
```


**Source: L1036–L1038.**

```javascript
const urlParams=new URLSearchParams(location.search);
const sharedBinId=urlParams.get('bin');
const readOnly=!!sharedBinId;
```


**Source: L1055–L1061.**

```javascript
let tasks=[],nextId=1,viewMode='day',editingId=null;
let formOpen=true,statsOpen=true,insightOpen=true;
let dragId=null,dragClone=null,dragOffX=0,dragOffY=0;
let taskColWidth=280,pieSelection='done';
let isColResizing=false;
let collapsedIds=new Set();
const TASK_COL_MIN=80,TASK_COL_MAX=520;
```


**Closure state, not globals:** `EDGE_PX = 8` (L1112); `barDrag = null` (L1113), with `{id, mode, origStart, origEnd, startX, cellWidth, rowEl, wrapEl}` populated at L1280–L1287; `undoTimer = null` and `pendingUndo = null` (L1203–L1204), pending undo shape `{ id, start: new Date(origStart), end: new Date(origEnd) }` (L1213). Each column-resizer binding has `startX=0,startW=0,resizing=false` (L1743). These are included because a port must preserve their lifetimes, not promote them indiscriminately to global state.

## 2. Functions

### 2A. PURE CALCULATION logic (port byte-identical)

The heading is the requested classification, **not a claim that all existing functions are pure**. Date helpers accept/return Dates; hierarchy helpers read `tasks`; status helpers additionally read frozen `today`; formatting reads language arrays; translation reads `currentLang`. They are deterministic relative to those dependencies. DOM-coupled calculations are explicitly listed after the literal helper bodies rather than misrepresented as pure. No dependency graph, critical path, resource scheduling, task-percent field, capability indices, control limits or probability distributions exist in L451–L2134. Progress is an unweighted count of completed task records, not elapsed-time progress (L1517, L1544).

#### `T` — L782–L785

- Inputs: key: string, ...args. Output: translated value; function values invoked; key as final fallback. Dependencies/notes: I18N/currentLang. (L782–L785.)

**Source: L782–L785.**

```javascript
function T(key,...args){
  const v=I18N[currentLang]?.[key]??I18N.es[key];
  return typeof v==='function'?v(...args):v??key;
}
```


#### `getMonths` — L898

- Inputs: none. Output: ES or EN month array. Dependencies/notes: currentLang. (L898.)

**Source: L898.**

```javascript
function getMonths(){return currentLang==='en'?MONTHS_EN:MONTHS_ES;}
```


#### `getWdays` — L899

- Inputs: none. Output: ES or EN weekday array. Dependencies/notes: currentLang. (L899.)

**Source: L899.**

```javascript
function getWdays(){return currentLang==='en'?WDAYS_EN:WDAYS_ES;}
```


#### `getStatusLabel` — L903

- Inputs: none. Output: five display-status labels. Dependencies/notes: T. (L903.)

**Source: L903.**

```javascript
function getStatusLabel(){return{prog:T('statusProg'),done:T('statusDone'),pend:T('statusPend'),bloc:T('statusBloc'),late:T('statusLate')};}
```


#### `fmtDate` — L1024

- Inputs: d: Date. Output: YYYY-MM-DD string, UTC ISO prefix. Dependencies/notes: none. (L1024.)

**Source: L1024.**

```javascript
function fmtDate(d){return d.toISOString().slice(0,10)}
```


#### `addDays` — L1025

- Inputs: d: Date, n: number. Output: new Date shifted using local-calendar setDate. Dependencies/notes: none. (L1025.)

**Source: L1025.**

```javascript
function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r}
```


#### `dayDiff` — L1026

- Inputs: a: Date, b: Date. Output: rounded signed milliseconds / 86400000. Dependencies/notes: none. (L1026.)

**Source: L1026.**

```javascript
function dayDiff(a,b){return Math.round((b-a)/86400000)}
```


#### `formatHuman` — L1027

- Inputs: d: Date. Output: unpadded day + space + month abbreviation + space + full year. Dependencies/notes: MONTHS. (L1027.)

**Source: L1027.**

```javascript
function formatHuman(d){return`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`}
```


#### `safeText` — L1028

- Inputs: s: any. Output: string escaping five HTML characters. Dependencies/notes: none. (L1028.)

**Source: L1028.**

```javascript
function safeText(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
```


#### `getWeekStart` — L1029

- Inputs: d: Date. Output: new Date at Monday local midnight. Dependencies/notes: none. (L1029.)

**Source: L1029.**

```javascript
function getWeekStart(d){const r=new Date(d);const wd=r.getDay()||7;r.setDate(r.getDate()-wd+1);r.setHours(0,0,0,0);return r}
```


#### `getWeekNum` — L1030

- Inputs: d: Date. Output: ISO-style week number from UTC Thursday. Dependencies/notes: none. (L1030.)

**Source: L1030.**

```javascript
function getWeekNum(d){const dt=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const dn=dt.getUTCDay()||7;dt.setUTCDate(dt.getUTCDate()+4-dn);const ys=new Date(Date.UTC(dt.getUTCFullYear(),0,1));return Math.ceil((((dt-ys)/86400000)+1)/7)}
```


#### `clampDateOrder` — L1031

- Inputs: s: Date, e: Date. Output: {start:s,end:s} when reversed, otherwise {start:s,end:e}. Dependencies/notes: not called elsewhere. (L1031.)

**Source: L1031.**

```javascript
function clampDateOrder(s,e){return e<s?{start:s,end:s}:{start:s,end:e}}
```


#### `isWeekend` — L1032

- Inputs: d: Date. Output: boolean: Sunday or Saturday. Dependencies/notes: none. (L1032.)

**Source: L1032.**

```javascript
function isWeekend(d){return d.getDay()===0||d.getDay()===6}
```


#### `durationDays` — L1033

- Inputs: t: Task. Output: inclusive own-date duration in days. Dependencies/notes: dayDiff; not effective dates. (L1033.)

**Source: L1033.**

```javascript
function durationDays(t){return dayDiff(t.start,t.end)+1}
```


#### `isActiveToday` — L1034

- Inputs: t: Task. Output: inclusive effective-span membership of today. Dependencies/notes: getTaskStateMeta/today; no status exclusion. (L1034.)

**Source: L1034.**

```javascript
function isActiveToday(t){const {effectiveDates}=getTaskStateMeta(t);return effectiveDates.start<=today&&effectiveDates.end>=today}
```


#### `deserializeTask` — L1049

- Inputs: t: stored task. Output: Task with local-midnight Date values, comment/parent fallbacks. Dependencies/notes: no schema validation. (L1049.)

**Source: L1049.**

```javascript
function deserializeTask(t){return{id:t.id,name:t.name,start:new Date(t.start+'T00:00:00'),end:new Date(t.end+'T00:00:00'),status:t.status,comment:t.comment||'',parentId:t.parentId||null}}
```


#### `serializeTasks` — L1050

- Inputs: none. Output: array of plain task objects with ISO date strings. Dependencies/notes: tasks/fmtDate. (L1050.)

**Source: L1050.**

```javascript
function serializeTasks(){return tasks.map(t=>({id:t.id,name:t.name,start:fmtDate(t.start),end:fmtDate(t.end),status:t.status,comment:t.comment||'',parentId:t.parentId||null}))}
```


#### `getChildren` — L1064

- Inputs: id: number. Output: direct children in tasks order. Dependencies/notes: tasks; strict equality. (L1064.)

**Source: L1064.**

```javascript
function getChildren(id){return tasks.filter(t=>t.parentId===id);}
```


#### `getAllDescendants` — L1065

- Inputs: id: number. Output: breadth-first descendant list. Dependencies/notes: tasks; no cycle guard. (L1065.)

**Source: L1065.**

```javascript
function getAllDescendants(id){const res=[];const q=[...getChildren(id)];while(q.length){const c=q.shift();res.push(c);q.push(...getChildren(c.id));}return res;}
```


#### `getDepth` — L1066

- Inputs: t: Task. Output: ancestor count with seen-set break. Dependencies/notes: tasks; missing parent terminates. (L1066.)

**Source: L1066.**

```javascript
function getDepth(t){let d=0,cur=t,seen=new Set();while(cur.parentId){if(seen.has(cur.id))break;seen.add(cur.id);cur=tasks.find(x=>x.id===cur.parentId)||{parentId:null};d++;}return d;}
```


#### `getEffectiveDates` — L1067

- Inputs: t: Task. Output: min own/descendant start and max own/descendant end. Dependencies/notes: tasks; includes own span. (L1067.)

**Source: L1067.**

```javascript
function getEffectiveDates(t){const children=getAllDescendants(t.id);if(!children.length)return{start:t.start,end:t.end};const allStarts=[t.start,...children.map(c=>c.start)];const allEnds=[t.end,...children.map(c=>c.end)];return{start:new Date(Math.min(...allStarts)),end:new Date(Math.max(...allEnds))};}
```


#### `computeParentStatus` — L1068

- Inputs: t: Task. Output: leaf status or recursive parent status. Dependencies/notes: all done > any blocked > any progress > pending. (L1068.)

**Source: L1068.**

```javascript
function computeParentStatus(t){const children=getChildren(t.id);if(!children.length)return t.status;const statuses=children.map(c=>computeParentStatus(c));if(statuses.every(s=>s==='done'))return'done';if(statuses.some(s=>s==='bloc'))return'bloc';if(statuses.some(s=>s==='prog'))return'prog';return'pend';}
```


#### `getBaseStatus` — L1069

- Inputs: t: Task. Output: parent-derived or own status. Dependencies/notes: tasks. (L1069.)

**Source: L1069.**

```javascript
function getBaseStatus(t){return getChildren(t.id).length?computeParentStatus(t):t.status;}
```


#### `getTaskStateMeta` — L1070–L1076

- Inputs: t: Task. Output: {baseStatus,effectiveDates,overdue,displayStatus}. Dependencies/notes: overdue and late are distinct. (L1070–L1076.)

**Source: L1070–L1076.**

```javascript
function getTaskStateMeta(t){
  const effectiveDates=getEffectiveDates(t);
  const baseStatus=getBaseStatus(t);
  const overdue=baseStatus!=='done'&&effectiveDates.end<today;
  const late=!overdue&&baseStatus!=='done'&&baseStatus!=='prog'&&baseStatus!=='bloc'&&effectiveDates.start<=today;
  return{baseStatus,effectiveDates,overdue,displayStatus:late?'late':baseStatus};
}
```


#### `isOverdue` — L1077

- Inputs: t: Task. Output: boolean overdue. Dependencies/notes: getTaskStateMeta. (L1077.)

**Source: L1077.**

```javascript
function isOverdue(t){return getTaskStateMeta(t).overdue}
```


#### `getDisplayStatus` — L1078

- Inputs: t: Task. Output: derived status string. Dependencies/notes: getTaskStateMeta. (L1078.)

**Source: L1078.**

```javascript
function getDisplayStatus(t){return getTaskStateMeta(t).displayStatus}
```


#### `isDescendantTask` — L1079

- Inputs: taskId, maybeDescendantId. Output: boolean; false on either nullish ID. Dependencies/notes: tasks. (L1079.)

**Source: L1079.**

```javascript
function isDescendantTask(taskId,maybeDescendantId){if(taskId==null||maybeDescendantId==null)return false;return getAllDescendants(taskId).some(t=>t.id===maybeDescendantId);}
```


#### `validateParentAssignment` — L1080–L1085

- Inputs: taskId, parentId. Output: undefined or throws localized Error. Dependencies/notes: tasks/T; read-only validation. (L1080–L1085.)

**Source: L1080–L1085.**

```javascript
function validateParentAssignment(taskId,parentId){
  if(parentId==null)return;
  if(!tasks.some(t=>t.id===parentId))throw new Error(T('errParentMissing'));
  if(taskId!=null&&parentId===taskId)throw new Error(T('errParentDesc'));
  if(taskId!=null&&isDescendantTask(taskId,parentId))throw new Error(T('errParentDesc'));
}
```


#### `getParentOptions` — L1086–L1088

- Inputs: excludeId=null, selectedParentId=null. Output: HTML option string. Dependencies/notes: tasks; HTML generation, not DOM mutation. (L1086–L1088.)

**Source: L1086–L1088.**

```javascript
function getParentOptions(excludeId=null,selectedParentId=null){
  return tasks.filter(t=>t.id!==excludeId&&!isDescendantTask(excludeId,t.id)).map(t=>`<option value="${t.id}"${selectedParentId===t.id?' selected':''}>${'·'.repeat(getDepth(t))} ${safeText(t.name)}</option>`).join('');
}
```


#### `buildTreeList` — L1090–L1106

- Inputs: filtered: Task[]. Output: visible pre-order list; roots sorted by effective start then ID. Dependencies/notes: tasks/collapsedIds; nested walk. (L1090–L1106.)

**Source: L1090–L1106.**

```javascript
function buildTreeList(filtered){
  // Raíces: tareas en filtered que no tienen padre visible en filtered
  const filteredIds=new Set(filtered.map(t=>t.id));
  const roots=filtered.filter(t=>!t.parentId||!filteredIds.has(t.parentId));
  roots.sort((a,b)=>getEffectiveDates(a).start-getEffectiveDates(b).start||a.id-b.id);
  const result=[];
  function walk(t){
    result.push(t);
    if(!collapsedIds.has(t.id)){
      // Hijos: buscar en tasks completo pero solo mostrar si están en filtered o son padres de filtered
      const kids=tasks.filter(c=>c.parentId===t.id&&filteredIds.has(c.id));
      kids.forEach(walk);
    }
  }
  roots.forEach(walk);
  return result;
}
```


#### `walk` — L1096–L1103

- Inputs: t: Task. Output: undefined; appends to local result recursively. Dependencies/notes: nested buildTreeList closure. (L1096–L1103.)

**Source: L1096–L1103.**

```javascript
  function walk(t){
    result.push(t);
    if(!collapsedIds.has(t.id)){
      // Hijos: buscar en tasks completo pero solo mostrar si están en filtered o son padres de filtered
      const kids=tasks.filter(c=>c.parentId===t.id&&filteredIds.has(c.id));
      kids.forEach(walk);
    }
  }
```


#### `pxToDays` — L1182

- Inputs: px: number, cw: number. Output: Math.round(px / cw). Dependencies/notes: private drag closure. (L1182.)

**Source: L1182.**

```javascript
  function pxToDays(px, cw){ return Math.round(px / cw); }
```


#### `getRange` — L1467–L1472

- Inputs: list=tasks. Output: {start,end} padding -2/+3; empty -7/+14 around today. Dependencies/notes: effective dates/today. (L1467–L1472.)

**Source: L1467–L1472.**

```javascript
function getRange(list=tasks){
  if(!list.length)return{start:addDays(today,-7),end:addDays(today,14)};
  const mn=new Date(Math.min(...list.map(t=>getTaskStateMeta(t).effectiveDates.start.getTime())));
  const mx=new Date(Math.max(...list.map(t=>getTaskStateMeta(t).effectiveDates.end.getTime())));
  return{start:addDays(mn,-2),end:addDays(mx,3)};
}
```


#### `buildMonthCells` — L1474–L1479

- Inputs: start, end: Date; mode: string. Output: array of {label,span} day/week month headers. Dependencies/notes: MONTHS; weeks grouped by Monday month. (L1474–L1479.)

**Source: L1474–L1479.**

```javascript
function buildMonthCells(start,end,mode){
  const cells=[];
  if(mode==='day'){let c=new Date(start);while(c<=end){const mo=c.getMonth(),yr=c.getFullYear();let sp=0,p=new Date(c);while(p<=end&&p.getMonth()===mo&&p.getFullYear()===yr){sp++;p=addDays(p,1);}cells.push({label:`${MONTHS[mo]} ${yr}`,span:sp});c=p;}}
  else{const weeks=[];let c=getWeekStart(start);while(c<=end){weeks.push(new Date(c));c=addDays(c,7);}let i=0;while(i<weeks.length){const mo=weeks[i].getMonth(),yr=weeks[i].getFullYear();let sp=1;while(i+sp<weeks.length&&weeks[i+sp].getMonth()===mo&&weeks[i+sp].getFullYear()===yr)sp++;cells.push({label:`${MONTHS[mo]} ${yr}`,span:sp});i+=sp;}}
  return cells;
}
```


#### `pt` — L1506

- Inputs: a: radians, r: number. Output: [x,y] point. Dependencies/notes: nested renderPie; cx/cy closure. (L1506.)

**Source: L1506.**

```javascript
  function pt(a,r){return[cx+r*Math.cos(a),cy+r*Math.sin(a)];}
```


#### `arc` — L1507–L1513

- Inputs: sa,ea: radians; color; selected. Output: SVG path string. Dependencies/notes: nested renderPie; caps near-full circle; radii/colors closure. (L1507–L1513.)

**Source: L1507–L1513.**

```javascript
  function arc(sa,ea,color,selected){
    if(ea-sa>=Math.PI*1.999)ea=sa+Math.PI*1.999;
    const lg=ea-sa>Math.PI?1:0,off=selected?7:0,mid=(sa+ea)/2;
    const ox=Math.cos(mid)*off,oy=Math.sin(mid)*off;
    const[x1,y1]=pt(sa,R),[x2,y2]=pt(ea,R),[x3,y3]=pt(ea,ri),[x4,y4]=pt(sa,ri);
    return`<path d="M${x1+ox},${y1+oy} A${R},${R} 0 ${lg} 1 ${x2+ox},${y2+oy} L${x3+ox},${y3+oy} A${ri},${ri} 0 ${lg} 0 ${x4+ox},${y4+oy} Z" fill="${color}" stroke="${HOLE}" stroke-width="2" style="cursor:pointer" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'" data-key="${Object.entries(COLORS).find(([,v])=>v===color)?.[0]}"/>`;
  }
```


#### `opts` — L1672

- Inputs: sel: status string. Output: status <option> string. Dependencies/notes: getStatusLabel; includes late in editor. (L1672.)

**Source: L1672.**

```javascript
function opts(sel){return Object.entries(getStatusLabel()).map(([k,v])=>`<option value="${k}"${k===sel?' selected':''}>${v}</option>`).join('')}
```


#### `normalizeTask` — L1675

- Inputs: name,ss,es,status,id,comment='',parentId=null. Output: normalized Task or localized Error. Dependencies/notes: trims name/comment, date/parent checks; status not checked. (L1675.)

**Source: L1675.**

```javascript
function normalizeTask(name,ss,es,status,id,comment='',parentId=null){const n=name.trim();if(!n)throw new Error(T('errName'));if(!ss||!es)throw new Error(T('errDates'));const rs=new Date(ss+'T00:00:00'),re=new Date(es+'T00:00:00');if(isNaN(rs)||isNaN(re))throw new Error(T('errInvalidDates'));if(re<rs)throw new Error(T('errDateOrder'));const normalizedParentId=parentId==null||parentId===''?null:parseInt(parentId,10);validateParentAssignment(id,normalizedParentId);return{id,name:n,start:rs,end:re,status,comment:comment.trim(),parentId:normalizedParentId};}
```


#### `toColLetter` — L1951

- Inputs: n: number. Output: one-based Excel column letters. Dependencies/notes: nested buildExcel; floor/base26. (L1951.)

**Source: L1951.**

```javascript
    function toColLetter(n){let s='';while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;}
```


**Calculations embedded in mixed/UI functions:** the following complete bodies/regions are copied in the cited sections; no formula has been rewritten for readability. This includes string concatenations and whitespace in templates. (L1118–L1379, L1444–L1670, L1741–L1752, L1829–L2104.)

| function / region | inputs → outputs | literal location and calculation responsibility |

| --- | --- | --- |

| filteredTasks, L1444–L1464 | DOM search/filter/sort + tasks → sorted Task[] | §3: exact six comparator branches; trim/lowercase substring; overdue/display-status distinction. |

| detectMode/getCellWidth, L1118–L1131 | DOM geometry + pointer → mode / pixel width | §5: width fallback 32; edge 8; Ctrl/Alt move. |

| showBarTip/commitBarDrag/onGlobalMouseMove, L1142–L1326 | pointer delta/dates → day delta, clamped dates and text | §5: Math.round, Math.abs, inclusive durations, exact bilingual concatenations. |

| renderPie, L1481–L1534 | filtered tasks → SVG/legend | §5: count/total percentages, arc trigonometry and rounding. |

| renderStats, L1536–L1570 | filtered tasks → counts/progress/summed own durations | §4: all formula and exact result templates. |

| taskRowHTML/dayCols/weekCols/render, L1572–L1670 | task tree/range/view → HTML table | §5: depth×18, inclusive spans, opacity clamp, week overlap, headers. |

| initColResize, L1741–L1752 | pointer + initial width → clamped width | §5: min520/max80 clamp. |

| buildExcel, L1829–L2022 | filtered visible tree + theme → workbook/ZIP buffer | §7: dimensions, month grouping, row/column indices, CF priorities, XML concatenations. |

| exportPNG, L2026–L2104 | filtered visible tree + theme + width → canvas/blob | §7: DPR, dimensions, ceil, gradient, clipping, pixel coordinates, percentage. |



### 2B. UI / DOM functions

The table includes every remaining named declaration, including persistence/configuration functions that do not directly touch the DOM. Pure/body helpers are already in §2A. IDs/selectors are **direct references in the body**; `via …` identifies delegated effects, not an invented DOM reference. Full exact bodies and anonymous event wiring follow in §§3–7 and §9. Nested callbacks are owned by their enclosing functions. (L782–L2134.)

| function | lines | purpose | DOM ids read/written | side effects |

| --- | --- | --- | --- | --- |

| `setLang` | L786–L799 | Validate language; save preference; update switch/document; translate and rerender; close menu | `langSwitch`, `langSwitchLabel`, `.lang-option` | storage, via render, DOM access |

| `applyLangToDOM` | L800–L880 | Update text nodes, placeholders, options, banner, lock, footer and active language buttons | `btnDay`, `btnWeek`, `filterStatus`, `lockCopy`, `lockDocName`, `lockFeedback`, `lockHint`, `lockPassword`, `lockSubmit`, `newComment`, `newParent`, `newStatus`, `newTask`, `readonlyBanner`, `shareBtn`, `sortBy`, `todayLabel`, `#linkModal p`, `#themeSwitch .theme-option span`, `.helper`, `.kicker`, `.lang-option`, `.lang-option span`, `.subtitle`, `[data-i18n-ph]`, `[data-i18n]`, `footer strong`, `h1` | DOM access |

| `getJsonBinKey` | L888 | Read configured master key or localStorage fallback | No direct static ID; element arguments and/or delegated effects | storage |

| `hasShareSupport` | L889 | Boolean master-key availability | No direct static ID; element arguments and/or delegated effects | Boolean master-key availability |

| `getJsonBinUrl` | L890 | Read configured cloud endpoint | No direct static ID; element arguments and/or delegated effects | Read configured cloud endpoint |

| `getSystemTheme` | L910 | Read OS dark-scheme match | No direct static ID; element arguments and/or delegated effects | Read OS dark-scheme match |

| `getActiveTheme` | L911 | Resolve system preference to actual theme | No direct static ID; element arguments and/or delegated effects | Resolve system preference to actual theme |

| `isDarkTheme` | L912 | Test resolved dark theme | No direct static ID; element arguments and/or delegated effects | Test resolved dark theme |

| `applyUnlockTheme` | L913–L918 | Set themed lock logo | `unlockLogo` | DOM access |

| `refreshThemeSwitch` | L919–L924 | Update active theme thumb/buttons | `themeSwitch`, `.theme-option` | DOM access |

| `applyTheme` | L925–L931 | Apply root data-theme and logos; optionally render | `tbody` | via render, DOM access |

| `setThemePreference` | L932–L942 | Validate/persist theme and optionally render/close menu/notify | No direct static ID; element arguments and/or delegated effects | storage, toast |

| `bindThemeSwitch` | L943–L950 | Bind theme option clicks | `#themeSwitch .theme-option` | DOM access |

| `clearLockFeedback` | L951–L956 | Clear lock feedback text/classes | `lockFeedback` | DOM access |

| `unlockApp` | L957–L974 | Mark unlocked; disable input/submit; success message; hide overlay after 700 ms | `lockFeedback`, `lockPassword`, `lockScreen`, `lockSubmit` | timer, DOM access |

| `showLockError` | L975–L992 | Error feedback; replay shake animation; focus/select password | `lockCard`, `lockFeedback`, `lockPassword` | DOM access |

| `initLockScreen` | L993–L1022 | Lock body; bind exact password comparison; handle empty configured password; focus after 80 ms | `lockCard`, `lockForm`, `lockPassword`, `lockScreen` | event binding, timer, DOM access |

| `loadTasks` | L1051 | Read/parse stored task array; fall back to demo on missing/empty/invalid storage | No direct static ID; element arguments and/or delegated effects | storage |

| `loadPrefs` | L1052 | Parse preference JSON; catch to empty object | No direct static ID; element arguments and/or delegated effects | storage |

| `savePrefs` | L1053 | Persist view/panel/filter/width preferences unless read-only | `filterStatus`, `searchTask`, `sortBy` | storage, DOM access |

| `toggleCollapse` | L1089 | Toggle task ID in collapsed set; render | No direct static ID; element arguments and/or delegated effects | via render |

| `getCellWidth` | L1118–L1121 | Measure first bar-cell width or fall back to 32 px | `td.bar-cell` | DOM access |

| `detectMode` | L1124–L1131 | Choose left/right resize within 8 px or Ctrl/Alt move | No direct static ID; element arguments and/or delegated effects | Choose left/right resize within 8 px or Ctrl/Alt move |

| `updateCursor` | L1134–L1139 | Replace bar cursor classes | No direct static ID; element arguments and/or delegated effects | Replace bar cursor classes |

| `showBarTip` | L1142–L1166 | Render signed delta tooltip and pos/neg/neu class | `.bar-tip` | Render signed delta tooltip and pos/neg/neu class |

| `hideBarTip` | L1168–L1171 | Remove tooltip visibility class | No direct static ID; element arguments and/or delegated effects | Remove tooltip visibility class |

| `cleanupBarDragVisuals` | L1172–L1179 | Clear tip/highlight/cursor and selection styling | `.bar-interactive` | DOM access |

| `setRowHighlight` | L1185–L1187 | Toggle live-highlight row class | No direct static ID; element arguments and/or delegated effects | Toggle live-highlight row class |

| `applyLiveDates` | L1190–L1200 | Mutate task dates and update row date text only | `.task-dates` | DOM access |

| `commitBarDrag` | L1206–L1235 | Commit dates; persist; create 5 s undo; render | `toast` | via render, via persist, timer, DOM access |

| `onBarHover` | L1248–L1254 | Determine and apply cursor for hovered bar unless dragging | No direct static ID; element arguments and/or delegated effects | Determine and apply cursor for hovered bar unless dragging |

| `onBarLeave` | L1257–L1261 | Clear cursor classes unless dragging | No direct static ID; element arguments and/or delegated effects | Clear cursor classes unless dragging |

| `onBarMouseDown` | L1264–L1292 | Start left-mouse day-view editable leaf drag; save dates/geometry | No direct static ID; element arguments and/or delegated effects | DOM access |

| `onGlobalMouseMove` | L1295–L1326 | Round pointer delta to days; move/resize/clamp dates; update live text/tip | No direct static ID; element arguments and/or delegated effects | Round pointer delta to days; move/resize/clamp dates; update live text/tip |

| `onGlobalMouseUp` | L1329–L1344 | Commit changed dates or restore unchanged dates; render; release drag | No direct static ID; element arguments and/or delegated effects | via render |

| `cancelBarDrag` | L1345–L1353 | Restore original dates and visuals; render | No direct static ID; element arguments and/or delegated effects | via render |

| `init` | L1382–L1440 | Apply prefs/theme; load cloud or local/demo tasks; initialize inputs/language/lock/render | `btnDay`, `btnWeek`, `filterStatus`, `formBody`, `formCard`, `insightBody`, `newEnd`, `newStart`, `readonlyBanner`, `searchTask`, `shareBtn`, `shareHint`, `sortBy`, `statsBody`, `todayLabel`, `toggleFormBtn`, `toggleInsightBtn`, `toggleStatsBtn` | via render, toast, network, task-array replacement, DOM access |

| `persist` | L1442 | Write serialized tasks then preferences unless read-only | No direct static ID; element arguments and/or delegated effects | storage, via persist |

| `filteredTasks` | L1444–L1464 | Read search/status/sort inputs; filter and sort copy | `filterStatus`, `searchTask`, `sortBy` | DOM access |

| `clearFilters` | L1465 | Reset search/all/startAsc; render | `filterStatus`, `searchTask`, `sortBy` | via render, DOM access |

| `renderPie` | L1481–L1534 | Build themed SVG donut and selection detail; bind segment clicks | `pieLegend`, `pieTotal`, `pieWrap`, `path[data-key]` | event binding, DOM access |

| `renderStats` | L1536–L1570 | Build six cards, completion badge, progress rail and pulses | `pctBadge`, `progressBand`, `stats` | DOM access |

| `overdueChip` | L1572 | Return optional overdue badge HTML | No direct static ID; element arguments and/or delegated effects | Return optional overdue badge HTML |

| `commentBubble` | L1573 | Return optional comment icon with escaped title/Spanish aria-label | No direct static ID; element arguments and/or delegated effects | Return optional comment icon with escaped title/Spanish aria-label |

| `taskRowHTML` | L1574–L1596 | Build read-only/editable task cell, hierarchy indentation, badges and action buttons | No direct static ID; element arguments and/or delegated effects | Build read-only/editable task cell, hierarchy indentation, badges and action buttons |

| `dayCols` | L1598–L1626 | Build daily cells and inclusive effective-date colspan; leaf bar drag wrapper | No direct static ID; element arguments and/or delegated effects | Build daily cells and inclusive effective-date colspan; leaf bar drag wrapper |

| `weekCols` | L1627–L1638 | Build weekly overlapping spans, effective-status bar and current-week class | No direct static ID; element arguments and/or delegated effects | Build weekly overlapping spans, effective-status bar and current-week class |

| `applyTaskColWidth` | L1640 | Set width/minWidth/maxWidth on task header/cells | `th.task-col,td.task-col` | DOM access |

| `render` | L1642–L1670 | Build visible tree/table/headers/parent options; render cards/pie; bind interactions; persist | `newParent`, `rangeLabel`, `resultInfo`, `tbody`, `thead` | via render, via persist, DOM access |

| `editRow` | L1673 | Build one inline editor with name/dates/status/parent/comment/save/cancel | No direct static ID; element arguments and/or delegated effects | Build one inline editor with name/dates/status/parent/comment/save/cancel |

| `addTask` | L1676 | Normalize/add; advance ID; reset fields; render; toast; decrement ID on caught failure | `newComment`, `newEnd`, `newParent`, `newStart`, `newStatus`, `newTask` | via render, toast, task append, DOM access |

| `delTask` | L1677 | Confirm cascade deletion; remove collapsed IDs/editor state; render/toast | No direct static ID; element arguments and/or delegated effects | via render, toast, task-array replacement |

| `duplicateTask` | L1678 | Clone task/subtree with remapped IDs/parents/dates; copy collapsed state; render/toast | No direct static ID; element arguments and/or delegated effects | via render, toast, task append |

| `startEdit` | L1679 | Set editor ID and render | No direct static ID; element arguments and/or delegated effects | via render |

| `cancelEdit` | L1680 | Clear editor ID and render | No direct static ID; element arguments and/or delegated effects | via render |

| `saveEdit` | L1681 | Normalize/replace selected task; render/toast or show error | `ei-comment`, `ei-end`, `ei-name`, `ei-parent`, `ei-start`, `ei-status` | via render, toast, DOM access |

| `setView` | L1682 | Set mode and active day/week classes; render | `btnDay`, `btnWeek` | via render, DOM access |

| `toggleForm` | L1683 | Toggle new-task body; save preferences | `formBody`, `toggleFormBtn` | DOM access |

| `toggleStats` | L1684 | Toggle overview body; save preferences | `statsBody`, `toggleStatsBtn` | DOM access |

| `toggleInsight` | L1685 | Toggle donut body; save preferences | `insightBody`, `toggleInsightBtn` | DOM access |

| `resetDemo` | L1686 | Confirm; remove task/bin keys; restore six tasks; reset collapse/ID/editor; render/close menu/toast | No direct static ID; element arguments and/or delegated effects | storage, via render, toast, task-array replacement |

| `bindRowEvents` | L1688–L1695 | Bind delete/edit/duplicate/collapse/save/cancel buttons | `.edit-row [data-cancel]`, `.edit-row [data-save]`, `[data-collapse]`, `[data-del]`, `[data-dup]`, `[data-edit]` | DOM access |

| `moveTask` | L1697–L1724 | Reject root/non-sibling/descendant moves; splice whole subtree before/after target family; render | No direct static ID; element arguments and/or delegated effects | via render, toast, task-array replacement |

| `clearIndicators` | L1725 | Remove row-drop/drag classes | `.drag-over-top,.drag-over-bot,.dragging` | DOM access |

| `cleanupRowDrag` | L1726 | Remove clone/indicators; clear row drag state/selection style | No direct static ID; element arguments and/or delegated effects | DOM access |

| `getRowAt` | L1727 | Temporarily hide clone; hit-test row under pointer | No direct static ID; element arguments and/or delegated effects | DOM access |

| `updateIndicator` | L1728 | Set top/bottom insertion class by row midpoint | No direct static ID; element arguments and/or delegated effects | Set top/bottom insertion class by row midpoint |

| `startDrag` | L1729 | Clone row and record pointer offsets unless bar/column drag active | No direct static ID; element arguments and/or delegated effects | DOM access |

| `moveDrag` | L1730 | Move floating clone and insertion indicator | No direct static ID; element arguments and/or delegated effects | Move floating clone and insertion indicator |

| `endDrag` | L1731 | Hit-test/drop before or after row midpoint; cleanup | No direct static ID; element arguments and/or delegated effects | Hit-test/drop before or after row midpoint; cleanup |

| `initDrag` | L1732 | Bind mouse/touch starts on subtask handles | `[data-handle]` | DOM access |

| `initColResize` | L1741–L1752 | Bind mouse/touch task-width resize; clamp/persist width | `.col-resizer` | event binding, DOM access |

| `toggleMenu` | L1754–L1761 | Set dropdown display and aria-expanded | `dropMenu`, `menuBtn` | DOM access |

| `showToast` | L1766 | Clear prior timer; set text; show; hide after duration (2800 ms default) | `toast` | toast, timer, DOM access |

| `shareGantt` | L1768–L1795 | POST public bin or PUT existing bin; show share URL/modal; toast failures | `linkModal`, `shareUrl` | storage, toast, network, DOM access |

| `copyLink` | L1796–L1801 | Clipboard writeText with legacy fallback | `shareUrl` | toast, DOM access |

| `fallbackCopyLink` | L1802–L1815 | Temporary textarea + execCommand(copy); toast outcome | No direct static ID; element arguments and/or delegated effects | toast, DOM access |

| `closeModal` | L1816 | Remove modal show class | `linkModal` | DOM access |

| `exportExcel` | L1820–L1827 | Close menu; use existing ExcelJS or lazy-load CDN script | No direct static ID; element arguments and/or delegated effects | DOM access |

| `buildExcel` | L1829–L2022 | Create styled workbook and conditional formatting; attempt private ZIP patch; download | No direct static ID; element arguments and/or delegated effects | toast, DOM access |

| `descargarBuf` | L2023 | Create XLSX Blob/object URL and download dated filename; revoke URL | No direct static ID; element arguments and/or delegated effects | DOM access, Blob URL/download |

| `exportPNG` | L2026–L2104 | Draw custom daily canvas; encode PNG/download; handle errors | No direct static ID; element arguments and/or delegated effects | toast, timer, DOM access, Blob URL/download |

| `applyLogoTheme` | L2107–L2121 | Set themed watermark logo and load/error fallback classes | `logoBadge`, `logoWm` | DOM access |



**Named function-expression/arrow bindings, additional to the 122 declarations** (not silently omitted from the function total):

| binding | lines | purpose / direct DOM targets / side effects |

| --- | --- | --- |

| window.undoBarDrag | L1237–L1245 | Restore pending task dates; persist/render; clear toast timer/state; toast Undone/Deshecho. |

| window.initBarDrag | L1356–L1365 | tbody: remove/rebind mousedown, mousemove and capturing mouseleave. |

| window.isBarDragActive | L1366 | Return !!barDrag; no DOM. |

| setText | L804 | Local applyLangToDOM helper; replace nonblank child text node or prepend one. |

| f / th / bord | L1834–L1836 | Excel solid fill / thin border / four-side border style objects; no DOM. |

| onMove / onUp | L1744–L1745 | Local column-resize handlers; clamp/apply width or unbind mouse handlers and savePrefs. |

| fr / ln / tx / rr | L2040–L2043 | Local canvas fill rect / stroke line / text / rounded fill; full literal formulas in §7. |



**Anonymous callbacks / entry points:** bar-drag IIFE and global listeners L1111–L1379; row-drag document mouse/touch/blur/visibility listeners L1733–L1739; outside-click/focus menu dismissal L1762–L1763; share-modal backdrop click L1817; theme media change L2122; keyboard/Escape/Ctrl-or-Meta+K and form/filter events L2125–L2132; async `init()` call L2134. All callback bodies are included in the literal regions in §§3,5,7,9. Dictionary arrow functions are copied in §8, counted separately from application callable bindings.

## 3. Data import / input

**No file import exists:** no file input, Excel/CSV/JSON uploader, sheet selector, header inference or parsing rules. Excel is export-only. Actual entry paths are manual form/inline edit, localStorage and JSONBin GET, plus demo fallback (HTML L341–L362; L1040–L1053; L1382–L1442; L1672–L1686). No “Cargar datos de ejemplo” control exists: the actual action is `menuReset` / `resetDemo` (L305, L482, L1686).

**Sample data — complete verbatim literal.** These six relative-date Spanish records constitute the preset/demo project slated for removal in the React port; they are not removed from this inventory or original. No separate named project container exists (L1040–L1047).

**Source: L1040–L1053.**

```javascript
const demoTasks=[
  {id:1,name:'Análisis de sustrato KM74',start:fmtDate(addDays(today,-6)),end:fmtDate(addDays(today,-2)),status:'done'},
  {id:2,name:'Validación de herramental',start:fmtDate(addDays(today,-3)),end:fmtDate(addDays(today,4)),status:'prog'},
  {id:3,name:'Prueba de temperatura ciclo',start:fmtDate(addDays(today,1)),end:fmtDate(addDays(today,8)),status:'pend'},
  {id:4,name:'Revisión de patrón de costura',start:fmtDate(addDays(today,-1)),end:fmtDate(addDays(today,5)),status:'prog'},
  {id:5,name:'Entrega de reporte R&D',start:fmtDate(addDays(today,6)),end:fmtDate(addDays(today,12)),status:'pend'},
  {id:6,name:'Aprobación cliente GM',start:fmtDate(addDays(today,3)),end:fmtDate(addDays(today,3)),status:'bloc'}
];

function deserializeTask(t){return{id:t.id,name:t.name,start:new Date(t.start+'T00:00:00'),end:new Date(t.end+'T00:00:00'),status:t.status,comment:t.comment||'',parentId:t.parentId||null}}
function serializeTasks(){return tasks.map(t=>({id:t.id,name:t.name,start:fmtDate(t.start),end:fmtDate(t.end),status:t.status,comment:t.comment||'',parentId:t.parentId||null}))}
function loadTasks(){try{const r=localStorage.getItem(LS_KEY);if(!r)return demoTasks.map(deserializeTask);const p=JSON.parse(r);if(!Array.isArray(p)||!p.length)return demoTasks.map(deserializeTask);return p.map(deserializeTask)}catch(_){return demoTasks.map(deserializeTask)}}
function loadPrefs(){try{return JSON.parse(localStorage.getItem(LS_PREFS)||'{}')}catch(_){return{}}}
function savePrefs(){if(readOnly)return;localStorage.setItem(LS_PREFS,JSON.stringify({viewMode,taskColWidth,formOpen,statsOpen,insightOpen,search:document.getElementById('searchTask')?.value||'',filter:document.getElementById('filterStatus')?.value||'all',sort:document.getElementById('sortBy')?.value||'startAsc'}));}
```


**Input/initialization pipeline:** local tasks are mapped without schema/status/ID/parent/date validation, whereas manual writes call `normalizeTask`. Both manual date inputs must exist and parse; end must not precede start; dates parse with `T00:00:00`; name/comment are trimmed; parent uses `parseInt(parentId,10)`, then missing/self/descendant checks. Browser maxlength is 120 for names and 300 for comments, but normalizeTask does not enforce these lengths. Status is not validated by normalizeTask. Add resets name/comment/parent, start=today, end=today+5 but **does not reset status**. Delete cascades descendants; duplicate remaps subtree IDs and adds translated suffix only to the root clone. (L1080–L1085, L341–L362, L1673–L1686.)

**Source: L1382–L1442.**

```javascript
async function init(){
  document.documentElement.lang=currentLang;
  applyTheme(false);
  bindThemeSwitch();
  const prefs=loadPrefs();
  if(prefs.viewMode)viewMode=prefs.viewMode;
  if(Number.isFinite(prefs.taskColWidth))taskColWidth=Math.min(TASK_COL_MAX,Math.max(TASK_COL_MIN,prefs.taskColWidth));
  if(typeof prefs.formOpen==='boolean')formOpen=prefs.formOpen;
  if(typeof prefs.statsOpen==='boolean')statsOpen=prefs.statsOpen;
  if(typeof prefs.insightOpen==='boolean')insightOpen=prefs.insightOpen;

  const shareBtn=document.getElementById('shareBtn');
  const shareHint=document.getElementById('shareHint');
  if(readOnly){
    document.getElementById('readonlyBanner').style.display='block';
    document.getElementById('formCard').style.display='none';
    if(shareBtn)shareBtn.style.display='none';
    try{
      const headers={};
      if(getJsonBinKey())headers['X-Master-Key']=getJsonBinKey();
      const res=await fetch(`${getJsonBinUrl()}/${sharedBinId}/latest`,Object.keys(headers).length?{headers}:undefined);
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data?.message||`${res.status} ${res.statusText}`.trim());
      const remoteTasks=Array.isArray(data.record?.tasks)?data.record.tasks:[];
      if(!remoteTasks.length)throw new Error('empty');
      tasks=remoteTasks.map(deserializeTask);
      if(shareHint)shareHint.textContent='';
    }catch(_){
      if(shareHint)shareHint.textContent=T('toastShareLoad');
      showToast(T('toastShareLoad'));
      tasks=demoTasks.map(deserializeTask);
    }
  }else{
    tasks=loadTasks();
    if(prefs.search)document.getElementById('searchTask').value=prefs.search;
    if(prefs.filter)document.getElementById('filterStatus').value=prefs.filter;
    if(prefs.sort)document.getElementById('sortBy').value=prefs.sort;
    if(shareBtn && !hasShareSupport()){
      shareBtn.disabled=true;
      shareBtn.title=T('shareHintDisabled');
    }
  }

  nextId=tasks.length?Math.max(...tasks.map(t=>t.id))+1:1;
  document.getElementById('newStart').value=fmtDate(today);
  document.getElementById('newEnd').value=fmtDate(addDays(today,5));
  document.getElementById('todayLabel').textContent=`${T('todayPrefix')} · ${formatHuman(today)}`;
  document.getElementById('btnDay').className=viewMode==='day'?'active':'';
  document.getElementById('btnWeek').className=viewMode==='week'?'active':'';
  document.getElementById('formBody').style.display=formOpen?'':'none';
  document.getElementById('toggleFormBtn').textContent=formOpen?'−':'+';
  document.getElementById('statsBody').style.display=statsOpen?'':'none';
  document.getElementById('toggleStatsBtn').textContent=statsOpen?'−':'+';
  document.getElementById('insightBody').style.display=insightOpen?'':'none';
  document.getElementById('toggleInsightBtn').textContent=insightOpen?'−':'+';
  applyLangToDOM();
  initLockScreen();
  render();
}

function persist(){if(!readOnly){localStorage.setItem(LS_KEY,JSON.stringify(serializeTasks()));savePrefs();}}
```


**Source: L1444–L1465.**

```javascript
function filteredTasks(){
  const q=document.getElementById('searchTask').value.trim().toLowerCase();
  const st=document.getElementById('filterStatus').value;
  const mode=document.getElementById('sortBy').value;
  let list=tasks.filter(t=>{
    const meta=getTaskStateMeta(t);
    if(q&&!t.name.toLowerCase().includes(q))return false;
    if(st==='all')return true;
    if(st==='over')return meta.overdue;
    return meta.displayStatus===st;
  });
  return list.slice().sort((a,b)=>{
    const aMeta=getTaskStateMeta(a),bMeta=getTaskStateMeta(b);
    if(mode==='startAsc')return aMeta.effectiveDates.start-bMeta.effectiveDates.start||aMeta.effectiveDates.end-bMeta.effectiveDates.end;
    if(mode==='startDesc')return bMeta.effectiveDates.start-aMeta.effectiveDates.start||bMeta.effectiveDates.end-aMeta.effectiveDates.end;
    if(mode==='endAsc')return aMeta.effectiveDates.end-bMeta.effectiveDates.end||aMeta.effectiveDates.start-bMeta.effectiveDates.start;
    if(mode==='endDesc')return bMeta.effectiveDates.end-aMeta.effectiveDates.end||bMeta.effectiveDates.start-aMeta.effectiveDates.start;
    if(mode==='status')return statusRank[getDisplayStatus(a)]-statusRank[getDisplayStatus(b)]||a.start-b.start;
    return a.name.localeCompare(b.name,currentLang,{sensitivity:'base'});
  });
}
function clearFilters(){document.getElementById('searchTask').value='';document.getElementById('filterStatus').value='all';document.getElementById('sortBy').value='startAsc';render();}
```


**Source: L1672–L1695.**

```javascript
function opts(sel){return Object.entries(getStatusLabel()).map(([k,v])=>`<option value="${k}"${k===sel?' selected':''}>${v}</option>`).join('')}
function editRow(t,span){return`<tr class="edit-row" data-id="${t.id}"><td class="task-col"><input type="text" id="ei-name" maxlength="120" value="${safeText(t.name)}" style="width:100%"/></td><td colspan="${span}"><div class="edit-inline"><label>${T('editStart')}</label><input type="date" id="ei-start" value="${fmtDate(t.start)}"/><label>${T('editEnd')}</label><input type="date" id="ei-end" value="${fmtDate(t.end)}"/><select id="ei-status">${opts(t.status)}</select><label>${T('editParent')}</label><select id="ei-parent"><option value="">${T('formParentNone')}</option>${getParentOptions(t.id,t.parentId)}</select><label>💬</label><input type="text" id="ei-comment" maxlength="300" value="${safeText(t.comment||'')}" placeholder="${T('editCommentPlaceholder')}" style="width:220px;min-width:120px;max-width:260px;flex:0 1 220px"/><button class="btn btn-primary" data-save="${t.id}" type="button">${T('editSave')}</button><button class="btn" data-cancel="1" type="button">${T('editCancel')}</button></div></td></tr>`;}

function normalizeTask(name,ss,es,status,id,comment='',parentId=null){const n=name.trim();if(!n)throw new Error(T('errName'));if(!ss||!es)throw new Error(T('errDates'));const rs=new Date(ss+'T00:00:00'),re=new Date(es+'T00:00:00');if(isNaN(rs)||isNaN(re))throw new Error(T('errInvalidDates'));if(re<rs)throw new Error(T('errDateOrder'));const normalizedParentId=parentId==null||parentId===''?null:parseInt(parentId,10);validateParentAssignment(id,normalizedParentId);return{id,name:n,start:rs,end:re,status,comment:comment.trim(),parentId:normalizedParentId};}
function addTask(){try{const pid=document.getElementById('newParent').value;const t=normalizeTask(document.getElementById('newTask').value,document.getElementById('newStart').value,document.getElementById('newEnd').value,document.getElementById('newStatus').value,nextId++,document.getElementById('newComment').value,pid||null);tasks.push(t);document.getElementById('newTask').value='';document.getElementById('newStart').value=fmtDate(today);document.getElementById('newEnd').value=fmtDate(addDays(today,5));document.getElementById('newComment').value='';document.getElementById('newParent').value='';editingId=null;render();showToast(T('toastAdded'));}catch(e){nextId=Math.max(1,nextId-1);showToast(e.message);}}
function delTask(id){if(confirm(T('confirmDelete'))){const root=tasks.find(t=>t.id===id);if(!root)return;const toDelete=new Set([id,...getAllDescendants(root.id).map(t=>t.id)]);tasks=tasks.filter(t=>!toDelete.has(t.id));collapsedIds=new Set([...collapsedIds].filter(taskId=>!toDelete.has(taskId)));if(toDelete.has(editingId))editingId=null;render();showToast(T('toastDeleted'));}}
function duplicateTask(id){const base=tasks.find(t=>t.id===id);if(!base)return;const descendants=getAllDescendants(id);const sourceIds=[id,...descendants.map(t=>t.id)];const idMap=new Map();sourceIds.forEach(sourceId=>idMap.set(sourceId,nextId++));const clones=sourceIds.map(sourceId=>{const source=tasks.find(t=>t.id===sourceId);const cloneId=idMap.get(sourceId);const cloneParent=source.parentId&&idMap.has(source.parentId)?idMap.get(source.parentId):source.parentId;return{id:cloneId,name:sourceId===id?source.name+T('duplicateSuffix'):source.name,start:new Date(source.start),end:new Date(source.end),status:source.status,comment:source.comment||'',parentId:cloneParent||null};});tasks.push(...clones);if(collapsedIds.has(id))collapsedIds.add(idMap.get(id));descendants.forEach(t=>{if(collapsedIds.has(t.id))collapsedIds.add(idMap.get(t.id));});render();showToast(T('toastDuplicated'));}
function startEdit(id){editingId=id;render();}
function cancelEdit(){editingId=null;render();}
function saveEdit(id){try{const idx=tasks.findIndex(x=>x.id===id);if(idx<0)return;tasks[idx]=normalizeTask(document.getElementById('ei-name').value,document.getElementById('ei-start').value,document.getElementById('ei-end').value,document.getElementById('ei-status').value,id,document.getElementById('ei-comment').value,document.getElementById('ei-parent').value||null);editingId=null;render();showToast(T('toastSaved'));}catch(e){showToast(e.message);}}
function setView(v){viewMode=v;document.getElementById('btnDay').className=v==='day'?'active':'';document.getElementById('btnWeek').className=v==='week'?'active':'';render();}
function toggleForm(){formOpen=!formOpen;document.getElementById('formBody').style.display=formOpen?'':'none';document.getElementById('toggleFormBtn').textContent=formOpen?'−':'+';savePrefs();}
function toggleStats(){statsOpen=!statsOpen;document.getElementById('statsBody').style.display=statsOpen?'':'none';document.getElementById('toggleStatsBtn').textContent=statsOpen?'−':'+';savePrefs();}
function toggleInsight(){insightOpen=!insightOpen;document.getElementById('insightBody').style.display=insightOpen?'':'none';document.getElementById('toggleInsightBtn').textContent=insightOpen?'−':'+';savePrefs();}
function resetDemo(){if(confirm(T('confirmReset'))){localStorage.removeItem(LS_KEY);localStorage.removeItem(LS_BIN);tasks=demoTasks.map(deserializeTask);collapsedIds.clear();nextId=Math.max(...tasks.map(t=>t.id))+1;editingId=null;render();toggleMenu(false);showToast(T('toastDemoReset'));}}

function bindRowEvents(){
  document.querySelectorAll('[data-del]').forEach(b=>{b.onclick=e=>{e.stopPropagation();delTask(parseInt(b.dataset.del));};});
  document.querySelectorAll('[data-edit]').forEach(b=>{b.onclick=e=>{e.stopPropagation();startEdit(parseInt(b.dataset.edit));};});
  document.querySelectorAll('[data-dup]').forEach(b=>{b.onclick=e=>{e.stopPropagation();duplicateTask(parseInt(b.dataset.dup));};});
  document.querySelectorAll('[data-collapse]').forEach(b=>{b.onclick=e=>{e.stopPropagation();toggleCollapse(parseInt(b.dataset.collapse));};});
  document.querySelectorAll('.edit-row [data-save]').forEach(b=>b.onclick=()=>saveEdit(parseInt(b.dataset.save)));
  document.querySelectorAll('.edit-row [data-cancel]').forEach(b=>b.onclick=cancelEdit);
}
```


**Manual validation messages — every ES/EN error, verbatim values:**

**Source: L603–L608.**

```javascript
    errName:'Escribe un nombre.',
    errDates:'Completa las fechas.',
    errInvalidDates:'Fechas inválidas.',
    errDateOrder:'La fecha de fin no puede ser anterior al inicio.',
    errParentDesc:'Una tarea no puede convertirse en hija de una de sus subtareas.',
    errParentMissing:'La tarea padre seleccionada ya no existe.',
```


**Source: L757–L762.**

```javascript
    errName:'Enter a name.',
    errDates:'Fill in both dates.',
    errInvalidDates:'Invalid dates.',
    errDateOrder:'End date cannot be before start date.',
    errParentDesc:'A task cannot become a child of one of its own subtasks.',
    errParentMissing:'The selected parent task no longer exists.',
```


Exact rejection ordering is defined by normalizeTask (L1675) and validateParentAssignment (L1080–L1085, §2A). Error display uses `showToast(e.message)` (L1676,L1681), not an inline validation box. A missing task on save/delete/duplicate silently returns (L1677–L1681). Confirmations use confirmDelete/confirmReset; all ES/EN success/error/share strings, including unused ones, are reproduced in §8 (ES L582–L608; EN corresponding entries L736–L762). Lock errors are distinct (§9). Reorder rejection messages are outside I18N and are copied in §5 (L1702,L1704,L1707); network/clipboard/export errors are in §7 (L1781–L1814,L2034,L2102–L2103).

## 4. Displayed results

**Population semantics:** cards and donut use `filteredTasks()` before collapse; table and exports use `buildTreeList(filteredTasks())`. A parent and each child count as separate records. Parent completion uses recursively derived children status. Overdue means unfinished effective end < frozen today; “late” instead means not overdue, not done/prog/bloc and effective start <= today. Overdue keeps its base display status plus a separate chip, so `late` and `over` are not synonyms. (L1067–L1078,L1482–L1491,L1537–L1544,L1643–L1648,L1840,L2030.)

| card / result / DOM target | exact label keys / literal exceptions | value formula and format | status colors / source |

| --- | --- | --- | --- |

| Overview title/subtitle | overviewTitle / overviewSubtitle | Static translated strings | L321,L487–L488; literals §8 |

| Overview visible count | statOverview; literal ES Tareas visibles / EN Visible tasks | list.length, raw integer | L1547; default stat-num text |

| Doing count | statDoing / statProgLabel | c.prog&#124;&#124;0 | L1548; var(--blue-text) |

| Done count | statDone / statDoneLabel | c.done&#124;&#124;0 | L1549; var(--green-text) |

| Focus count | statFocus / statPendLabel | c.pend&#124;&#124;0 | L1550; var(--gray-text) |

| Risk count | statRisk / statBlocLabel | c.bloc&#124;&#124;0 | L1551; var(--red-text) |

| Late count | statLate / statLateLabel | c.late | L1552; var(--amber-text) |

| pctBadge | pctBadge(n) | list.length?Math.round((c.done/list.length)*100):0 | L1544–L1545; HTML green pill L285 |

| progressBand title/copy/chip/rail | progressTitle / progressCopy(d,p,o); literal ${pct}% | done/prog/over counts; rail width ${pct}% | L1555–L1568; CSS complete in §5 |

| Progress pulses | pulseToday / pulseNext / pulseDays | list.filter(isActiveToday).length; list.filter(t=>t.start>today).length; list.reduce((acc,t)=>acc+durationDays(t),0) | L1565–L1567; own-date future/duration, not effective |

| todayLabel | todayPrefix + literal separator | `${T('todayPrefix')} · ${formatHuman(today)}` | L1428; red today-pill L133 |

| rangeLabel | No label prefix after render | `${formatHuman(start)} — ${formatHuman(end)}` | L1646–L1647; range fallback to all tasks if no visible rows |

| resultInfo | resultInfo(vis,tot,ov,tod) | filtered.length / tasks.length / overdue count / active-today count | L1648; aria-live polite L395 |

| Task name/dates/status | ganttTaskCol / statusProg,Done,Pend,Bloc,Late / statusOver | effective dates → inclusive days; escaped name; optional ↳, comment and overdue chip | L1572–L1595; class maps L904–L905 |

| Empty table | ganttEmpty | No visible list → one row, colspan total+1 or weeks.length+1 | L1659,L1666 |

| Donut total/center | taskCount(total) / pieCompleted | filtered count and rounded completed/total×100 | L1503,L1517–L1522 |

| Donut detail | pieSelected / status labels / pieDesc[sel] / pieTasks / pieOfTotal / pieOverdue | selected count / rounded selected share / overdue within selected status | L1526–L1531 |

| Donut microstats | pieActive / pieOverdueTotal / pieToday | displayStatus prog count / all overdue / inclusive effective today count | L1489–L1491,L1532 |

| Health title/subtitle | healthTitle / healthSubtitle | Static translated text; selectable segment, not filter | L416,L1524 |

| Read-only banner | readonlyBanner | Nonempty ?bin=; show banner and hide formCard/share button | L272,L1395–L1398 |

| Share modal/URL | shareTitle / shareDesc / shareCopy / shareClose | Cloud-generated URL; literal details §7 | L433–L442,L1790–L1793 |

| Footer | footer; CJLB becomes strong markup | L879 replace('CJLB',...) | L444–L445,L877–L879 |



All exact ES/EN values for the keys above are in §8; the per-key source line index there disambiguates every label. Hardcoded text not covered by a key remains literal in the complete HTML and rendering code below. (L253–L448,L461–L781,L1536–L1670.)

**Source: L1536–L1573.**

```javascript
function renderStats(){
  const list=filteredTasks();
  const c={prog:0,done:0,pend:0,bloc:0,late:0,over:0};
  list.forEach(t=>{
    const ds=getDisplayStatus(t);
    c[ds]=(c[ds]||0)+1;
    if(isOverdue(t))c.over++;
  });
  const pct=list.length?Math.round((c.done/list.length)*100):0;
  const el=document.getElementById('pctBadge');if(el)el.textContent=T('pctBadge',pct);
  document.getElementById('stats').innerHTML=`
    <div class="stat"><div class="stat-top"><span class="stat-chip">${T('statOverview')}</span><span>📌</span></div><div class="stat-num">${list.length}</div><div class="stat-label">${currentLang==='en'?'Visible tasks':'Tareas visibles'}</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-chip">${T('statDoing')}</span><span>⚡</span></div><div class="stat-num" style="color:var(--blue-text)">${c.prog||0}</div><div class="stat-label">${T('statProgLabel')}</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-chip">${T('statDone')}</span><span>✅</span></div><div class="stat-num" style="color:var(--green-text)">${c.done||0}</div><div class="stat-label">${T('statDoneLabel')}</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-chip">${T('statFocus')}</span><span>🕓</span></div><div class="stat-num" style="color:var(--gray-text)">${c.pend||0}</div><div class="stat-label">${T('statPendLabel')}</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-chip">${T('statRisk')}</span><span>⛔</span></div><div class="stat-num" style="color:var(--red-text)">${c.bloc||0}</div><div class="stat-label">${T('statBlocLabel')}</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-chip">${T('statLate')}</span><span>⏰</span></div><div class="stat-num" style="color:var(--amber-text)">${c.late}</div><div class="stat-label">${T('statLateLabel')}</div></div>`;
  const progressBand=document.getElementById('progressBand');
  if(progressBand){
    progressBand.innerHTML=`
      <div class="progress-meta">
        <div>
          <div class="progress-title">${T('progressTitle')}</div>
          <div class="progress-copy">${T('progressCopy',c.done,c.prog,c.over)}</div>
        </div>
        <span class="stat-chip">${pct}%</span>
      </div>
      <div class="progress-rail"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="pulse-row">
        <span class="pulse-chip">${T('pulseToday',list.filter(isActiveToday).length)}</span>
        <span class="pulse-chip">${T('pulseNext',list.filter(t=>t.start>today).length)}</span>
        <span class="pulse-chip">${T('pulseDays',list.reduce((acc,t)=>acc+durationDays(t),0))}</span>
      </div>`;
  }
}

function overdueChip(t){return isOverdue(t)?`<span class="badge s-over" style="margin-right:2px">${T('statusOver')}</span>`:'';}
function commentBubble(t){return t.comment?`<span title="${safeText(t.comment)}" style="cursor:default;font-size:14px;flex-shrink:0;line-height:1" aria-label="Comentario: ${safeText(t.comment)}">💬</span>`:''}
```


## 5. Charts / visual timeline

**Custom Gantt, no chart library:** DOM table `ganttTable`/`thead`/`tbody`, sticky task column and headers, scroll wrapper overflow auto, table min-width 980px, daily cell min-width 32px and height42px, bars28px/radius10px. Day ticks show localized weekday plus unpadded day; weekly ticks show literal W + ISO week and unpadded Monday day/month. No numeric y-axis, zoom control, dependency arrows, milestones, axis title config object, critical-path layer or task-progress overlay exists. The header labels are ganttTimeline/ganttTaskCol. Range = effective visible bounds -2/+3 days or fallback to all tasks; empty tasks -7/+14 days. Month spans group daily dates, or weeks by the Monday month. (L80–L131,L1467–L1479,L1598–L1670.)

**Bars/status:** prog blue, done green, pend gray, bloc red, late amber; overdue adds amber badge rather than a separate bar status. Effective parent dates include all descendants and own dates. Depth opacity is `Math.max(0.45,1-depth*0.18)`. Daily bars use inclusive colspan; only editable leaves get interactive wrappers. Week bars join all overlapping weeks without drag. Today/current-week line is CSS inset2px red, not a canvas annotation. Weekend cells use rgba(127,127,127,.04). Tooltip on task name/comment uses title; drag tooltip is custom. All exact CSS colors, gradients, typography, animations and responsive rules are copied below rather than inferred from screenshots. (L14–L250,L904–L905,L1574–L1638.)

**Full CSS (including every hex list, responsive breakpoint and visual state):**

**Source: L13–L250.**

```css
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  color-scheme:light;
  --bg:#f4f7fb;--bg-soft:rgba(255,255,255,.78);--panel:#ffffff;--panel-2:#f8fafc;--panel-3:#eef3f9;
  --text:#142033;--text-2:#5f6b7d;--text-3:#8a95a6;
  --border:rgba(15,23,42,.10);--border-2:rgba(15,23,42,.18);
  --shadow:0 14px 40px rgba(15,23,42,.10);--shadow-soft:0 8px 24px rgba(15,23,42,.08);
  --blue:#4f8cff;--blue-bg:#e9f1ff;--blue-text:#235fd2;
  --green:#43b36b;--green-bg:#eaf9ef;--green-text:#217543;
  --gray:#8a94a6;--gray-bg:#eef1f6;--gray-text:#5d6778;
  --red:#ef5b67;--red-bg:#ffecee;--red-text:#b82c3f;
  --amber:#f59e0b;--amber-bg:#fff5df;--amber-text:#9a6800;
  --purple:#8b5cf6;--purple-bg:#f3edff;--purple-text:#6942d0;
  --radius:12px;--radius-lg:22px;--blur:blur(18px);
}
:root[data-theme="dark"]{
  color-scheme:dark;
  --bg:#08111f;--bg-soft:rgba(10,18,32,.72);--panel:#0f172a;--panel-2:#131e35;--panel-3:#1a2742;
  --text:#edf3ff;--text-2:#a9b6cd;--text-3:#71809c;
  --border:rgba(255,255,255,.09);--border-2:rgba(255,255,255,.18);
  --shadow:0 18px 48px rgba(0,0,0,.34);--shadow-soft:0 10px 28px rgba(0,0,0,.28);
  --blue:#72a8ff;--blue-bg:#11284c;--blue-text:#a8cbff;
  --green:#59c97f;--green-bg:#10281a;--green-text:#9ae5b1;
  --gray:#91a0b7;--gray-bg:#1a2437;--gray-text:#c0cad8;
  --red:#ff7683;--red-bg:#34131a;--red-text:#ffb0ba;
  --amber:#f8b84f;--amber-bg:#322712;--amber-text:#ffd78f;
  --purple:#a78bfa;--purple-bg:#24183d;--purple-text:#d4c6ff;
}
html,body{min-height:100%}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--text);
  background:radial-gradient(circle at top left,rgba(79,140,255,.18),transparent 28%),
    radial-gradient(circle at top right,rgba(67,179,107,.12),transparent 24%),
    linear-gradient(180deg,var(--bg),var(--bg));padding:20px}
.shell{max-width:1480px;margin:0 auto}
.topbar{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}
.hero{display:flex;flex-direction:column;gap:6px}
.kicker{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2);letter-spacing:.08em;text-transform:uppercase}
.kicker-dot{width:8px;height:8px;border-radius:999px;background:linear-gradient(135deg,var(--blue),var(--green))}
h1{font-size:clamp(28px,4vw,40px);font-weight:900;letter-spacing:-.04em}
.subtitle{font-size:14px;color:var(--text-2)}
.card{background:var(--bg-soft);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);padding:16px;margin-bottom:16px}
.glow{position:relative;overflow:hidden}
.glow::before{content:"";position:absolute;inset:-30% auto auto -10%;width:220px;height:220px;border-radius:999px;background:radial-gradient(circle,rgba(79,140,255,.14),transparent 70%);pointer-events:none}
.btn,.toolbar input,.toolbar select,.toolbar-row2 select,.filterbar input,.filterbar select{min-height:42px;border-radius:12px;border:1px solid var(--border-2);outline:none}
.btn,.icon-btn{background:var(--panel);color:var(--text);padding:0 14px;cursor:pointer;transition:transform .18s,box-shadow .18s,background .18s}
.btn:hover,.icon-btn:hover{transform:translateY(-1px);box-shadow:var(--shadow-soft)}
.btn:active,.icon-btn:active{transform:translateY(0)}
.btn-primary{background:linear-gradient(135deg,var(--blue),#6398ff);border-color:transparent;color:#fff;font-weight:800}
.icon-btn{width:42px;height:42px;padding:0;font-size:18px;display:grid;place-items:center;border:1px solid var(--border-2);border-radius:12px}
.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.panel-title{font-size:14px;font-weight:800;color:var(--text-2)}
.panel-subtitle{font-size:12px;color:var(--text-3);margin-top:2px}
.toolbar{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.8fr) minmax(0,.8fr);gap:10px;margin-top:14px}
.toolbar-row2{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1fr) auto;gap:10px;margin-top:10px}
.toolbar input,.toolbar select,.toolbar-row2 select,.filterbar input,.filterbar select{width:100%;background:var(--panel-2);color:var(--text);padding:0 12px;font-size:14px}
.form-field{min-height:42px;border-radius:12px;border:1px solid var(--border-2);outline:none;background:var(--panel-2);color:var(--text);padding:10px 12px;font-size:14px;width:100%;box-sizing:border-box;display:block}
.view-toggle{display:inline-flex;padding:4px;background:var(--panel-3);border:1px solid var(--border-2);border-radius:14px;gap:4px}
.view-toggle button{border:none;background:transparent;color:var(--text-2);padding:8px 14px;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer}
.view-toggle button.active{background:var(--panel);color:var(--text);box-shadow:var(--shadow-soft)}
.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:14px}
.stat{background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid var(--border);border-radius:20px;padding:14px 14px 12px;box-shadow:var(--shadow-soft)}
.stat-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.stat-chip{font-size:11px;font-weight:800;padding:5px 8px;border-radius:999px;background:var(--panel-3);color:var(--text-2)}
.stat-num{font-size:30px;font-weight:900;letter-spacing:-.05em}
.stat-label{font-size:12px;color:var(--text-2)}
.filterbar{display:grid;grid-template-columns:minmax(220px,1fr) minmax(150px,.6fr) minmax(150px,.6fr) auto;gap:10px;margin-top:14px}
.helper{font-size:12px;color:var(--text-3);margin-top:10px}
.gantt-wrap{width:100%;overflow:auto;border-radius:16px;border:1px solid var(--border);background:var(--panel)}
table{border-collapse:separate;border-spacing:0;width:100%;min-width:980px}
thead th{position:sticky;top:0;z-index:3;background:var(--panel-2)}
th,td{border-bottom:1px solid var(--border);vertical-align:middle}
th{font-size:11px;font-weight:900;color:var(--text-2);padding:8px 5px;text-align:center;white-space:nowrap}
.month-head{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);background:var(--panel-3)}
th.task-col,td.task-col{position:sticky;left:0;z-index:4;background:inherit}
th.task-col{min-width:80px;text-align:left;padding-left:12px}
td.task-col{background:var(--panel)}
tr:hover td{background:var(--panel-2)}
tr:hover td.task-col{background:var(--panel-2)}
.task-info{display:flex;align-items:center;gap:5px;padding:8px 10px}
.task-main{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.task-name{font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.task-dates{font-size:11px;color:var(--text-3)}
.badge{font-size:10px;padding:5px 8px;border-radius:999px;white-space:nowrap;font-weight:900;flex-shrink:0;border:1px solid transparent}
.s-prog{background:var(--blue-bg);color:var(--blue-text)}
.s-done{background:var(--green-bg);color:var(--green-text)}
.s-pend{background:var(--gray-bg);color:var(--gray-text)}
.s-bloc{background:var(--red-bg);color:var(--red-text)}
.s-late{background:var(--amber-bg);color:var(--amber-text)}
.s-over{background:var(--amber-bg);color:var(--amber-text)}
.bar-late{background:linear-gradient(135deg,var(--amber),#fbbf24)}
.bar-cell{min-width:32px;height:42px;padding:4px 2px}
.bar{height:28px;border-radius:10px;min-width:8px;cursor:pointer;position:relative;overflow:hidden}
tr[data-depth="0"] td{border-left:none}
tr[data-depth="1"] td.task-col{border-left:3px solid var(--blue);background:var(--panel-2)!important}
tr[data-depth="2"] td.task-col{border-left:3px solid var(--green);background:var(--panel-3)!important}
tr[data-depth="3"] td.task-col{border-left:3px solid var(--purple);background:var(--panel-3)!important}
tr[data-depth]:not([data-depth="0"]) td.task-col{border-left-width:3px;border-left-style:solid}
.bar::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.22),transparent 50%);pointer-events:none}
/* ── Bar drag system ── */
.bar-wrap{position:relative;height:28px;border-radius:10px;overflow:visible}
.bar-interactive{width:100%;height:100%;border-radius:10px;overflow:hidden;position:relative;display:block;cursor:default}
.bar-interactive::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.22),transparent 50%);pointer-events:none}
.bar-tip{position:absolute;top:-30px;right:0;pointer-events:none;background:var(--panel);border:1.5px solid var(--border-2);border-radius:8px;padding:3px 9px;font-size:11px;font-weight:800;color:var(--text);box-shadow:var(--shadow);white-space:nowrap;display:none;z-index:999}
.bar-tip.pos{color:var(--green-text);border-color:var(--green)}
.bar-tip.neg{color:var(--red-text);border-color:var(--red)}
.bar-tip.neu{color:var(--text-2)}
.bar-wrap.tip-visible .bar-tip{display:block}
.bar-interactive.cursor-resize-left{cursor:w-resize}
.bar-interactive.cursor-resize-right{cursor:e-resize}
.bar-interactive.cursor-move{cursor:grab}
.bar-interactive.cursor-move:active,.bar-interactive.cursor-grabbing{cursor:grabbing}
.bar-dragging-row td{background:var(--panel-2)!important}
.bar-live-highlight td{background:rgba(79,140,255,.06)!important}
.bar-prog{background:linear-gradient(135deg,var(--blue),#77a7ff)}
.bar-done{background:linear-gradient(135deg,var(--green),#73d494)}
.bar-pend{background:linear-gradient(135deg,var(--gray),#b0b8c6)}
.bar-bloc{background:linear-gradient(135deg,var(--red),#ff8e99)}
.weekend-col{background:rgba(127,127,127,.04)}
.today-col{box-shadow:inset 2px 0 0 var(--red)}
.today-head{color:var(--red-text)!important}
.today-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:var(--red-bg);color:var(--red-text);font-size:12px;font-weight:900}
.edit-row td{padding:8px;background:var(--panel-2)}
.edit-row input,.edit-row select{min-height:38px;background:var(--panel);border:1px solid var(--border-2);border-radius:10px;padding:0 10px;color:var(--text)}
.edit-inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.edit-inline label{font-size:11px;color:var(--text-2);font-weight:800}
.action-btn,.drag-handle{border:none;background:var(--panel-2);color:var(--text-2);cursor:pointer;border-radius:10px;min-width:30px;min-height:30px;display:grid;place-items:center;transition:.18s;touch-action:manipulation}
.action-btn:hover,.drag-handle:hover{background:var(--panel-3);color:var(--text)}
.del-btn:hover{color:var(--red-text);background:var(--red-bg)}
.dup-btn:hover{color:var(--purple-text);background:var(--purple-bg)}
.drag-handle{cursor:grab;font-size:16px;touch-action:none}
.dragging{opacity:.28}
tr.drag-over-top td{box-shadow:inset 0 2px 0 var(--blue)}
tr.drag-over-bot td{box-shadow:inset 0 -2px 0 var(--blue)}
.legend{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--text-2);margin-top:14px}
.legend span{display:flex;align-items:center;gap:6px}
.dot{width:11px;height:11px;border-radius:4px;flex-shrink:0}
.col-resizer{position:absolute;right:-4px;top:0;bottom:0;width:8px;cursor:col-resize;z-index:10;display:flex;align-items:center;justify-content:center}
.col-resizer::after{content:"";width:3px;height:60%;border-radius:2px;background:var(--blue);opacity:0;transition:opacity .2s}
th.task-col:hover .col-resizer::after,.col-resizer:hover::after,.col-resizer.dragging::after{opacity:1}
.menu{position:relative}
.dropdown{display:none;position:absolute;right:0;top:calc(100% + 8px);min-width:240px;max-width:min(340px,calc(100vw - 24px));background:var(--panel);border:1px solid var(--border-2);border-radius:16px;overflow:hidden;z-index:30;box-shadow:var(--shadow)}
.menu-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:12px 16px;font-size:14px;background:none;border:none;color:var(--text);cursor:pointer;border-bottom:1px solid var(--border)}
.menu-item:last-child{border-bottom:none}
.menu-item:hover{background:var(--panel-2)}
.empty{padding:28px 16px;text-align:center;color:var(--text-2);font-size:14px}
.sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.pie-wrap{background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid var(--border);border-radius:18px;padding:16px 20px}
.pie-layout{display:grid;grid-template-columns:220px 1fr;align-items:center;gap:24px}
.pie-svg-wrap{display:flex;align-items:center;justify-content:center}
.legend-card{background:linear-gradient(180deg,var(--panel-2),var(--panel));border:1px solid var(--border);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px}
.legend-kicker{font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3)}
.legend-title{font-size:18px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.legend-copy{font-size:13px;line-height:1.55;color:var(--text-2)}
.legend-chip-row{display:flex;gap:8px;flex-wrap:wrap}
.legend-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid var(--border);background:var(--panel);color:var(--text-2)}
.legend-microstats{display:flex;gap:10px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--border)}
.legend-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;background:var(--panel);border:1px solid var(--border);font-size:12px;color:var(--text-2);font-weight:800}
#toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(20px);background:var(--panel);border:1px solid var(--border-2);border-radius:var(--radius-lg);padding:.85rem 1.25rem;font-size:13px;font-weight:700;color:var(--text);box-shadow:var(--shadow);opacity:0;transition:opacity .3s,transform .3s;z-index:9999;pointer-events:none;white-space:nowrap}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#linkModal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;align-items:center;justify-content:center;padding:20px}
#linkModal.show{display:flex}
.modal-box{background:var(--panel);border-radius:var(--radius-lg);padding:1.75rem;max-width:520px;width:100%;box-shadow:var(--shadow);border:1px solid var(--border)}
.modal-box h2{font-size:17px;font-weight:900;margin-bottom:.5rem}
.modal-box p{font-size:13px;color:var(--text-2);margin-bottom:1rem;line-height:1.5}
.modal-link{font-size:12px;background:var(--panel-2);border:1px solid var(--border-2);border-radius:var(--radius);padding:.75rem;word-break:break-all;margin-bottom:1rem;color:var(--text);line-height:1.5}
.modal-actions{display:flex;gap:8px;justify-content:flex-end}
#readonlyBanner{display:none;background:var(--blue-bg);color:var(--blue-text);text-align:center;padding:.85rem;font-size:13px;font-weight:800;border-radius:var(--radius);margin-bottom:1rem}
.app-locked{overflow:hidden}
.lock-screen{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(180deg,rgba(8,17,31,.30),rgba(8,17,31,.48));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:10020;opacity:1;visibility:visible;transition:opacity .45s ease,visibility .45s ease}
.lock-screen.hidden{opacity:0;visibility:hidden;pointer-events:none}
.lock-card{position:relative;width:min(100%,460px);padding:28px;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.80));border:1px solid rgba(255,255,255,.35);box-shadow:0 28px 80px rgba(15,23,42,.24);overflow:hidden}
:root[data-theme="dark"] .lock-card{background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(15,23,42,.84));border-color:rgba(255,255,255,.08)}
.lock-card::before{content:"";position:absolute;inset:auto -10% 72% auto;width:240px;height:240px;border-radius:999px;background:radial-gradient(circle,rgba(79,140,255,.24),transparent 68%);pointer-events:none}
.lock-card::after{content:"";position:absolute;inset:68% auto auto -8%;width:220px;height:220px;border-radius:999px;background:radial-gradient(circle,rgba(67,179,107,.18),transparent 68%);pointer-events:none}
.lock-card-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}
.lock-logo{width:88px;height:88px;border-radius:24px;background:linear-gradient(135deg,var(--panel),var(--panel-3));border:1px solid var(--border);box-shadow:var(--shadow-soft);display:flex;align-items:center;justify-content:center;padding:10px}
.lock-logo img{width:100%;height:100%;object-fit:contain}
.lock-doc{font-size:24px;font-weight:900;letter-spacing:-.04em;color:var(--text);line-height:1.1}
.lock-copy{font-size:14px;line-height:1.6;color:var(--text-2);max-width:32ch}
.lock-form{width:100%;display:flex;flex-direction:column;gap:12px;margin-top:4px}
.lock-input{width:100%;min-height:50px;border-radius:16px;border:1px solid var(--border-2);background:var(--panel);color:var(--text);padding:0 16px;font-size:15px;text-align:center;letter-spacing:.04em;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.lock-input:focus-visible{outline:3px solid rgba(79,140,255,.22);outline-offset:2px}
.lock-submit{min-height:48px;border:none;border-radius:16px;background:linear-gradient(135deg,var(--blue),#6398ff);color:#fff;font-size:14px;font-weight:900;cursor:pointer;box-shadow:var(--shadow-soft);transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease}
.lock-submit:hover{transform:translateY(-1px);box-shadow:var(--shadow)}
.lock-submit:active{transform:translateY(0)}
.lock-submit[disabled]{opacity:.65;cursor:wait}
.lock-feedback{min-height:22px;font-size:13px;font-weight:800;color:var(--text-2);transition:color .2s ease,opacity .2s ease}
.lock-feedback.error{color:var(--red-text)}
.lock-feedback.success{color:var(--green-text)}
.lock-hint{font-size:12px;color:var(--text-3)}
.lock-card.shake{animation:lock-shake .4s ease}
@keyframes lock-shake{
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-10px)}
  40%{transform:translateX(9px)}
  60%{transform:translateX(-7px)}
  80%{transform:translateX(5px)}
}

.btn:focus-visible,.icon-btn:focus-visible,.menu-item:focus-visible,.toolbar input:focus-visible,.toolbar select:focus-visible,.filterbar input:focus-visible,.filterbar select:focus-visible,.edit-row input:focus-visible,.edit-row select:focus-visible{outline:3px solid rgba(79,140,255,.22);outline-offset:2px}
.header-brand{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.logo-badge{position:relative;width:64px;height:64px;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--panel),var(--panel-3));border:1px solid var(--border);box-shadow:var(--shadow-soft);flex-shrink:0;padding:6px}
.logo-badge img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;display:block}
.logo-fallback{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:16px;font-weight:900;letter-spacing:.08em;color:var(--text-2)}
.logo-badge.fallback .logo-fallback{display:flex}
.logo-badge.fallback img{display:none}
.progress-band{margin-top:14px;padding:14px 16px;border-radius:18px;border:1px solid var(--border);background:linear-gradient(180deg,var(--panel),var(--panel-2));box-shadow:var(--shadow-soft)}
.progress-meta{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.progress-title{font-size:13px;font-weight:800;color:var(--text)}
.progress-copy{font-size:12px;color:var(--text-2)}
.progress-rail{height:12px;border-radius:999px;background:var(--panel-3);overflow:hidden;border:1px solid var(--border)}
.progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--green),var(--blue));transition:width .25s ease}
.pulse-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.pulse-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:800;background:var(--panel);border:1px solid var(--border);color:var(--text-2)}
.section-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.muted-note{margin-top:8px;font-size:12px;color:var(--text-3)}

.menu-item-theme{flex-direction:column;align-items:flex-start;gap:10px;cursor:default}
.menu-item-theme:hover{background:none}
.theme-switch-label{font-weight:800;color:var(--text)}
.theme-switch{position:relative;display:grid;grid-template-columns:repeat(3,1fr);width:100%;padding:4px;border-radius:999px;background:var(--panel-2);border:1px solid var(--border);isolation:isolate}
.theme-option{position:relative;z-index:2;border:none;background:transparent;border-radius:999px;min-height:40px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:800;color:var(--text-2);cursor:pointer;transition:color .2s ease,transform .2s ease}
.theme-option span{white-space:nowrap}
.theme-option:hover{color:var(--text)}
.theme-option.active{color:var(--text)}
.theme-thumb{position:absolute;top:4px;left:4px;width:calc((100% - 8px)/3);height:calc(100% - 8px);border-radius:999px;background:var(--panel);border:1px solid var(--border);box-shadow:var(--shadow-soft);transition:transform .25s ease;z-index:1}
.theme-switch[data-active="dark"] .theme-thumb{transform:translateX(0)}
.theme-switch[data-active="system"] .theme-thumb{transform:translateX(100%)}
.theme-switch[data-active="light"] .theme-thumb{transform:translateX(200%)}
#langSwitch{grid-template-columns:repeat(2,1fr)}
#langSwitch .theme-thumb{width:calc((100% - 8px)/2)}
#langSwitch[data-active="es"] .theme-thumb{transform:translateX(0)}
#langSwitch[data-active="en"] .theme-thumb{transform:translateX(100%)}
.menu-item[disabled],.btn[disabled],.icon-btn[disabled]{opacity:.5;cursor:not-allowed;transform:none!important;box-shadow:none!important}

@media(max-width:1180px){.stats{grid-template-columns:repeat(3,1fr)}.filterbar{grid-template-columns:1fr 1fr}}
@media(max-width:900px){.pie-layout{grid-template-columns:1fr}}
@media(max-width:640px){body{padding:12px}.topbar{flex-direction:column}.stats{grid-template-columns:repeat(2,1fr)}.filterbar{grid-template-columns:1fr}.form-field{width:100%!important;box-sizing:border-box!important}#formDates{flex-direction:column}#formDates input{width:100%!important;box-sizing:border-box!important;min-height:42px}#formRow2{flex-direction:column;align-items:stretch}#formRow2 select,#formRow2>div,#formRow2 button{width:100%!important;box-sizing:border-box!important;flex:none!important}th.task-col{min-width:160px}.menu{position:static}.dropdown{position:fixed;top:88px;left:12px;right:12px;min-width:0;width:auto;max-width:none}.theme-option{padding:0 8px;font-size:11px}.theme-option span{font-size:11px}.lock-card{padding:22px;border-radius:24px}.lock-doc{font-size:21px}}
```


**Donut:** filtered-task status frequencies, order done/prog/late/pend/bloc; SVG200×200, center100,100, outer82, inner50, gap0.04 radians, start−π/2; selected wedge offset7; near-full-circle cap Math.PI*1.999; 2px hole-color stroke; empty circle uses EMPTY; center rounded done percentage. Click sets pieSelection/rebuilds donut only; hover opacity .8. Selected empty status auto-falls back to first nonzero status, otherwise done. No axes, zoom, bands or thresholds exist. Exact light/dark hex palettes and SVG paths are in the complete function below. (L1481–L1534.)

**Source: L1481–L1534.**

```javascript
function renderPie(){
  const list=filteredTasks();
  const c={prog:0,done:0,pend:0,bloc:0,late:0};
  list.forEach(t=>{
    const ds=getDisplayStatus(t);
    if(c[ds]!==undefined)c[ds]++;
  });
  const total=list.length;
  const overdueCount=list.filter(isOverdue).length;
  const activeCount=list.filter(t=>getDisplayStatus(t)==='prog').length;
  const todayCount=list.filter(isActiveToday).length;
  const isDark=isDarkTheme();
  const COLORS={prog:isDark?'#72a8ff':'#4f8cff',done:isDark?'#59c97f':'#43b36b',pend:isDark?'#91a0b7':'#8a94a6',late:isDark?'#f8b84f':'#f59e0b',bloc:isDark?'#ff7683':'#ef5b67'};
  const HOLE=isDark?'#0f172a':'#ffffff';
  const TEXT=isDark?'#edf3ff':'#142033';
  const TEXT2=isDark?'#a9b6cd':'#5f6b7d';
  const EMPTY=isDark?'#1a2742':'#eef3f9';
  const labels={prog:T('statusProg'),done:T('statusDone'),pend:T('statusPend'),late:T('statusLate'),bloc:T('statusBloc')};
  const descriptions=T('pieDesc');
  const order=['done','prog','late','pend','bloc'];
  const wrap=document.getElementById('pieWrap'),legEl=document.getElementById('pieLegend'),totEl=document.getElementById('pieTotal');
  if(!wrap)return;
  if(totEl)totEl.textContent=T('taskCount',total);
  if(!pieSelection||c[pieSelection]===0)pieSelection=order.find(k=>c[k]>0)||'done';
  const S=200,cx=100,cy=100,R=82,ri=50,GAP=0.04;
  function pt(a,r){return[cx+r*Math.cos(a),cy+r*Math.sin(a)];}
  function arc(sa,ea,color,selected){
    if(ea-sa>=Math.PI*1.999)ea=sa+Math.PI*1.999;
    const lg=ea-sa>Math.PI?1:0,off=selected?7:0,mid=(sa+ea)/2;
    const ox=Math.cos(mid)*off,oy=Math.sin(mid)*off;
    const[x1,y1]=pt(sa,R),[x2,y2]=pt(ea,R),[x3,y3]=pt(ea,ri),[x4,y4]=pt(sa,ri);
    return`<path d="M${x1+ox},${y1+oy} A${R},${R} 0 ${lg} 1 ${x2+ox},${y2+oy} L${x3+ox},${y3+oy} A${ri},${ri} 0 ${lg} 0 ${x4+ox},${y4+oy} Z" fill="${color}" stroke="${HOLE}" stroke-width="2" style="cursor:pointer" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'" data-key="${Object.entries(COLORS).find(([,v])=>v===color)?.[0]}"/>`;
  }
  let paths='',sa=-Math.PI/2;
  if(!total){paths=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${EMPTY}"/>`;}
  else{order.forEach(key=>{const v=c[key];if(!v)return;const angle=(v/total)*Math.PI*2;paths+=arc(sa+GAP,sa+angle-GAP,COLORS[key],pieSelection===key);sa+=angle;});}
  const pct=total?Math.round((c.done/total)*100):0;
  wrap.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    ${paths}
    <circle cx="${cx}" cy="${cy}" r="${ri}" fill="${HOLE}"/>
    <text x="${cx}" y="${cy-9}" text-anchor="middle" dominant-baseline="middle" fill="${TEXT}" font-size="22" font-weight="800" font-family="-apple-system,sans-serif">${pct}%</text>
    <text x="${cx}" y="${cy+12}" text-anchor="middle" dominant-baseline="middle" fill="${TEXT2}" font-size="11" font-family="-apple-system,sans-serif">${T('pieCompleted')}</text>
  </svg>`;
  wrap.querySelectorAll('path[data-key]').forEach(p=>{p.addEventListener('click',()=>{pieSelection=p.dataset.key;renderPie();});});
  if(legEl){
    const sel=pieSelection,selCount=c[sel]||0,selPct=total?Math.round((selCount/total)*100):0;
    const overdueInSel=list.filter(t=>getDisplayStatus(t)===sel&&isOverdue(t)).length;
    legEl.innerHTML=`<div class="legend-kicker">${T('pieSelected')}</div>
      <div class="legend-title"><span style="width:14px;height:14px;border-radius:4px;background:${COLORS[sel]};display:inline-block;flex-shrink:0"></span>${labels[sel]}</div>
      <div class="legend-copy">${descriptions[sel]}</div>
      <div class="legend-chip-row"><span class="legend-chip">${T('pieTasks',selCount)}</span><span class="legend-chip">${T('pieOfTotal',selPct)}</span><span class="legend-chip">${T('pieOverdue',overdueInSel)}</span></div>
      <div class="legend-microstats"><span class="legend-pill">${T('pieActive',activeCount)}</span><span class="legend-pill">${T('pieOverdueTotal',overdueCount)}</span><span class="legend-pill">${T('pieToday',todayCount)}</span></div>`;
  }
}
```


**Full row/bar/header rendering:** literal text, spacings, gradients/classes, cell span rules and label composition. No numeric locale formatter or `toFixed` is used. (L1572–L1670.)

**Source: L1089.**

```javascript
function toggleCollapse(id){if(collapsedIds.has(id))collapsedIds.delete(id);else collapsedIds.add(id);render();}
```


**Source: L1574–L1670.**

```javascript
function taskRowHTML(t,cols){
  const depth=getDepth(t);
  const indent=depth*18;
  const hasKids=getChildren(t.id).length>0;
  const collapsed=collapsedIds.has(t.id);
  const effDates=getEffectiveDates(t);
  const effStatus=getDisplayStatus(t);
  const range=`${fmtDate(effDates.start)} → ${fmtDate(effDates.end)} · ${dayDiff(effDates.start,effDates.end)+1}d`;
  const collapseBtn=hasKids?`<button class="action-btn" data-collapse="${t.id}" type="button" style="font-size:10px;min-width:22px">${collapsed?'▶':'▼'}</button>`:'<span style="display:inline-block;min-width:22px"></span>';
  const indentStyle=`padding-left:${4+indent}px`;
  const prefix=depth>0?'↳ ':'';
  const dragHandle=depth>0?`<span class="drag-handle" data-handle="${t.id}">⠿</span>`:'';
  if(readOnly)return`<tr data-id="${t.id}" data-depth="${depth}"><td class="task-col"><div class="task-info" style="${indentStyle}"><div class="task-main"><span class="task-name" title="${safeText(t.name)}">${prefix}${safeText(t.name)}</span><span class="task-dates">${range}</span></div>${commentBubble(t)}${overdueChip(t)}<span class="badge ${statusClass[effStatus]}">${getStatusLabel()[effStatus]}</span></div></td>${cols}</tr>`;
  return`<tr data-id="${t.id}" data-depth="${depth}"><td class="task-col"><div class="task-info" style="${indentStyle}">
    ${collapseBtn}
    ${dragHandle}
    <button class="action-btn" data-edit="${t.id}" type="button">✎</button>
    <button class="action-btn dup-btn" data-dup="${t.id}" type="button">⧉</button>
    <div class="task-main"><span class="task-name" title="${safeText(t.name)}">${prefix}${safeText(t.name)}</span><span class="task-dates">${range}</span></div>
    ${commentBubble(t)}${overdueChip(t)}<span class="badge ${statusClass[effStatus]}">${getStatusLabel()[effStatus]}</span>
    <button class="action-btn del-btn" data-del="${t.id}" type="button">×</button>
  </div></td>${cols}</tr>`;
}

function dayCols(t,start,total){
  const eff=getEffectiveDates(t);
  const effStatus=getDisplayStatus(t);
  let s='',i=0;
  const isParent=getChildren(t.id).length>0;
  while(i<total){
    const d=addDays(start,i),isT=dayDiff(today,d)===0,cls=`${isT?' today-col':''}${isWeekend(d)?' weekend-col':''}`,inR=d>=eff.start&&d<=eff.end;
    if(inR&&dayDiff(eff.start,d)===0){
      const sp=dayDiff(eff.start,eff.end)+1;
      const depth=getDepth(t);
      const opac=Math.max(0.45,1-depth*0.18);
      const barCls=barClass[effStatus];
      const dragAttr=readOnly||isParent?'':`data-bar-id="${t.id}"`;
      if(readOnly||isParent){
        s+=`<td class="bar-cell${cls}" colspan="${sp}"><div class="bar ${barCls}" style="opacity:${opac}"></div></td>`;
      }else{
        s+=`<td class="bar-cell${cls}" colspan="${sp}">
          <div class="bar-wrap" data-bar-id="${t.id}" style="opacity:${opac}">
            <div class="bar-interactive ${barCls}" data-bar-id="${t.id}"></div>
            <div class="bar-tip"></div>
          </div>
        </td>`;
      }
      i+=sp;continue;
    }
    s+=`<td class="bar-cell${cls}"></td>`;i++;
  }
  return s;
}
function weekCols(t,weeks){
  const eff=getEffectiveDates(t);
  const effStatus=getDisplayStatus(t);
  const depth=getDepth(t);const opac=Math.max(0.45,1-depth*0.18);
  let s='',i=0;
  while(i<weeks.length){
    const w=weeks[i],we=addDays(w,6),isCur=today>=w&&today<=we,ov=eff.start<=we&&eff.end>=w;
    if(ov){let sp=1;while(i+sp<weeks.length){const nw=weeks[i+sp],nwe=addDays(nw,6);if(eff.start<=nwe&&eff.end>=nw)sp++;else break;}s+=`<td class="bar-cell${isCur?' today-col':''}" colspan="${sp}"><div class="bar ${barClass[effStatus]}" style="opacity:${opac}"></div></td>`;i+=sp;continue;}
    s+=`<td class="bar-cell${isCur?' today-col':''}"></td>`;i++;
  }
  return s;
}

function applyTaskColWidth(){document.querySelectorAll('th.task-col,td.task-col').forEach(el=>{el.style.width=taskColWidth+'px';el.style.minWidth=taskColWidth+'px';el.style.maxWidth=taskColWidth+'px';});}

function render(){
  const filtered=filteredTasks();
  const list=buildTreeList(filtered);
  renderStats();
  const{start,end}=getRange(list.length?list:tasks);
  document.getElementById('rangeLabel').textContent=`${formatHuman(start)} — ${formatHuman(end)}`;
  document.getElementById('resultInfo').textContent=T('resultInfo',filtered.length,tasks.length,filtered.filter(isOverdue).length,filtered.filter(isActiveToday).length);
  // Actualizar selector de padre en el form
  const sel=document.getElementById('newParent');
  if(sel){const prev=sel.value;sel.innerHTML=`<option value="">${T('formParentNone')}</option>`+getParentOptions();sel.value=prev&&sel.querySelector(`option[value="${prev}"]`)?prev:'';}
  const thead=document.getElementById('thead'),tbody=document.getElementById('tbody');
  if(viewMode==='day'){
    const total=dayDiff(start,end)+1;
    const mh=buildMonthCells(start,end,'day').map(c=>`<th class="month-head" colspan="${c.span}">${c.label}</th>`).join('');
    let h=`<tr><th class="task-col month-head" style="position:relative">${T('ganttTimeline')}<div class="col-resizer"></div></th>${mh}</tr><tr><th class="task-col" style="position:relative">${T('ganttTaskCol')}<div class="col-resizer"></div></th>`;
    for(let i=0;i<total;i++){const d=addDays(start,i),isT=dayDiff(today,d)===0,wk=isWeekend(d)?' weekend-col':'';h+=`<th class="${isT?'today-col today-head':''}${wk}">${WDAYS[d.getDay()]}<br><span style="font-size:10px">${d.getDate()}</span></th>`;}
    thead.innerHTML=h+'</tr>';
    tbody.innerHTML=list.length?list.map(t=>editingId===t.id?editRow(t,total):taskRowHTML(t,dayCols(t,start,total))).join(''):`<tr><td class="empty" colspan="${total+1}">${T('ganttEmpty')}</td></tr>`;
  }else{
    const weeks=[];let cur=getWeekStart(start);while(cur<=end){weeks.push(new Date(cur));cur=addDays(cur,7);}
    const mh=buildMonthCells(start,end,'week').map(c=>`<th class="month-head" colspan="${c.span}">${c.label}</th>`).join('');
    let h=`<tr><th class="task-col month-head" style="position:relative">${T('ganttTimeline')}<div class="col-resizer"></div></th>${mh}</tr><tr><th class="task-col" style="position:relative">${T('ganttTaskCol')}<div class="col-resizer"></div></th>`;
    weeks.forEach(w=>{const isCur=today>=w&&today<=addDays(w,6);h+=`<th class="${isCur?'today-col today-head':''}">W${getWeekNum(w)}<br><span style="font-size:10px">${w.getDate()}/${w.getMonth()+1}</span></th>`;});
    thead.innerHTML=h+'</tr>';
    tbody.innerHTML=list.length?list.map(t=>editingId===t.id?editRow(t,weeks.length):taskRowHTML(t,weekCols(t,weeks))).join(''):`<tr><td class="empty" colspan="${weeks.length+1}">${T('ganttEmpty')}</td></tr>`;
  }
  if(!readOnly){bindRowEvents();initDrag();initBarDrag();}
  initColResize();renderPie();persist();
}
```


**Bar interaction rules:** left mouse button, day mode, not read-only, and no row/column drag; parents have no interactive wrapper. First/last8px resize; otherwise Ctrl or Alt required for move. Pixel delta rounds to whole days, endpoints cannot cross. Live movement changes memory and row text only; mouseup persists and rerenders. Undo stores only the latest edit for5000ms, with exact bilingual text outside I18N. Escape, blur and document hidden cancel and restore dates. Mouse-only bar editing; separate row/column handlers support touch. (L1111–L1379.)

**Source: L1111–L1379.**

```javascript
(function(){
  const EDGE_PX = 8; // px desde el borde que activa resize
  let barDrag = null;
  /* barDrag = { id, mode:'move'|'resize-left'|'resize-right',
       origStart, origEnd, startX, cellWidth, rowEl, wrapEl } */

  // ── Calcula el ancho en px de una celda-día en la tabla ──
  function getCellWidth(){
    const cell = document.querySelector('td.bar-cell');
    return cell ? cell.getBoundingClientRect().width : 32;
  }

  // ── Detecta el modo según posición del cursor dentro de la barra ──
  function detectMode(e, barEl){
    const r = barEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const w = r.width;
    if(x <= EDGE_PX) return 'resize-left';
    if(x >= w - EDGE_PX) return 'resize-right';
    return (e.ctrlKey || e.altKey) ? 'move' : null;
  }

  // ── Actualiza la clase de cursor en la barra según posición ──
  function updateCursor(barEl, mode){
    barEl.classList.remove('cursor-resize-left','cursor-resize-right','cursor-move');
    if(mode === 'resize-left')  barEl.classList.add('cursor-resize-left');
    if(mode === 'resize-right') barEl.classList.add('cursor-resize-right');
    if(mode === 'move')         barEl.classList.add('cursor-move');
  }

  // ── Muestra el tooltip encima del extremo derecho de la barra ──
  function showBarTip(wrapEl, delta, mode){
    const tip = wrapEl.querySelector('.bar-tip');
    if(!tip) return;
    const absDelta = Math.abs(delta);
    const dayWord = absDelta === 1
      ? (currentLang==='en' ? 'day' : 'día')
      : (currentLang==='en' ? 'days' : 'días');
    let text = '';
    if(delta === 0){
      text = mode==='move'
        ? (currentLang==='en' ? '· no change' : '· sin cambio')
        : (currentLang==='en' ? '· same' : '· igual');
    } else if(delta > 0){
      text = mode==='move'
        ? `+${absDelta} ${dayWord} →`
        : `+${absDelta} ${dayWord}`;
    } else {
      text = mode==='move'
        ? `← ${absDelta} ${dayWord}`
        : `-${absDelta} ${dayWord}`;
    }
    tip.textContent = text;
    tip.className = 'bar-tip ' + (delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'neu');
    wrapEl.classList.add('tip-visible');
  }

  function hideBarTip(wrapEl){
    if(!wrapEl) return;
    wrapEl.classList.remove('tip-visible');
  }
  function cleanupBarDragVisuals(rowEl, wrapEl){
    hideBarTip(wrapEl);
    setRowHighlight(rowEl, false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    const barEl = wrapEl?.querySelector('.bar-interactive');
    if(barEl) barEl.classList.remove('cursor-grabbing','cursor-resize-left','cursor-resize-right','cursor-move');
  }

  // ── Convierte delta px → delta días ──
  function pxToDays(px, cw){ return Math.round(px / cw); }

  // ── Resalta la fila activa ──
  function setRowHighlight(rowEl, on){
    if(rowEl) rowEl.classList.toggle('bar-live-highlight', on);
  }

  // ── Actualiza fechas en memoria + span de fechas en la fila ──
  function applyLiveDates(id, newStart, newEnd){
    const t = tasks.find(x => x.id === id);
    if(!t) return;
    t.start = new Date(newStart);
    t.end   = new Date(newEnd);
    const tr = document.querySelector(`tr[data-id="${id}"]`);
    if(tr){
      const ds = tr.querySelector('.task-dates');
      if(ds) ds.textContent = `${fmtDate(t.start)} → ${fmtDate(t.end)} · ${dayDiff(t.start,t.end)+1}d`;
    }
  }

  // ── Undo ──
  let undoTimer = null;
  let pendingUndo = null;

  function commitBarDrag(id, finalStart, finalEnd, origStart, origEnd){
    const t = tasks.find(x => x.id === id);
    if(!t) return;
    t.start = new Date(finalStart);
    t.end   = new Date(finalEnd);
    persist();
    if(undoTimer) clearTimeout(undoTimer);
    pendingUndo = { id, start: new Date(origStart), end: new Date(origEnd) };
    const label = currentLang==='en' ? 'Undo' : 'Deshacer';
    const t2 = document.getElementById('toast');
    clearTimeout(toastTimer);
    const deltaD   = dayDiff(origStart, finalStart);
    const origDur  = dayDiff(origStart, origEnd) + 1;
    const newDur   = dayDiff(finalStart, finalEnd) + 1;
    let msg = '';
    if(origDur !== newDur){
      const diff = newDur - origDur;
      msg = currentLang==='en'
        ? `Duration ${diff>0?'+'+diff:diff}d — `
        : `Duración ${diff>0?'+'+diff:diff}d — `;
    } else if(deltaD !== 0){
      msg = currentLang==='en'
        ? `Moved ${deltaD>0?'+'+deltaD:deltaD}d — `
        : `Movida ${deltaD>0?'+'+deltaD:deltaD}d — `;
    }
    t2.innerHTML = `${msg}<button onclick="undoBarDrag()" style="background:none;border:none;color:var(--blue-text);font-weight:900;cursor:pointer;font-size:13px;padding:0;margin-left:4px">${label} ↩</button>`;
    t2.classList.add('show');
    undoTimer = setTimeout(()=>{ t2.classList.remove('show'); pendingUndo=null; }, 5000);
    render();
  }

  window.undoBarDrag = function(){
    if(!pendingUndo) return;
    const t = tasks.find(x => x.id === pendingUndo.id);
    if(t){ t.start=new Date(pendingUndo.start); t.end=new Date(pendingUndo.end); persist(); render(); }
    if(undoTimer) clearTimeout(undoTimer);
    document.getElementById('toast').classList.remove('show');
    pendingUndo = null;
    showToast(currentLang==='en' ? 'Undone ↩' : 'Deshecho ↩', 1800);
  };

  // ── mousemove sobre la barra: actualiza cursor según posición y tecla ──
  function onBarHover(e){
    if(barDrag) return; // Mientras arrastramos no cambiar cursor
    const barEl = e.target.closest('[data-bar-id].bar-interactive');
    if(!barEl) return;
    const mode = detectMode(e, barEl);
    updateCursor(barEl, mode);
  }

  // ── mouseleave: restaurar cursor ──
  function onBarLeave(e){
    if(barDrag) return;
    const barEl = e.target.closest('[data-bar-id].bar-interactive');
    if(barEl) barEl.classList.remove('cursor-resize-left','cursor-resize-right','cursor-move');
  }

  // ── mousedown: inicia el drag si el modo es válido ──
  function onBarMouseDown(e){
    if(e.button !== 0) return;
    if(readOnly) return;
    if(viewMode !== 'day') return;
    if(dragId || isColResizing) return;
    const barEl = e.target.closest('[data-bar-id].bar-interactive');
    if(!barEl) return;
    const mode = detectMode(e, barEl);
    if(!mode) return; // Ni borde ni Ctrl/Alt → no hacer nada
    e.preventDefault();
    e.stopPropagation();
    const id = parseInt(barEl.dataset.barId);
    const t  = tasks.find(x => x.id === id);
    if(!t) return;
    const wrapEl = barEl.closest('.bar-wrap');
    const rowEl  = barEl.closest('tr[data-id]');
    barDrag = {
      id, mode,
      origStart: new Date(t.start),
      origEnd:   new Date(t.end),
      startX:    e.clientX,
      cellWidth: getCellWidth(),
      rowEl, wrapEl
    };
    setRowHighlight(rowEl, true);
    if(mode === 'move') barEl.classList.add('cursor-grabbing');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ew-resize';
  }

  // ── mousemove global: actualiza fechas en vivo + tooltip ──
  function onGlobalMouseMove(e){
    // Actualizar cursor en barra que se está hovering (sin drag)
    if(!barDrag){
      const barEl = e.target.closest('[data-bar-id].bar-interactive');
      if(barEl){
        const mode = detectMode(e, barEl);
        updateCursor(barEl, mode);
      }
      return;
    }
    const { id, mode, origStart, origEnd, startX, cellWidth, rowEl, wrapEl } = barDrag;
    const dx = e.clientX - startX;
    const deltaDays = pxToDays(dx, cellWidth);
    let newStart = new Date(origStart), newEnd = new Date(origEnd);
    if(mode === 'move'){
      newStart = addDays(origStart, deltaDays);
      newEnd   = addDays(origEnd,   deltaDays);
    } else if(mode === 'resize-right'){
      newEnd = addDays(origEnd, deltaDays);
      if(newEnd < newStart) newEnd = new Date(newStart);
    } else if(mode === 'resize-left'){
      newStart = addDays(origStart, deltaDays);
      if(newStart > newEnd) newStart = new Date(newEnd);
    }
    applyLiveDates(id, newStart, newEnd);
    // Delta para el tooltip
    let tooltipDelta = 0;
    if(mode === 'move')          tooltipDelta = dayDiff(origStart, newStart);
    else if(mode === 'resize-right') tooltipDelta = dayDiff(origEnd, newEnd);
    else if(mode === 'resize-left')  tooltipDelta = -dayDiff(origStart, newStart);
    showBarTip(wrapEl, tooltipDelta, mode === 'move' ? 'move' : 'resize');
  }

  // ── mouseup global: confirma o cancela ──
  function onGlobalMouseUp(){
    if(!barDrag) return;
    const { id, origStart, origEnd, rowEl, wrapEl } = barDrag;
    cleanupBarDragVisuals(rowEl, wrapEl);
    const t = tasks.find(x => x.id === id);
    if(t){
      const changed = fmtDate(t.start) !== fmtDate(origStart) || fmtDate(t.end) !== fmtDate(origEnd);
      if(changed){
        commitBarDrag(id, t.start, t.end, origStart, origEnd);
      } else {
        t.start = new Date(origStart); t.end = new Date(origEnd);
        render();
      }
    }
    barDrag = null;
  }
  function cancelBarDrag(){
    if(!barDrag) return;
    const { id, origStart, origEnd, rowEl, wrapEl } = barDrag;
    const t = tasks.find(x => x.id === id);
    if(t){ t.start = new Date(origStart); t.end = new Date(origEnd); }
    cleanupBarDragVisuals(rowEl, wrapEl);
    barDrag = null;
    render();
  }

  // ── Bind al tbody (delegado, se re-aplica en cada render) ──
  window.initBarDrag = function(){
    const tbody = document.getElementById('tbody');
    if(!tbody) return;
    tbody.removeEventListener('mousedown',  onBarMouseDown);
    tbody.removeEventListener('mousemove',  onBarHover);
    tbody.removeEventListener('mouseleave', onBarLeave, true);
    tbody.addEventListener('mousedown',  onBarMouseDown);
    tbody.addEventListener('mousemove',  onBarHover);
    tbody.addEventListener('mouseleave', onBarLeave, true);
  };
  window.isBarDragActive = function(){ return !!barDrag; };

  document.addEventListener('mousemove', onGlobalMouseMove);
  document.addEventListener('mouseup',   onGlobalMouseUp);
  window.addEventListener('blur', ()=>{ if(barDrag) cancelBarDrag(); });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden&&barDrag) cancelBarDrag(); });

  // Escape cancela el drag en curso
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && barDrag){
      cancelBarDrag();
    }
  });
})();
```


**Row reorder and column resize:** only subtasks between siblings; a family moves together; before/after uses row midpoint; clone follows pointer. Blur/visibility/touchcancel clean row drag. Width clamps80–520px and saves preferences on release; mouse and touch paths have distinct cleanup. Exact guards, errors, splice indices and event options follow. (L1697–L1752.)

**Source: L1697–L1752.**

```javascript
function moveTask(srcId,tgtId,after){
  const src=tasks.find(t=>t.id===srcId);
  const tgt=tasks.find(t=>t.id===tgtId);
  if(!src||!tgt)return false;
  // Solo subtareas pueden moverse manualmente
  if(getDepth(src)===0){showToast(currentLang==='en'?'Only subtasks can be reordered manually.':'Solo las subtareas pueden reordenarse manualmente.');return false;}
  // Solo se puede reordenar entre hermanos (mismo padre)
  if(src.parentId!==tgt.parentId){showToast(currentLang==='en'?'You can only reorder between sibling tasks.':'Solo puedes reordenar entre tareas hermanas.');return false;}
  // No mover sobre sí mismo ni dentro de sus propios descendientes
  const srcDescIds=new Set(getAllDescendants(srcId).map(t=>t.id));
  if(srcId===tgtId||srcDescIds.has(tgtId)){showToast(currentLang==='en'?'You cannot move a task inside its own descendants.':'No puedes mover una tarea dentro de su propia descendencia.');return false;}
  // Mover src y su familia dentro del array tasks
  const srcFamily=[src,...getAllDescendants(srcId)];
  const srcFamilyIds=new Set(srcFamily.map(t=>t.id));
  tasks=tasks.filter(t=>!srcFamilyIds.has(t.id));
  const tgtIdx=tasks.findIndex(t=>t.id===tgtId);
  if(tgtIdx<0)return false;
  if(after){
    const tgtDescIds=getAllDescendants(tgtId).map(t=>t.id);
    const lastId=tgtDescIds.length?tgtDescIds[tgtDescIds.length-1]:tgtId;
    const insertAt=tasks.findIndex(t=>t.id===lastId)+1;
    tasks.splice(insertAt>0?insertAt:tgtIdx+1,0,...srcFamily);
  }else{
    tasks.splice(tgtIdx,0,...srcFamily);
  }
  render();
  return true;
}
function clearIndicators(){document.querySelectorAll('.drag-over-top,.drag-over-bot,.dragging').forEach(r=>r.classList.remove('drag-over-top','drag-over-bot','dragging'));}
function cleanupRowDrag(){if(dragClone){dragClone.remove();dragClone=null;}clearIndicators();dragId=null;document.body.style.userSelect='';}
function getRowAt(x,y){if(dragClone)dragClone.style.display='none';const el=document.elementFromPoint(x,y);if(dragClone)dragClone.style.display='';return el&&el.closest('tr[data-id]');}
function updateIndicator(x,y){clearIndicators();const tr=getRowAt(x,y);if(!tr||parseInt(tr.dataset.id)===dragId)return;const r=tr.getBoundingClientRect();tr.classList.add(y<r.top+r.height/2?'drag-over-top':'drag-over-bot');}
function startDrag(id,cx,cy){if(isColResizing||(window.isBarDragActive&&window.isBarDragActive()))return;const tr=document.querySelector(`tr[data-id="${id}"]`);if(!tr)return;dragId=id;const r=tr.getBoundingClientRect();dragOffX=cx-r.left;dragOffY=cy-r.top;dragClone=tr.cloneNode(true);dragClone.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;opacity:.8;pointer-events:none;z-index:9999;background:var(--panel);border:1px solid var(--blue);border-radius:14px;box-shadow:var(--shadow);`;document.body.appendChild(dragClone);tr.classList.add('dragging');document.body.style.userSelect='none';}
function moveDrag(cx,cy){if(!dragId)return;dragClone.style.left=(cx-dragOffX)+'px';dragClone.style.top=(cy-dragOffY)+'px';updateIndicator(cx,cy);}
function endDrag(cx,cy){if(!dragId)return;const tr=getRowAt(cx,cy);if(tr){const tid=parseInt(tr.dataset.id);if(tid!==dragId){const r=tr.getBoundingClientRect();moveTask(dragId,tid,cy>r.top+r.height/2);}}cleanupRowDrag();}
function initDrag(){document.querySelectorAll('[data-handle]').forEach(h=>{h.onmousedown=e=>{e.preventDefault();startDrag(parseInt(h.dataset.handle),e.clientX,e.clientY);};h.ontouchstart=e=>{e.preventDefault();startDrag(parseInt(h.dataset.handle),e.touches[0].clientX,e.touches[0].clientY);};});}
document.addEventListener('mousemove',e=>{if(dragId)moveDrag(e.clientX,e.clientY);});
document.addEventListener('mouseup',e=>{if(dragId)endDrag(e.clientX,e.clientY);});
document.addEventListener('touchmove',e=>{if(!dragId)return;e.preventDefault();moveDrag(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
document.addEventListener('touchend',e=>{if(dragId)endDrag(e.changedTouches[0].clientX,e.changedTouches[0].clientY);});
document.addEventListener('touchcancel',()=>{if(dragId)cleanupRowDrag();});
window.addEventListener('blur',()=>{if(dragId)cleanupRowDrag();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&dragId)cleanupRowDrag();});

function initColResize(){
  document.querySelectorAll('.col-resizer').forEach(resizer=>{
    let startX=0,startW=0,resizing=false;
    const onMove=e=>{if(!resizing)return;taskColWidth=Math.min(TASK_COL_MAX,Math.max(TASK_COL_MIN,startW+(e.clientX-startX)));applyTaskColWidth();};
    const onUp=()=>{if(!resizing)return;resizing=false;isColResizing=false;resizer.classList.remove('dragging');document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);document.body.style.cursor='';document.body.style.userSelect='';savePrefs();};
    resizer.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();resizing=true;isColResizing=true;startX=e.clientX;startW=taskColWidth;resizer.classList.add('dragging');document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);document.body.style.cursor='col-resize';document.body.style.userSelect='none';});
    resizer.addEventListener('touchstart',e=>{e.preventDefault();resizing=true;isColResizing=true;startX=e.touches[0].clientX;startW=taskColWidth;},{passive:false});
    resizer.addEventListener('touchmove',e=>{if(!resizing)return;e.preventDefault();taskColWidth=Math.min(TASK_COL_MAX,Math.max(TASK_COL_MIN,startW+(e.touches[0].clientX-startX)));applyTaskColWidth();},{passive:false});
    resizer.addEventListener('touchend',()=>{resizing=false;isColResizing=false;savePrefs();});
  });
  applyTaskColWidth();
}
```


## 6. Inputs / settings

The table enumerates every ID-bearing HTML element, including containers/output elements so no settings/output target is hidden. Exact type/attributes/default text and no-ID controls are also preserved by the complete HTML block immediately afterward. Dynamic editor IDs are separate rows. Source HTML attributes are copied literally; defaults may subsequently be replaced by init or i18n. (L253–L448,L1382–L1439,L1673.)

| element id | type/attrs | default | behavior |

| --- | --- | --- | --- |

| lockScreen | `<div class="lock-screen" id="lockScreen" aria-modal="true" role="dialog" aria-labelledby="lockDocName">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L254.) |

| lockCard | `<div class="lock-card" id="lockCard">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L255.) |

| unlockLogo | `<img id="unlockLogo" alt=""/>` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L258.) |

| lockDocName | `<div class="lock-doc" id="lockDocName">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L260.) |

| lockCopy | `<p class="lock-copy" id="lockCopy">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L261.) |

| lockForm | `<form class="lock-form" id="lockForm">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L262.) |

| lockPassword | `<input class="lock-input" id="lockPassword" type="password" autocomplete="current-password"/>` | See literal markup / initialization | Empty; password autocomplete=current-password; localized placeholder; exact comparison in lock form. (L263.) |

| lockSubmit | `<button class="lock-submit" id="lockSubmit" type="submit">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L264.) |

| lockFeedback | `<div class="lock-feedback" id="lockFeedback" aria-live="polite">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L266.) |

| lockHint | `<div class="lock-hint" id="lockHint">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L267.) |

| readonlyBanner | `<div id="readonlyBanner">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L272.) |

| logoBadge | `<div class="logo-badge" id="logoBadge" aria-hidden="true">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L278.) |

| logoWm | `<img id="logoWm" alt=""/>` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L279.) |

| pctBadge | `<span id="pctBadge" style="font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:var(--green-bg);color:var(--green-text);white-space:nowrap">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L285.) |

| todayLabel | `<span class="today-pill" id="todayLabel">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L289.) |

| menuBtn | `<button class="icon-btn" id="menuBtn" type="button" aria-label="Abrir menú" aria-haspopup="true" aria-expanded="false" onclick="toggleMenu()">` | See literal markup / initialization | aria-expanded false; dropdown toggles; outside click/focus or Escape closes. (L291.) |

| dropMenu | `<div id="dropMenu" class="dropdown" role="menu" aria-label="Opciones del Gantt">` | See literal markup / initialization | CSS display none initially; exports/share/theme/demo/language controls. (L292.) |

| shareBtn | `<button class="menu-item" id="shareBtn" onclick="shareGantt()" data-i18n="menuShare">` | See literal markup / initialization | Disabled without configured/local key; hidden in shared view. (L295.) |

| themeMenuItem | `<div class="menu-item menu-item-theme" id="themeMenuItem" role="group" aria-label="Selector de tema">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L296.) |

| themeSwitch | `<div class="theme-switch" id="themeSwitch" aria-label="Cambiar tema">` | See literal markup / initialization | Preference system by default; dark/system/light buttons; OS media listener. (L298.) |

| langSwitchLabel | `<div class="theme-switch-label" id="langSwitchLabel" data-i18n="menuLangLabel">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L307.) |

| langSwitch | `<div class="theme-switch" id="langSwitch" data-active="es" aria-label="Cambiar idioma">` | See literal markup / initialization | HTML data-active es; currentLang storage/browser default can differ. (L308.) |

| toggleStatsBtn | `<button class="icon-btn" id="toggleStatsBtn" type="button" aria-label="Minimizar overview" onclick="toggleStats()">` | See literal markup / initialization | − initially; toggles statsBody; restored prefs.statsOpen. (L322.) |

| statsBody | `<div id="statsBody">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L324.) |

| stats | `<div class="stats" id="stats">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L324.) |

| progressBand | `<div class="progress-band" id="progressBand">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L324.) |

| formCard | `<div class="card glow" id="formCard">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L327.) |

| btnDay | `<button id="btnDay" class="active" onclick="setView('day')">` | See literal markup / initialization | Initially active; viewMode day by declaration; preference can override. (L332.) |

| btnWeek | `<button id="btnWeek" onclick="setView('week')">` | See literal markup / initialization | Initially inactive; sets week mode. (L333.) |

| toggleFormBtn | `<button class="icon-btn" id="toggleFormBtn" type="button" aria-label="Minimizar nueva tarea" onclick="toggleForm()">` | See literal markup / initialization | − initially; toggles formBody; restored prefs.formOpen. (L335.) |

| formBody | `<div id="formBody">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L338.) |

| formGrid | `<div id="formGrid" style="display:flex;flex-direction:column;gap:10px;margin-top:14px">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L339.) |

| newTask | `<input class="form-field" type="text" id="newTask" maxlength="120" placeholder="Nueva tarea..." data-i18n-ph="formPlaceholderName" aria-label="Nombre de nueva tarea" style="width:100%;box-sizing:border-box"/>` | See literal markup / initialization | Empty; name maxlength120; Enter adds; localized placeholder. (L341.) |

| formDates | `<div id="formDates" style="display:flex;gap:10px">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L343.) |

| newStart | `<input class="form-field form-date-input" type="date" id="newStart" aria-label="Fecha de inicio" style="flex:1;min-width:0;box-sizing:border-box;-webkit-appearance:none"/>` | See literal markup / initialization | init today; reset after add to today. (L344.) |

| newEnd | `<input class="form-field form-date-input" type="date" id="newEnd" aria-label="Fecha de fin" style="flex:1;min-width:0;box-sizing:border-box;-webkit-appearance:none"/>` | See literal markup / initialization | init today+5; reset after add to today+5. (L345.) |

| formRow2 | `<div id="formRow2" style="display:flex;gap:10px;align-items:center">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L348.) |

| newStatus | `<select id="newStatus" class="form-field" aria-label="Estado de nueva tarea" style="flex:0 0 auto;width:140px;box-sizing:border-box">` | See literal markup / initialization | First option pend; prog/done/bloc also offered; retained after add. (L349.) |

| newParent | `<select id="newParent" class="form-field" aria-label="Subtarea de" style="flex:0 0 auto;width:160px;box-sizing:border-box">` | See literal markup / initialization | Empty = no parent; options rebuild each render; preserve valid selection. (L355.) |

| newComment | `<input type="text" id="newComment" maxlength="300" placeholder="Nota opcional..." data-i18n-ph="formPlaceholderComment" aria-label="Comentario" class="form-field" style="flex:1;min-width:0;box-sizing:border-box"/>` | See literal markup / initialization | Empty; optional; maxlength300; trim on save. (L360.) |

| rangeLabel | `<span id="rangeLabel" class="stat-chip">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L372.) |

| searchTask | `<input class="grow" type="text" id="searchTask" placeholder="Buscar tarea..." aria-label="Buscar tarea" data-i18n-ph="filterPlaceholder"/>` | See literal markup / initialization | Empty or restored prefs.search; 120ms debounce; Ctrl/Meta+K focus/select. (L375.) |

| filterStatus | `<select id="filterStatus" aria-label="Filtrar por estado">` | See literal markup / initialization | all by default; all/prog/done/pend/bloc/late/over; change renders. (L376.) |

| sortBy | `<select id="sortBy" aria-label="Ordenar tareas">` | See literal markup / initialization | startAsc by default; startAsc/startDesc/endAsc/endDesc/status/name; change renders; visible tree reorders roots. (L385.) |

| resultInfo | `<div class="helper" id="resultInfo" aria-live="polite">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L395.) |

| shareHint | `<div class="muted-note" id="shareHint">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L396.) |

| ganttTable | `<table id="ganttTable">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L401.) |

| thead | `<thead id="thead">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L401.) |

| tbody | `<tbody id="tbody">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L401.) |

| pieTotal | `<span id="pieTotal" class="stat-chip">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L418.) |

| toggleInsightBtn | `<button class="icon-btn" id="toggleInsightBtn" type="button" aria-label="Minimizar health snapshot" onclick="toggleInsight()">` | See literal markup / initialization | − initially; toggles insightBody; restored prefs.insightOpen. (L419.) |

| insightBody | `<div id="insightBody">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L422.) |

| pieWrap | `<div class="pie-svg-wrap" id="pieWrap">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L425.) |

| pieLegend | `<div class="legend-card" id="pieLegend">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L426.) |

| linkModal | `<div id="linkModal" role="dialog" aria-modal="true" aria-labelledby="shareModalTitle">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L433.) |

| shareModalTitle | `<h2 id="shareModalTitle" data-i18n="shareTitle">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L435.) |

| shareUrl | `<div class="modal-link" id="shareUrl">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L437.) |

| toast | `<div id="toast">` | See literal markup / initialization | Container/output/modal/logo; direct function references in §2B; exact markup below (L448.) |



| element id | type/attrs | default | behavior |

| --- | --- | --- | --- |

| ei-name | text; maxlength120 | safeText(t.name) | Inline name, L1673. |

| ei-start / ei-end | date | fmtDate(t.start) / fmtDate(t.end) | Own dates, not effective; L1673. |

| ei-status | select | opts(t.status) | Includes all five display statuses, including late; L1672–L1673. |

| ei-parent | select | t.parentId | No-parent option plus options excluding self/descendants; L1086–L1088,L1673. |

| ei-comment | text; maxlength300 | safeText(t.comment&#124;&#124;'') | Localized placeholder; L1673. |



**Complete HTML contract:** this also documents controls without IDs (Add/Clear/exports/theme/language/copy/close) and exact static labels/ARIA/title text that may remain Spanish after language switching. (L253–L448.)

**Source: L253–L448.**

```html
<body>
<div class="lock-screen" id="lockScreen" aria-modal="true" role="dialog" aria-labelledby="lockDocName">
  <div class="lock-card" id="lockCard">
    <div class="lock-card-inner">
      <div class="lock-logo" aria-hidden="true">
        <img id="unlockLogo" alt=""/>
      </div>
      <div class="lock-doc" id="lockDocName"></div>
      <p class="lock-copy" id="lockCopy"></p>
      <form class="lock-form" id="lockForm">
        <input class="lock-input" id="lockPassword" type="password" autocomplete="current-password"/>
        <button class="lock-submit" id="lockSubmit" type="submit"></button>
      </form>
      <div class="lock-feedback" id="lockFeedback" aria-live="polite"></div>
      <div class="lock-hint" id="lockHint"></div>
    </div>
  </div>
</div>
<div class="shell">
<div id="readonlyBanner">👁 Modo visualización — solo lectura</div>
<div class="topbar">
  <div class="hero">
    <div class="kicker"><span class="kicker-dot"></span> R&D Process Engineering</div>
    <div class="header-brand">
      <h1>Gantt Tracker</h1>
      <div class="logo-badge" id="logoBadge" aria-hidden="true">
        <img id="logoWm" alt=""/>
        <span class="logo-fallback">CJLB</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <p class="subtitle">Seguimiento de actividades — R&amp;D / Process Engineering</p>
      <span id="pctBadge" style="font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:var(--green-bg);color:var(--green-text);white-space:nowrap"></span>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <span class="today-pill" id="todayLabel"></span>
    <div class="menu">
      <button class="icon-btn" id="menuBtn" type="button" aria-label="Abrir menú" aria-haspopup="true" aria-expanded="false" onclick="toggleMenu()">☰</button>
      <div id="dropMenu" class="dropdown" role="menu" aria-label="Opciones del Gantt">
        <button class="menu-item" onclick="exportExcel()" data-i18n="menuExportExcel">⬇ Exportar a Excel</button>
        <button class="menu-item" onclick="exportPNG()" data-i18n="menuExportPNG">🖼 Crear PNG del Gantt</button>
        <button class="menu-item" id="shareBtn" onclick="shareGantt()" data-i18n="menuShare">🔗 Compartir Gantt</button>
        <div class="menu-item menu-item-theme" id="themeMenuItem" role="group" aria-label="Selector de tema">
          <div class="theme-switch-label" data-i18n="menuThemeLabel">🌓 Tema</div>
          <div class="theme-switch" id="themeSwitch" aria-label="Cambiar tema">
            <button type="button" class="theme-option" data-theme="dark" aria-label="Oscuro">🌙<span>Oscuro</span></button>
            <button type="button" class="theme-option" data-theme="system" aria-label="Sistema">🖥<span>Sistema</span></button>
            <button type="button" class="theme-option" data-theme="light" aria-label="Claro">☀️<span>Claro</span></button>
            <span class="theme-thumb" aria-hidden="true"></span>
          </div>
        </div>
        <button class="menu-item" onclick="resetDemo()" data-i18n="menuReset">↺ Restaurar demo</button>
        <div class="menu-item menu-item-theme" role="group" aria-label="Selector de idioma">
          <div class="theme-switch-label" id="langSwitchLabel" data-i18n="menuLangLabel">🌐 Idioma</div>
          <div class="theme-switch" id="langSwitch" data-active="es" aria-label="Cambiar idioma">
            <button type="button" class="theme-option lang-option active" data-lang="es" aria-label="Español" onclick="setLang('es')"><span>Español</span></button>
            <button type="button" class="theme-option lang-option" data-lang="en" aria-label="English" onclick="setLang('en')"><span>English</span></button>
            <span class="theme-thumb" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="card glow">
  <div class="panel-head">
    <div><span class="panel-title" data-i18n="overviewTitle">Overview rápido</span><div class="panel-subtitle" data-i18n="overviewSubtitle">Resumen ejecutivo del plan</div></div>
    <button class="icon-btn" id="toggleStatsBtn" type="button" aria-label="Minimizar overview" onclick="toggleStats()">−</button>
  </div>
  <div id="statsBody"><div class="stats" id="stats"></div><div class="progress-band" id="progressBand"></div></div>
</div>

<div class="card glow" id="formCard">
  <div class="panel-head">
    <div><span class="panel-title" data-i18n="formTitle">Nueva tarea</span><div class="panel-subtitle" data-i18n="formSubtitle">Agrega tareas rápidas con fechas y estado</div></div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div class="view-toggle">
        <button id="btnDay" class="active" onclick="setView('day')">Días</button>
        <button id="btnWeek" onclick="setView('week')">Semanas</button>
      </div>
      <button class="icon-btn" id="toggleFormBtn" type="button" aria-label="Minimizar nueva tarea" onclick="toggleForm()">−</button>
    </div>
  </div>
  <div id="formBody">
    <div id="formGrid" style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
      <!-- Fila 1: Nombre -->
      <input class="form-field" type="text" id="newTask" maxlength="120" placeholder="Nueva tarea..." data-i18n-ph="formPlaceholderName" aria-label="Nombre de nueva tarea" style="width:100%;box-sizing:border-box"/>
      <!-- Fila 2: Fechas -->
      <div id="formDates" style="display:flex;gap:10px">
        <input class="form-field form-date-input" type="date" id="newStart" aria-label="Fecha de inicio" style="flex:1;min-width:0;box-sizing:border-box;-webkit-appearance:none"/>
        <input class="form-field form-date-input" type="date" id="newEnd" aria-label="Fecha de fin" style="flex:1;min-width:0;box-sizing:border-box;-webkit-appearance:none"/>
      </div>
      <!-- Fila 3+: Estado / Padre / Comentario / Agregar -->
      <div id="formRow2" style="display:flex;gap:10px;align-items:center">
        <select id="newStatus" class="form-field" aria-label="Estado de nueva tarea" style="flex:0 0 auto;width:140px;box-sizing:border-box">
          <option value="pend">Pendiente</option>
          <option value="prog">En progreso</option>
          <option value="done">Completado</option>
          <option value="bloc">Bloqueado</option>
        </select>
        <select id="newParent" class="form-field" aria-label="Subtarea de" style="flex:0 0 auto;width:160px;box-sizing:border-box">
          <option value="">Sin padre</option>
        </select>
        <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">
          <span style="font-size:16px;flex-shrink:0;color:var(--text-2)" title="Comentario">💬</span>
          <input type="text" id="newComment" maxlength="300" placeholder="Nota opcional..." data-i18n-ph="formPlaceholderComment" aria-label="Comentario" class="form-field" style="flex:1;min-width:0;box-sizing:border-box"/>
        </div>
        <button class="btn btn-primary" type="button" onclick="addTask()" style="flex-shrink:0">+ Agregar</button>
      </div>
    </div>
    <div class="helper" style="margin-top:10px">Tip: Enter para agregar rápido · Ctrl+K para buscar · Guardado automático</div>
  </div>
</div>

<div class="card">
  <div class="panel-head">
    <div><span class="panel-title" data-i18n="filterTitle">Vista general</span><div class="panel-subtitle" data-i18n="filterSubtitle">Busca, filtra y ordena</div></div>
    <span id="rangeLabel" class="stat-chip">Rango</span>
  </div>
  <div class="filterbar">
    <input class="grow" type="text" id="searchTask" placeholder="Buscar tarea..." aria-label="Buscar tarea" data-i18n-ph="filterPlaceholder"/>
    <select id="filterStatus" aria-label="Filtrar por estado">
      <option value="all">Todos los estados</option>
      <option value="prog">En progreso</option>
      <option value="done">Completado</option>
      <option value="pend">Pendiente</option>
      <option value="bloc">Bloqueado</option>
      <option value="late">Tarde</option>
      <option value="over">Vencidas</option>
    </select>
    <select id="sortBy" aria-label="Ordenar tareas">
      <option value="startAsc">Inicio más próximo</option>
      <option value="startDesc">Inicio más lejano</option>
      <option value="endAsc">Fin más próximo</option>
      <option value="endDesc">Fin más lejano</option>
      <option value="status">Por estado</option>
      <option value="name">Nombre A-Z</option>
    </select>
    <button class="btn" type="button" onclick="clearFilters()" data-i18n="btnClear">Limpiar</button>
  </div>
  <div class="helper" id="resultInfo" aria-live="polite"></div>
  <div class="muted-note" id="shareHint"></div>
</div>

<div class="card">
  <div class="gantt-wrap">
    <table id="ganttTable"><thead id="thead"></thead><tbody id="tbody"></tbody></table>
  </div>
  <div class="legend">
    <span><span class="dot" style="background:var(--blue)"></span><span data-i18n="legendProg">En progreso</span></span>
    <span><span class="dot" style="background:var(--green)"></span><span data-i18n="legendDone">Completado</span></span>
    <span><span class="dot" style="background:var(--gray)"></span><span data-i18n="legendPend">Pendiente</span></span>
    <span><span class="dot" style="background:var(--red)"></span><span data-i18n="legendBloc">Bloqueado</span></span>
    <span><span class="dot" style="background:var(--amber)"></span><span data-i18n="legendLate">Tarde</span></span>
    <span><span class="dot" style="background:var(--amber);opacity:.5"></span><span data-i18n="legendOver">Vencida</span></span>
    <span><span class="dot" style="background:var(--red);width:3px;border-radius:0"></span><span data-i18n="legendToday">Hoy</span></span>
  </div>
</div>

<div class="card">
  <div class="panel-head" style="margin-bottom:14px">
    <div><span class="panel-title" data-i18n="healthTitle">Health snapshot</span><div class="panel-subtitle" data-i18n="healthSubtitle">Distribución por estado — clic en segmento para detalle</div></div>
    <div style="display:flex;align-items:center;gap:8px">
      <span id="pieTotal" class="stat-chip">0 tareas</span>
      <button class="icon-btn" id="toggleInsightBtn" type="button" aria-label="Minimizar health snapshot" onclick="toggleInsight()">−</button>
    </div>
  </div>
  <div id="insightBody">
    <div class="pie-wrap">
      <div class="pie-layout">
        <div class="pie-svg-wrap" id="pieWrap"></div>
        <div class="legend-card" id="pieLegend"></div>
      </div>
    </div>
  </div>
</div>
</div>

<div id="linkModal" role="dialog" aria-modal="true" aria-labelledby="shareModalTitle">
  <div class="modal-box">
    <h2 id="shareModalTitle" data-i18n="shareTitle">🔗 Link para compartir</h2>
    <p>Cualquier persona con este link puede visualizar tu Gantt en modo solo lectura.</p>
    <div class="modal-link" id="shareUrl"></div>
    <div class="modal-actions">
      <button class="btn" onclick="copyLink()" data-i18n="shareCopy">Copiar link</button>
      <button class="btn btn-primary" onclick="closeModal()" data-i18n="shareClose">Cerrar</button>
    </div>
  </div>
</div>
<footer style="text-align:center;padding:20px 0 10px;font-size:11px;color:var(--text-3);letter-spacing:.04em">
  Gantt Tracker R&D · Desarrollado por <strong style="color:var(--text-2)">CJLB</strong> · Process &amp; Tooling Engineering
</footer>

<div id="toast"></div>
```


**Storage lifecycle and shapes:** no sessionStorage, IndexedDB, cookies or server login-session storage is used anywhere in L451–L2134. localStorage is origin-scoped. Key constants are L881–L886; exact task/prefs serializers are L1049–L1053 (§3).

| key | JSON shape / value | read | write/remove |

| --- | --- | --- | --- |

| ganttTrackerV27 | Array<{id,name,start:YYYY-MM-DD,end:YYYY-MM-DD,status,comment,parentId}> | loadTasks L1051; editable init L1415 | persist L1442 on render L1669; resetDemo removes then render writes demo L1686 |

| ganttBinId | Raw bin ID string, not JSON | shareGantt L1777 | New POST success L1788; resetDemo removes L1686; not read to activate shared mode |

| ganttPrefsV27 | {viewMode,taskColWidth,formOpen,statsOpen,insightOpen,search,filter,sort} | loadPrefs L1052; init L1386–L1391,L1416–L1418 | savePrefs L1053 via persist/toggles/resize; no write in read-only |

| ganttThemePrefV1 | Raw dark/system/light string | L908 | setThemePreference L935; remains writable in read-only |

| ganttLangPrefV1 | Raw es/en string | L460 | setLang L789; remains writable in read-only |

| ganttJsonbinKey | Raw master-key string | getJsonBinKey L888, only if APP_CONFIG.jsonbinKey is falsy | No writer/UI for this key in source; external/manual configuration only |



Collapsed IDs, pie selection, editing ID, row/bar drag state, pending undo, appUnlocked and nextId are **not persisted separately**; nextId is recomputed on init. Tasks store parentId but no project metadata/dependency list/progress percentage. Preference parsing catches invalid JSON but does not validate object shape before init dereferences it. (L1049–L1061,L1203–L1213,L1386–L1391,L1425,L1442.)

## 7. Exports / sharing

**Supported outputs:** XLSX, custom canvas PNG, JSONBin publication/read-only link, and clipboard copy. No PDF, CSV, downloadable standalone JSON, ZIP download, print command, email, native navigator.share, or import counterpart exists in L451–L2134. XLSX is internally ZIP-based, but is not a separate ZIP export (L1984,L2023). Neither export is a screenshot of the app; both redraw a daily timeline even in weekly view, and use the filtered, collapsed visible tree (L1840–L1842,L2030–L2032).

**JSONBin / `?bin=` — REMOVE IN PORT, document original only:** endpoint `https://api.jsonbin.io/v3/b`; key config-or-localStorage fallback; raw tasks payload plus fresh ISO updatedAt; PUT existing LS_BIN, otherwise POST public bin named gantt-tracker, Content-Type application/json and X-Master-Key. Link construction strips query via split but does not intentionally normalize hash. A nonempty bin query enables read-only mode; GET /{id}/latest can use optional master key. Empty/failed remote result falls back to demo with localized failure. Sharing serializes **all tasks**, not filtered/collapsed rows. The link loads the latest mutable bin, not a frozen snapshot. No remote request was executed for this inventory. (L451–L453,L888–L890,L1036–L1038,L1395–L1413,L1768–L1795.)

**Source: L888–L890.**

```javascript
function getJsonBinKey(){return APP_CONFIG.jsonbinKey||localStorage.getItem(LS_JSONBIN_KEY)||''}
function hasShareSupport(){return !!getJsonBinKey()}
function getJsonBinUrl(){return APP_CONFIG.jsonbinUrl}
```


**Source: L1768–L1827.**

```javascript
async function shareGantt(){
  toggleMenu(false);
  if(!hasShareSupport()){
    showToast(T('toastShareMissing'));
    return;
  }
  showToast(T('toastUploading'),6000);
  const payload={tasks:serializeTasks(),updatedAt:new Date().toISOString()};
  try{
    const existing=localStorage.getItem(LS_BIN);let binId=existing;
    const baseHeaders={'Content-Type':'application/json','X-Master-Key':getJsonBinKey()};
    if(existing){
      const res=await fetch(`${getJsonBinUrl()}/${existing}`,{method:'PUT',headers:baseHeaders,body:JSON.stringify(payload)});
      if(!res.ok)throw new Error(`${res.status} ${res.statusText}`.trim());
    }else{
      const res=await fetch(getJsonBinUrl(),{method:'POST',headers:{...baseHeaders,'X-Bin-Name':'gantt-tracker','X-Bin-Private':'false'},body:JSON.stringify(payload)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data?.message||`${res.status} ${res.statusText}`.trim());
      binId=data.metadata?.id;
      if(!binId)throw new Error(currentLang==='en'?'Bin ID was not returned.':'No se recibió binId.');
      localStorage.setItem(LS_BIN,binId);
    }
    const url=`${location.href.split('?')[0]}?bin=${binId}`;
    document.getElementById('shareUrl').textContent=url;
    document.getElementById('linkModal').classList.add('show');
    showToast(T('toastShared'));
  }catch(err){showToast(T('toastShareError')+(err.message||(currentLang==='en'?'check your connection':'revisa tu conexión')));}
}
function copyLink(){
  const text=document.getElementById('shareUrl').textContent;
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(text).then(()=>showToast(T('toastCopied'))).catch(()=>fallbackCopyLink(text));
  }else fallbackCopyLink(text);
}
function fallbackCopyLink(text){
  try{
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.opacity='0';
    document.body.appendChild(ta);
    ta.select();
    const ok=document.execCommand('copy');
    ta.remove();
    showToast(ok?T('toastCopied'):T('toastCopyError'));
  }catch(_){showToast(T('toastCopyError'));}
}
function closeModal(){document.getElementById('linkModal').classList.remove('show');}
document.getElementById('linkModal').addEventListener('click',e=>{if(e.target.id==='linkModal')closeModal();});

// ── Export Excel ──
function exportExcel(){
  toggleMenu(false);
  if(window.ExcelJS){buildExcel();return;}
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js';
  s.onload=buildExcel;
  document.head.appendChild(s);
}
```


**Excel composition:** creator Gantt Tracker R&D; worksheet Gantt; created current Date; title merged across3+days; fixed columns36/18/28, daily4.2; title/month/day heights28/20/22, task rows22; Calibri font sizes/styles/alignment/borders copied below. Three frozen columns and three frozen rows; grid lines off. Month names localized, numeric day ticks, today emphasized with medium red borders. Name prefixes↳, overdue⚠ and comment💬; status cell localized with dropdown and conditional colors; comment wraps. Day fills use effective span; original per-cell CF uses own span with only four statuses; attempted XML patch covers effective span and five statuses. Preserve these differences as observed, not as a harmonized design. (L1838–L1965.)

**Exact Excel style palette, layout, validation formulae, CF/XML strings, patch/fallback, filename and download lifecycle:** ARGB strings are eight-digit Excel colors, not six-digit CSS colors. Private ZIP detection may fail; catch warns `[CF patch]` and original buffer still downloads. CDN script has onload only, no onerror. buildExcel has no outer user-facing catch. A success toast is shown after either download path, not proof the browser saved the file. Filename is the exact template in descargarBuf. (L1820–L2023.)

**Source: L1829–L2023.**

```javascript
async function buildExcel(){
  const isDark=isDarkTheme();
  const P=isDark?{titleBg:'FF0F172A',titleFg:'FFEDF3FF',monthBg:'FF131E35',monthFg:'FF72A8FF',dayBg:'FF1A2742',dayFg:'FFA9B6CD',todayBg:'FFEF5B67',todayFg:'FFFFFFFF',rowA:'FF0F172A',rowB:'FF131E35',rowFg:'FFEDF3FF',border:'FF22304D',weekend:'FF0B1525',barProg:'FF4F8CFF',barDone:'FF43B36B',barPend:'FF8A94A6',barBloc:'FFEF5B67',barLate:'FFF59E0B',badgeProg:['FF11284C','FFA8CBFF'],badgeDone:['FF10281A','FF9AE5B1'],badgePend:['FF1A2437','FFC0CAD8'],badgeBloc:['FF34131A','FFFFB0BA'],badgeLate:['FF322712','FFFFD78F'],badgeOver:['FF322712','FFFFD78F']}
  :{titleBg:'FF142033',titleFg:'FFFFFFFF',monthBg:'FF1E2E45',monthFg:'FFFFFFFF',dayBg:'FFEEF3F9',dayFg:'FF5F6B7D',todayBg:'FFEF5B67',todayFg:'FFFFFFFF',rowA:'FFFFFFFF',rowB:'FFF4F7FB',rowFg:'FF142033',border:'FFD8E4F0',weekend:'FFF0F4FA',barProg:'FF4F8CFF',barDone:'FF43B36B',barPend:'FF8A94A6',barBloc:'FFEF5B67',barLate:'FFF59E0B',badgeProg:['FFE9F1FF','FF235FD2'],badgeDone:['FFEAF9EF','FF217543'],badgePend:['FFEEF1F6','FF5D6778'],badgeBloc:['FFFFECEE','FFB82C3F'],badgeLate:['FFFFF5DF','FF9A6800'],badgeOver:['FFFFF5DF','FF9A6800']};

  const f=(a)=>({type:'pattern',pattern:'solid',fgColor:{argb:a}});
  const th=(a)=>({style:'thin',color:{argb:a}});
  const bord=(a)=>({top:th(a),bottom:th(a),left:th(a),right:th(a)});

  const wb=new ExcelJS.Workbook();wb.creator='Gantt Tracker R&D';wb.created=new Date();
  const ws=wb.addWorksheet('Gantt',{views:[{showGridLines:false}]});
  const list=buildTreeList(filteredTasks());
  const{start,end}=getRange(list.length?list:tasks);
  const total=dayDiff(start,end)+1;
  ws.getColumn(1).width=36;ws.getColumn(2).width=18;ws.getColumn(3).width=28;
  for(let i=0;i<total;i++)ws.getColumn(4+i).width=4.2;

  const r1=ws.addRow([]);r1.height=28;
  ws.mergeCells(1,1,1,3+total);
  const tc=r1.getCell(1);tc.value=T('excelTitle');
  tc.fill=f(P.titleBg);tc.font={name:'Calibri',size:13,bold:true,color:{argb:P.titleFg}};tc.alignment={horizontal:'left',vertical:'middle'};

  const r2=ws.addRow([]);r2.height=20;
  [T('excelColTask'),T('excelColStatus'),T('excelColComment')].forEach((v,i)=>{const c=r2.getCell(i+1);c.value=v;c.fill=f(P.monthBg);c.font={name:'Calibri',size:11,bold:true,color:{argb:P.monthFg}};c.alignment={horizontal:i===1?'center':'left',vertical:'middle'};c.border=bord(P.border);});
  let cur=new Date(start),col=4;
  while(cur<=end){const mo=cur.getMonth(),yr=cur.getFullYear();let sp=0,pr=new Date(cur);while(pr<=end&&pr.getMonth()===mo&&pr.getFullYear()===yr){sp++;pr=addDays(pr,1);}const c=r2.getCell(col);c.value=`${MONTHS[mo]} ${yr}`;c.fill=f(P.monthBg);c.font={name:'Calibri',size:10,bold:true,color:{argb:P.monthFg}};c.alignment={horizontal:'center',vertical:'middle'};c.border=bord(P.border);if(sp>1)ws.mergeCells(2,col,2,col+sp-1);col+=sp;cur=pr;}

  const r3=ws.addRow([]);r3.height=22;
  [1,2,3].forEach(i=>{r3.getCell(i).fill=f(P.dayBg);r3.getCell(i).border=bord(P.border);});
  for(let i=0;i<total;i++){const d=addDays(start,i),isT=dayDiff(today,d)===0,isWE=isWeekend(d);const c=r3.getCell(4+i);c.value=d.getDate();c.fill=f(isT?P.todayBg:isWE?P.weekend:P.dayBg);c.font={name:'Calibri',size:9,bold:isT,color:{argb:isT?P.todayFg:P.dayFg}};c.alignment={horizontal:'center',vertical:'middle'};c.border=isT?{top:th(P.todayBg),bottom:th(P.todayBg),left:{style:'medium',color:{argb:P.todayBg}},right:{style:'medium',color:{argb:P.todayBg}}}:bord(P.border);}

  const barMap={prog:P.barProg,done:P.barDone,pend:P.barPend,bloc:P.barBloc,late:P.barLate};
  const statusText={prog:T('statusProg'),done:T('statusDone'),pend:T('statusPend'),bloc:T('statusBloc'),late:T('statusLate')};
  const badgeMap={prog:P.badgeProg,done:P.badgeDone,pend:P.badgePend,bloc:P.badgeBloc,late:P.badgeLate};

  list.forEach((t,idx)=>{
    const row=ws.addRow([]);row.height=22;
    const ds=getDisplayStatus(t);
    const depth=getDepth(t);
    const over=isOverdue(t),rowBg=idx%2===0?P.rowA:P.rowB,bc=over?P.badgeOver:badgeMap[ds]||badgeMap.pend;
    const prefix=depth>0?'↳ ':'';
    const nc=row.getCell(1);nc.value=prefix+t.name+(over?' ⚠':'')+(t.comment?' 💬':'');nc.fill=f(rowBg);nc.font={name:'Calibri',size:11,italic:over,color:{argb:P.rowFg}};nc.alignment={horizontal:'left',vertical:'middle',indent:depth};nc.border=bord(P.border);
    const sc=row.getCell(2);sc.value=statusText[ds]||statusText[t.status];sc.fill=f(bc[0]);sc.font={name:'Calibri',size:10,bold:true,color:{argb:bc[1]}};sc.alignment={horizontal:'center',vertical:'middle'};sc.border=bord(P.border);
    const cc=row.getCell(3);cc.value=t.comment||'';cc.fill=f(rowBg);cc.font={name:'Calibri',size:10,color:{argb:P.rowFg}};cc.alignment={horizontal:'left',vertical:'middle',wrapText:true};cc.border=bord(P.border);
    // Dropdown
    sc.dataValidation={
      type:'list',allowBlank:false,showDropDown:false,
      formulae:[`"${T('statusProg')},${T('statusDone')},${T('statusPend')},${T('statusBloc')},${T('statusLate')}"`],
      showErrorMessage:false
    };
    const effDatesXl=getEffectiveDates(t);
    for(let i=0;i<total;i++){const d=addDays(start,i),isT=dayDiff(today,d)===0,isWE=isWeekend(d),inR=d>=effDatesXl.start&&d<=effDatesXl.end;const c=row.getCell(4+i);c.fill=f(inR?barMap[ds]||barMap.pend:isWE?P.weekend:rowBg);c.border=isT?{top:th(P.border),bottom:th(P.border),left:{style:'medium',color:{argb:P.todayBg}},right:{style:'medium',color:{argb:P.todayBg}}}:bord(P.border);}

    // ── Formato condicional badge ──
    const rowNum=4+idx;
    [
      {txt:T('statusProg'),bg:P.badgeProg[0],fg:P.badgeProg[1]},
      {txt:T('statusDone'),bg:P.badgeDone[0],fg:P.badgeDone[1]},
      {txt:T('statusPend'),bg:P.badgePend[0],fg:P.badgePend[1]},
      {txt:T('statusBloc'),bg:P.badgeBloc[0],fg:P.badgeBloc[1]},
      {txt:T('statusLate'),bg:P.badgeLate[0],fg:P.badgeLate[1]},
    ].forEach(({txt,bg,fg},pri)=>{
      ws.addConditionalFormatting({
        ref:`B${rowNum}`,
        rules:[{
          type:'expression',
          priority:pri+1+(idx*10),
          formulae:[`B${rowNum}="${txt}"`],
          style:{
            fill:{type:'pattern',pattern:'solid',fgColor:{argb:bg},bgColor:{argb:bg}},
            font:{name:'Calibri',size:10,bold:true,color:{argb:fg}}
          }
        }]
      });
    });

    // ── Formato condicional barras ──
    for(let i=0;i<total;i++){
      const d=addDays(start,i);
      if(d<t.start||d>t.end)continue;
      const cl=ws.getColumn(4+i).letter;
      [
        {txt:T('statusProg'),argb:P.barProg},
        {txt:T('statusDone'),argb:P.barDone},
        {txt:T('statusPend'),argb:P.barPend},
        {txt:T('statusBloc'),argb:P.barBloc},
      ].forEach(({txt,argb},pri)=>{
        ws.addConditionalFormatting({
          ref:`${cl}${rowNum}`,
          rules:[{
            type:'expression',
            priority:100+(idx*20)+pri,
            formulae:[`$B${rowNum}="${txt}"`],
            style:{fill:{type:'pattern',pattern:'solid',fgColor:{argb}}}
          }]
        });
      });
    }
  });

  ws.views=[{state:'frozen',xSplit:3,ySplit:3,showGridLines:false}];

  // ── Generar buffer y patch CF de barras via XML directo ──
  const buf=await wb.xlsx.writeBuffer();

  // Construir XML de CF para barras manualmente
  let cfXml='';
  list.forEach((t,idx)=>{
    const rowNum=4+idx;
    const effXl=getEffectiveDates(t);
    // Encontrar columnas de inicio y fin de la barra
    let barStartCol=-1,barEndCol=-1;
    for(let i=0;i<total;i++){
      const d=addDays(start,i);
      if(d>=effXl.start&&d<=effXl.end){
        if(barStartCol===-1)barStartCol=4+i;
        barEndCol=4+i;
      }
    }
    if(barStartCol===-1)return;

    // Convertir número de columna a letra Excel
    function toColLetter(n){let s='';while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;}
    const c1=toColLetter(barStartCol);
    const c2=toColLetter(barEndCol);
    const sqref=`${c1}${rowNum}:${c2}${rowNum}`;

    const barCF=[
      {txt:T('statusProg'),argb:P.barProg},
      {txt:T('statusDone'),argb:P.barDone},
      {txt:T('statusPend'),argb:P.barPend},
      {txt:T('statusBloc'),argb:P.barBloc},
      {txt:T('statusLate'),argb:P.barLate},
    ];
    barCF.forEach(({txt,argb},pri)=>{
      cfXml+=`<conditionalFormatting sqref="${sqref}"><cfRule type="expression" dxfId="${idx*5+pri}" priority="${200+idx*5+pri}"><formula>$B${rowNum}="${txt}"</formula></cfRule></conditionalFormatting>`;
    });
  });

  // Construir dxfs (estilos diferenciados para CF)
  let dxfXml='';
  const allBars=[P.barProg,P.barDone,P.barPend,P.barBloc,P.barLate];
  list.forEach((t,idx)=>{
    allBars.forEach(argb=>{
      dxfXml+=`<dxf><fill><patternFill patternType="solid"><fgColor rgb="${argb}"/><bgColor rgb="${argb}"/></patternFill></fill></dxf>`;
    });
  });

  // Patch el XML del workbook via string replacement
  if(cfXml){
    const decoder=new TextDecoder();
    const uint=new Uint8Array(buf);
    // ExcelJS usa su propio JSZip internamente — acceder via hack de string
    // Convertir buffer a base64, luego a ZIP via FileReader approach
    // En su lugar, usar un enfoque más simple: patch post-serialización
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

    // Usar FileReader para leer como ArrayBuffer y luego JSZip si disponible
    // Si no hay JSZip externo, simplemente descargar sin CF de barras
    try{
      // Intentar acceder al JSZip interno de ExcelJS
      const internalZip=wb._zip||wb.zip||(wb._wb&&wb._wb.zip)||null;
      if(internalZip&&internalZip.file){
        const sheetXml=internalZip.file('xl/worksheets/sheet1.xml').asText();
        const stylesXml=internalZip.file('xl/styles.xml').asText();

        // Patch sheet: agregar CF de barras antes de </worksheet>
        const patchedSheet=sheetXml.replace('</worksheet>',cfXml+'</worksheet>');

        // Patch styles: agregar dxfs
        let patchedStyles=stylesXml;
        if(stylesXml.includes('<dxfs count="0"/>')){
          const count=list.length*5;
          patchedStyles=stylesXml.replace('<dxfs count="0"/>',`<dxfs count="${count}">${dxfXml}</dxfs>`);
        }else if(stylesXml.includes('<dxfs')){
          patchedStyles=stylesXml.replace(/<dxfs count="\d+">/,`<dxfs count="${list.length*5}">`);
          patchedStyles=patchedStyles.replace('</dxfs>',dxfXml+'</dxfs>');
        }else{
          patchedStyles=stylesXml.replace('</styleSheet>',`<dxfs count="${list.length*5}">${dxfXml}</dxfs></styleSheet>`);
        }

        internalZip.file('xl/worksheets/sheet1.xml',patchedSheet);
        internalZip.file('xl/styles.xml',patchedStyles);
        const patchedBuf=internalZip.generate({type:'arraybuffer'});
        descargarBuf(patchedBuf);
        showToast(T('toastExcelOk'));
        return;
      }
    }catch(e){console.warn('[CF patch]',e);}
  }

  descargarBuf(buf);
  showToast(T('toastExcelOk'));
}
function descargarBuf(buf){const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gantt_${fmtDate(today)}.xlsx`;a.click();URL.revokeObjectURL(url);}
```


**PNG composition:** filtered visible hierarchy; daily canvas at DPR2, ROW_H36,H1=22,H2=28,TCW=taskColWidth,DW28,PAD16; dimensions ceiled after DPR multiplication. Title is a timeline header, not a separate page title; no overview cards/donut/footer/logo rendered. Header completion badge counts the collapsed visible export list, unlike on-page stats. Canvas font is -apple-system,sans-serif. Own text clipping, dates, badges, bar alpha, 3px depth markers, weekends and today lines; no image stitching or size cap. Full formulae/palettes/positions and literal filenames/error paths are below. (L2026–L2104.)

**Source: L2026–L2104.**

```javascript
function exportPNG(){
  toggleMenu(false);
  try{
    const isDark=isDarkTheme();
    const list=buildTreeList(filteredTasks());
    const{start,end}=getRange(list.length?list:tasks);const totalDays=dayDiff(start,end)+1;
    const DPR=2,ROW_H=36,H1=22,H2=28,TCW=taskColWidth,DW=28,PAD=16,TW=TCW+totalDays*DW+PAD*2,TH=H1+H2+list.length*ROW_H+PAD*2;
    const cv=document.createElement('canvas');cv.width=Math.ceil(TW*DPR);cv.height=Math.ceil(TH*DPR);
    const ctx=cv.getContext('2d');if(!ctx){showToast(T('toastCanvasError'));return;}ctx.scale(DPR,DPR);
    const C=isDark?{bg:'#0f172a',bg2:'#131e35',bg3:'#1a2742',text:'#edf3ff',text2:'#a9b6cd',border:'rgba(255,255,255,0.12)',today:'#ff7683',todayBg:'rgba(255,118,131,0.12)',weekend:'#10192b',blue:'#72a8ff',blueBg:'#11284c',blueText:'#a8cbff',green:'#59c97f',greenBg:'#10281a',greenText:'#9ae5b1',gray:'#91a0b7',grayBg:'#1a2437',grayText:'#c0cad8',red:'#ff7683',redBg:'#34131a',redText:'#ffb0ba',amber:'#f8b84f',amberBg:'#322712',amberText:'#ffd78f'}
    :{bg:'#ffffff',bg2:'#f8fafc',bg3:'#eef3f9',text:'#142033',text2:'#5f6b7d',border:'rgba(15,23,42,0.12)',today:'#ef5b67',todayBg:'rgba(239,91,103,0.10)',weekend:'#f7f9fc',blue:'#4f8cff',blueBg:'#e9f1ff',blueText:'#235fd2',green:'#43b36b',greenBg:'#eaf9ef',greenText:'#217543',gray:'#8a94a6',grayBg:'#eef1f6',grayText:'#5d6778',red:'#ef5b67',redBg:'#ffecee',redText:'#b82c3f',amber:'#f59e0b',amberBg:'#fff5df',amberText:'#9a6800'};
    const barC={prog:C.blue,done:C.green,pend:C.gray,bloc:C.red,late:C.amber};
    const badB={prog:C.blueBg,done:C.greenBg,pend:C.grayBg,bloc:C.redBg,late:C.amberBg};
    const badT={prog:C.blueText,done:C.greenText,pend:C.grayText,bloc:C.redText,late:C.amberText};
    const fr=(x,y,w,h,c)=>{if(w<=0||h<=0)return;ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    const ln=(x1,y1,x2,y2,c,lw=0.5)=>{ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
    const tx=(s,x,y,c,sz,wt,al)=>{ctx.fillStyle=c;ctx.font=`${wt||'normal'} ${sz||11}px -apple-system,sans-serif`;ctx.textAlign=al||'left';ctx.textBaseline='middle';ctx.fillText(String(s),x,y);};
    const rr=(x,y,w,h,r,c)=>{if(w<=0||h<=0)return;ctx.fillStyle=c;r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();ctx.fill();};
    const ox=PAD,oy=PAD;fr(0,0,TW,TH,C.bg);
    fr(ox,oy,TCW,H1,C.bg3);tx(T('pngTimeline'),ox+8,oy+H1/2,C.text2,9,'700');
    let mx=ox+TCW,mc=new Date(start);
    while(mc<=end){const mo=mc.getMonth(),yr=mc.getFullYear();let sp=0,pr=new Date(mc);while(pr<=end&&pr.getMonth()===mo&&pr.getFullYear()===yr){sp++;pr=addDays(pr,1);}const cw=sp*DW;fr(mx,oy,cw,H1,C.bg3);ln(mx,oy,mx,oy+H1,C.border);tx(`${MONTHS[mo]} ${yr}`,mx+cw/2,oy+H1/2,C.text2,9,'700','center');mx+=cw;mc=pr;}
    ln(ox,oy+H1,ox+TW-PAD*2,oy+H1,C.border);
    const dy2=oy+H1;fr(ox,dy2,TCW,H2,C.bg2);tx(T('pngTaskCol'),ox+8,dy2+H2/2,C.text2,10,'700');
    // ── Badge % completado ──
    const donePct=list.length?Math.round((list.filter(t=>getDisplayStatus(t)==='done').length/list.length)*100):0;
    const pctLabel=`${donePct}% ${currentLang==='en'?'completed':'completado'}`;
    ctx.font='800 11px -apple-system,sans-serif';
    const pctW=ctx.measureText(pctLabel).width+20,pctH=20,pctX=ox+TCW-pctW-8,pctY=dy2+(H2-pctH)/2;
    // Pill con gradiente verde→azul
    const pctGrad=ctx.createLinearGradient(pctX,0,pctX+pctW,0);
    pctGrad.addColorStop(0,C.green);pctGrad.addColorStop(1,C.blue);
    const pctR=pctH/2;ctx.fillStyle=pctGrad;
    ctx.beginPath();ctx.moveTo(pctX+pctR,pctY);ctx.lineTo(pctX+pctW-pctR,pctY);ctx.arcTo(pctX+pctW,pctY,pctX+pctW,pctY+pctR,pctR);ctx.lineTo(pctX+pctW,pctY+pctH-pctR);ctx.arcTo(pctX+pctW,pctY+pctH,pctX+pctW-pctR,pctY+pctH,pctR);ctx.lineTo(pctX+pctR,pctY+pctH);ctx.arcTo(pctX,pctY+pctH,pctX,pctY+pctH-pctR,pctR);ctx.lineTo(pctX,pctY+pctR);ctx.arcTo(pctX,pctY,pctX+pctR,pctY,pctR);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffffff';ctx.font='800 11px -apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pctLabel,pctX+pctW/2,pctY+pctH/2);
    for(let i=0;i<totalDays;i++){const d=addDays(start,i),isT=dayDiff(today,d)===0,dx=ox+TCW+i*DW;fr(dx,dy2,DW,H2,isT?C.todayBg:(isWeekend(d)?C.weekend:C.bg2));if(isT)fr(dx,oy,2,H1+H2,C.today);ln(dx,dy2,dx,dy2+H2,C.border);tx(WDAYS[d.getDay()],dx+DW/2,dy2+9,isT?C.today:C.text2,8,'700','center');tx(d.getDate(),dx+DW/2,dy2+21,isT?C.today:C.text2,9,'normal','center');}
    ln(ox,dy2+H2,ox+TW-PAD*2,dy2+H2,C.border);ln(ox+TCW,dy2,ox+TCW,dy2+H2,C.border);
    list.forEach((t,idx)=>{
      const depth=getDepth(t);
      const indent=depth*14;
      const hasKids=getChildren(t.id).length>0;
      const effDates=getEffectiveDates(t);
      const effStatus=getDisplayStatus(t);
      const opac=Math.max(0.45,1-depth*0.18);
      const ry=oy+H1+H2+idx*ROW_H;
      // Fondo de fila: más oscuro para subtareas
      const rowBg=depth>0?(isDark?C.bg2:C.bg2):idx%2===0?C.bg:C.bg2;
      fr(ox,ry,TW-PAD*2,ROW_H,rowBg);
      // Línea de indentación lateral
      if(depth>0){
        const depthColors=[C.blue,C.green,'#8b5cf6','#f59e0b'];
        fr(ox,ry,3,ROW_H,depthColors[Math.min(depth-1,3)]);
      }
      for(let i=0;i<totalDays;i++){const d=addDays(start,i),dx=ox+TCW+i*DW;if(isWeekend(d))fr(dx,ry,DW,ROW_H,C.weekend);if(dayDiff(today,d)===0){fr(dx,ry,DW,ROW_H,C.todayBg);fr(dx,ry,2,ROW_H,C.today);}}
      ln(ox,ry+ROW_H,ox+TW-PAD*2,ry+ROW_H,C.border);
      // Nombre con indentación y prefijo ↳
      const nameX=ox+8+indent;
      const prefix=depth>0?'↳ ':'';
      // Reservar espacio para ícono 💬 si hay comentario
      const commentIconW=t.comment?18:0;
      const nameClipW=TCW-130-indent-commentIconW;
      ctx.save();ctx.beginPath();ctx.rect(nameX,ry,nameClipW,ROW_H);ctx.clip();
      tx(prefix+t.name,nameX,ry+ROW_H/2-5,C.text,12,'700');ctx.restore();
      // Ícono 💬 si tiene comentario (justo después del área del nombre)
      if(t.comment){tx('💬',nameX+nameClipW,ry+ROW_H/2-5,C.text2,11,'normal');}
      // Fechas efectivas
      tx(`${fmtDate(effDates.start)} → ${fmtDate(effDates.end)} · ${dayDiff(effDates.start,effDates.end)+1}d`,nameX,ry+ROW_H/2+8,C.text2,9,'normal');
      // Badge de estado calculado
      const chipText=isOverdue(t)?T('statusOver'):getStatusLabel()[effStatus];ctx.font='700 9px -apple-system,sans-serif';
      const bw=ctx.measureText(chipText).width+14,bh=16,bx=ox+TCW-bw-6,by=ry+(ROW_H-bh)/2;
      rr(bx,by,bw,bh,8,isOverdue(t)?C.amberBg:badB[effStatus]);tx(chipText,bx+bw/2,by+bh/2,isOverdue(t)?C.amberText:badT[effStatus],9,'700','center');
      ln(ox+TCW,ry,ox+TCW,ry+ROW_H,C.border);
      // Barra con fechas efectivas y opacidad por nivel
      for(let i=0;i<totalDays;i++){const d=addDays(start,i),dx=ox+TCW+i*DW;ln(dx,ry,dx,ry+ROW_H,C.border,0.5);if(d>=effDates.start&&d<=effDates.end&&dayDiff(effDates.start,d)===0){const sp=dayDiff(effDates.start,effDates.end)+1;ctx.globalAlpha=opac;rr(dx+2,ry+(ROW_H-20)/2,Math.max(sp*DW-4,4),20,6,barC[effStatus]);ctx.globalAlpha=1;}}
    });
    ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.strokeRect(ox,oy,TW-PAD*2,TH-PAD*2);
    cv.toBlob(blob=>{if(!blob){showToast(T('toastImgError'));return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gantt_${fmtDate(today)}.png`;document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},300);showToast(T('toastPngOk'));},'image/png');
  }catch(err){console.error('[exportPNG]',err);showToast(T('toastShareError')+err.message);}
}
```


**Every output failure/message path:** missing share key → toastShareMissing (L1770–L1772); upload → toastUploading for6000ms (L1774); HTTP errors use server message or status/statusText, POST missing ID has literal bilingual message, generic share catch prefixes toastShareError plus error message or bilingual connection fallback (L1780–L1794). Clipboard uses toastCopied/toastCopyError, with temporary hidden textarea fallback (L1796–L1814). Read-only cloud load → toastShareLoad and demo fallback (L1409–L1412). Excel success → toastExcelOk, only ZIP patch failures console-warn (L2017–L2021); no load/build failure translation path. PNG missing context → toastCanvasError; null blob → toastImgError; success → toastPngOk; synchronous catch console.error then toastShareError+err.message (L2034,L2102–L2103). ES and EN dictionary values are complete in §8; all literal concatenations are above. No retry/backoff/progress percentage/cancellation logic exists in these export functions (L1768–L2104).

## 8. i18n (verbatim)

**Complete exact dictionary object, including both language containers, comments, nested objects and arrow-function templates:** ES L462–L629; EN L630–L780; object wrapper L461–L781. No values are translated or normalized below. T fallback and language-sensitive month/day arrays are in §2A/§1. Counts:143 direct keys per language (286 total); pieDesc has5 child keys and themeNotify3, so149 leaf entries per language (298 total). Containers+children give151 named property entries per language (302 total), excluding top-level es/en. (L461–L781.)

**Source: L461–L781.**

```javascript
const I18N={
  es:{
    // App
    appKicker:'R&D Process Engineering',
    appTitle:'Gantt Tracker',
    appSubtitle:'Seguimiento de actividades — R&D / Process Engineering',
    todayPrefix:'Hoy',
    lockPrompt:'Ingresa la contraseña para comenzar a usar esta app.',
    lockPlaceholder:'Contraseña de acceso',
    lockButton:'Entrar',
    lockHint:'Tu acceso protege esta vista antes de empezar.',
    lockError:'Contraseña incorrecta. Intenta nuevamente.',
    lockSuccess:'Gracias por usar la app.',
    // Menú
    menuExportExcel:'⬇ Exportar a Excel',
    menuExportPNG:'🖼 Crear PNG del Gantt',
    menuShare:'🔗 Compartir Gantt',
    menuThemeLabel:'🌓 Tema',
    menuThemeDark:'Oscuro',
    menuThemeSystem:'Sistema',
    menuThemeLight:'Claro',
    menuReset:'↺ Restaurar demo',
    menuLangLabel:'🌐 Idioma',
    menuLangEs:'Español',
    menuLangEn:'English',
    // Overview
    overviewTitle:'Overview rápido',
    overviewSubtitle:'Resumen ejecutivo del plan',
    // Form
    formTitle:'Nueva tarea',
    formSubtitle:'Agrega tareas rápidas con fechas y estado',
    formViewDay:'Días',
    formViewWeek:'Semanas',
    formPlaceholderName:'Nueva tarea...',
    formPlaceholderComment:'Nota opcional...',
    formParentNone:'Sin padre',
    formBtnAdd:'+ Agregar',
    formTip:'Tip: Enter para agregar rápido · Ctrl+K para buscar · Guardado automático',
    // Filtros
    filterTitle:'Vista general',
    filterSubtitle:'Busca, filtra y ordena',
    filterPlaceholder:'Buscar tarea...',
    filterAll:'Todos los estados',
    filterProg:'En progreso',
    filterDone:'Completado',
    filterPend:'Pendiente',
    filterBloc:'Bloqueado',
    filterLate:'Tarde',
    filterOver:'Vencidas',
    sortStartAsc:'Inicio más próximo',
    sortStartDesc:'Inicio más lejano',
    sortEndAsc:'Fin más próximo',
    sortEndDesc:'Fin más lejano',
    sortStatus:'Por estado',
    sortName:'Nombre A-Z',
    btnClear:'Limpiar',
    // Gantt tabla
    ganttTimeline:'TIMELINE',
    ganttTaskCol:'Tarea / Estado',
    ganttEmpty:'No hay tareas.',
    ganttRange:'Rango',
    // Leyenda
    legendProg:'En progreso',
    legendDone:'Completado',
    legendPend:'Pendiente',
    legendBloc:'Bloqueado',
    legendLate:'Tarde',
    legendOver:'Vencida',
    legendToday:'Hoy',
    // Health snapshot
    healthTitle:'Health snapshot',
    healthSubtitle:'Distribución por estado — clic en segmento para detalle',
    // Estados
    statusProg:'En progreso',
    statusDone:'Completado',
    statusPend:'Pendiente',
    statusBloc:'Bloqueado',
    statusLate:'Tarde',
    statusOver:'Vencida',
    // Stats
    statOverview:'Overview',
    statDoing:'Doing',
    statDone:'Done',
    statFocus:'Focus',
    statRisk:'Risk',
    statLate:'Tarde',
    statProgLabel:'En progreso',
    statDoneLabel:'Completadas',
    statPendLabel:'Pendientes',
    statBlocLabel:'Bloqueadas',
    statLateLabel:'Tarde',
    progressTitle:'Progreso real del plan',
    progressCopy:(d,p,o)=>`${d} completadas · ${p} activas · ${o} vencidas`,
    pulseToday:(n)=>`📍 ${n} tocando hoy`,
    pulseNext:(n)=>`🗓 ${n} próximas`,
    pulseDays:(n)=>`⏱ ${n} días planificados`,
    pctBadge:(n)=>`${n}% completado`,
    resultInfo:(vis,tot,ov,tod)=>`Mostrando ${vis} de ${tot} tareas · ${ov} vencidas · ${tod} tocando hoy`,
    taskCount:(n)=>`${n} tarea${n!==1?'s':''}`,
    // Pie
    pieCompleted:'completado',
    pieSelected:'Estado seleccionado',
    pieDesc:{
      done:'Tareas finalizadas. Mide el avance real del plan.',
      prog:'Tareas en ejecución actualmente.',
      pend:'Registradas pero aún sin arrancar.',
      late:'Arrancaron tarde o ya deberían estar en marcha.',
      bloc:'Detenidas por riesgo o dependencia externa.'
    },
    pieTasks:(n)=>`${n} tarea${n!==1?'s':''}`,
    pieOfTotal:(n)=>`${n}% del total`,
    pieOverdue:(n)=>`${n} vencida${n!==1?'s':''}`,
    pieActive:(n)=>`🎯 ${n} activa${n!==1?'s':''}`,
    pieOverdueTotal:(n)=>`⚠ ${n} vencida${n!==1?'s':''}`,
    pieToday:(n)=>`📍 ${n} hoy`,
    // Modal compartir
    shareTitle:'🔗 Link para compartir',
    shareDesc:'Cualquier persona con este link puede visualizar tu Gantt en modo solo lectura.',
    shareCopy:'Copiar link',
    shareClose:'Cerrar',
    // Toasts / confirmaciones
    toastAdded:'Tarea agregada ✓',
    toastSaved:'Cambios guardados ✓',
    toastDeleted:'Tarea eliminada.',
    toastDuplicated:'Tarea duplicada ✓',
    duplicateSuffix:' (copia)',
    toastExcelOk:'Excel descargado ✓',
    toastPngOk:'PNG descargado ✓',
    toastShared:'¡Gantt publicado! ✓',
    toastCopied:'Link copiado ✓',
    toastDemoReset:'Demo restaurada.',
    toastUploading:'Subiendo Gantt a la nube…',
    toastShareError:'Error: ',
    toastCopyError:'No se pudo copiar.',
    toastCanvasError:'Error: canvas no disponible.',
    toastImgError:'Error al generar imagen.',
    toastShareMissing:'Primero configura APP_CONFIG.jsonbinKey para compartir en la nube.',
    toastShareReadonly:'Modo lectura: falta configurar JSONBin para cargar desde la nube.',
    toastShareLoad:'No se pudo cargar el Gantt compartido.',
    confirmDelete:'¿Eliminar tarea y sus subtareas?',
    confirmReset:'¿Restaurar demo?',
    // Errores form
    errName:'Escribe un nombre.',
    errDates:'Completa las fechas.',
    errInvalidDates:'Fechas inválidas.',
    errDateOrder:'La fecha de fin no puede ser anterior al inicio.',
    errParentDesc:'Una tarea no puede convertirse en hija de una de sus subtareas.',
    errParentMissing:'La tarea padre seleccionada ya no existe.',
    // Edit row
    editStart:'Inicio',
    editEnd:'Fin',
    editParent:'Padre',
    editSave:'Guardar',
    editCancel:'Cancelar',
    editCommentPlaceholder:'Comentario (opcional)',
    // Banner / misc
    readonlyBanner:'👁 Modo visualización — solo lectura',
    shareHintMissing:'La vista compartida requiere configurar una Master Key de JSONBin en APP_CONFIG o en localStorage con la llave ganttJsonbinKey.',
    shareHintDisabled:'Configura APP_CONFIG.jsonbinKey para habilitar compartir',
    themeNotify:{system:'Sistema',light:'Claro',dark:'Oscuro'},
    // Excel / PNG
    excelTitle:'GANTT TRACKER — R&D Process Engineering',
    excelColTask:'Tarea',
    excelColStatus:'Estado',
    excelColComment:'Comentario',
    pngTimeline:'TIMELINE',
    pngTaskCol:'Tarea / Estado',
    footer:'Gantt Tracker R&D · Desarrollado por CJLB · Process & Tooling Engineering',
  },
  en:{
    appKicker:'R&D Process Engineering',
    appTitle:'Gantt Tracker',
    appSubtitle:'Activity tracking — R&D / Process Engineering',
    todayPrefix:'Today',
    lockPrompt:'Enter the password to start using this app.',
    lockPlaceholder:'Access password',
    lockButton:'Enter',
    lockHint:'This access gate protects the view before you begin.',
    lockError:'Incorrect password. Please try again.',
    lockSuccess:'Thank you for using the app.',
    menuExportExcel:'⬇ Export to Excel',
    menuExportPNG:'🖼 Create Gantt PNG',
    menuShare:'🔗 Share Gantt',
    menuThemeLabel:'🌓 Theme',
    menuThemeDark:'Dark',
    menuThemeSystem:'System',
    menuThemeLight:'Light',
    menuReset:'↺ Restore demo',
    menuLangLabel:'🌐 Language',
    menuLangEs:'Español',
    menuLangEn:'English',
    overviewTitle:'Quick overview',
    overviewSubtitle:'Executive plan summary',
    formTitle:'New task',
    formSubtitle:'Add tasks quickly with dates and status',
    formViewDay:'Days',
    formViewWeek:'Weeks',
    formPlaceholderName:'New task...',
    formPlaceholderComment:'Optional note...',
    formParentNone:'No parent',
    formBtnAdd:'+ Add',
    formTip:'Tip: Enter to add quickly · Ctrl+K to search · Auto-saved',
    filterTitle:'Overview',
    filterSubtitle:'Search, filter and sort',
    filterPlaceholder:'Search task...',
    filterAll:'All statuses',
    filterProg:'In progress',
    filterDone:'Completed',
    filterPend:'Pending',
    filterBloc:'Blocked',
    filterLate:'Late',
    filterOver:'Overdue',
    sortStartAsc:'Earliest start',
    sortStartDesc:'Latest start',
    sortEndAsc:'Earliest end',
    sortEndDesc:'Latest end',
    sortStatus:'By status',
    sortName:'Name A-Z',
    btnClear:'Clear',
    ganttTimeline:'TIMELINE',
    ganttTaskCol:'Task / Status',
    ganttEmpty:'No tasks.',
    ganttRange:'Range',
    legendProg:'In progress',
    legendDone:'Completed',
    legendPend:'Pending',
    legendBloc:'Blocked',
    legendLate:'Late',
    legendOver:'Overdue',
    legendToday:'Today',
    healthTitle:'Health snapshot',
    healthSubtitle:'Status distribution — click segment for detail',
    statusProg:'In progress',
    statusDone:'Completed',
    statusPend:'Pending',
    statusBloc:'Blocked',
    statusLate:'Late',
    statusOver:'Overdue',
    statOverview:'Overview',
    statDoing:'Doing',
    statDone:'Done',
    statFocus:'Focus',
    statRisk:'Risk',
    statLate:'Late',
    statProgLabel:'In progress',
    statDoneLabel:'Completed',
    statPendLabel:'Pending',
    statBlocLabel:'Blocked',
    statLateLabel:'Late',
    progressTitle:'Actual plan progress',
    progressCopy:(d,p,o)=>`${d} completed · ${p} active · ${o} overdue`,
    pulseToday:(n)=>`📍 ${n} active today`,
    pulseNext:(n)=>`🗓 ${n} upcoming`,
    pulseDays:(n)=>`⏱ ${n} planned days`,
    pctBadge:(n)=>`${n}% completed`,
    resultInfo:(vis,tot,ov,tod)=>`Showing ${vis} of ${tot} tasks · ${ov} overdue · ${tod} active today`,
    taskCount:(n)=>`${n} task${n!==1?'s':''}`,
    pieCompleted:'completed',
    pieSelected:'Selected status',
    pieDesc:{
      done:'Finished tasks. Measures real plan progress.',
      prog:'Tasks currently in execution.',
      pend:'Registered but not yet started.',
      late:'Started late or should already be in motion.',
      bloc:'Stopped due to risk or external dependency.'
    },
    pieTasks:(n)=>`${n} task${n!==1?'s':''}`,
    pieOfTotal:(n)=>`${n}% of total`,
    pieOverdue:(n)=>`${n} overdue`,
    pieActive:(n)=>`🎯 ${n} active`,
    pieOverdueTotal:(n)=>`⚠ ${n} overdue`,
    pieToday:(n)=>`📍 ${n} today`,
    shareTitle:'🔗 Shareable link',
    shareDesc:'Anyone with this link can view your Gantt in read-only mode.',
    shareCopy:'Copy link',
    shareClose:'Close',
    toastAdded:'Task added ✓',
    toastSaved:'Changes saved ✓',
    toastDeleted:'Task deleted.',
    toastDuplicated:'Task duplicated ✓',
    duplicateSuffix:' (copy)',
    toastExcelOk:'Excel downloaded ✓',
    toastPngOk:'PNG downloaded ✓',
    toastShared:'Gantt published! ✓',
    toastCopied:'Link copied ✓',
    toastDemoReset:'Demo restored.',
    toastUploading:'Uploading Gantt to cloud…',
    toastShareError:'Error: ',
    toastCopyError:'Could not copy.',
    toastCanvasError:'Error: canvas not available.',
    toastImgError:'Error generating image.',
    toastShareMissing:'First configure APP_CONFIG.jsonbinKey to enable cloud sharing.',
    toastShareReadonly:'Read-only mode: JSONBin not configured to load from cloud.',
    toastShareLoad:'Could not load shared Gantt.',
    confirmDelete:'Delete task and its subtasks?',
    confirmReset:'Restore demo?',
    errName:'Enter a name.',
    errDates:'Fill in both dates.',
    errInvalidDates:'Invalid dates.',
    errDateOrder:'End date cannot be before start date.',
    errParentDesc:'A task cannot become a child of one of its own subtasks.',
    errParentMissing:'The selected parent task no longer exists.',
    editStart:'Start',
    editEnd:'End',
    editParent:'Parent',
    editSave:'Save',
    editCancel:'Cancel',
    editCommentPlaceholder:'Comment (optional)',
    readonlyBanner:'👁 View mode — read only',
    shareHintMissing:'Shared view requires configuring a JSONBin Master Key in APP_CONFIG or in localStorage under ganttJsonbinKey.',
    shareHintDisabled:'Configure APP_CONFIG.jsonbinKey to enable sharing',
    themeNotify:{system:'System',light:'Light',dark:'Dark'},
    excelTitle:'GANTT TRACKER — R&D Process Engineering',
    excelColTask:'Task',
    excelColStatus:'Status',
    excelColComment:'Comment',
    pngTimeline:'TIMELINE',
    pngTaskCol:'Task / Status',
    footer:'Gantt Tracker R&D · Developed by CJLB · Process & Tooling Engineering',
  }
};
```


**Per-entry line index:** each key listed here points into the verbatim dictionary above; the literal is authoritative for trailing spaces, plural rules and interpolation. (L461–L781.)

| language | key | line |

| --- | --- | --- |

| es | appKicker | L464 |

| es | appTitle | L465 |

| es | appSubtitle | L466 |

| es | todayPrefix | L467 |

| es | lockPrompt | L468 |

| es | lockPlaceholder | L469 |

| es | lockButton | L470 |

| es | lockHint | L471 |

| es | lockError | L472 |

| es | lockSuccess | L473 |

| es | menuExportExcel | L475 |

| es | menuExportPNG | L476 |

| es | menuShare | L477 |

| es | menuThemeLabel | L478 |

| es | menuThemeDark | L479 |

| es | menuThemeSystem | L480 |

| es | menuThemeLight | L481 |

| es | menuReset | L482 |

| es | menuLangLabel | L483 |

| es | menuLangEs | L484 |

| es | menuLangEn | L485 |

| es | overviewTitle | L487 |

| es | overviewSubtitle | L488 |

| es | formTitle | L490 |

| es | formSubtitle | L491 |

| es | formViewDay | L492 |

| es | formViewWeek | L493 |

| es | formPlaceholderName | L494 |

| es | formPlaceholderComment | L495 |

| es | formParentNone | L496 |

| es | formBtnAdd | L497 |

| es | formTip | L498 |

| es | filterTitle | L500 |

| es | filterSubtitle | L501 |

| es | filterPlaceholder | L502 |

| es | filterAll | L503 |

| es | filterProg | L504 |

| es | filterDone | L505 |

| es | filterPend | L506 |

| es | filterBloc | L507 |

| es | filterLate | L508 |

| es | filterOver | L509 |

| es | sortStartAsc | L510 |

| es | sortStartDesc | L511 |

| es | sortEndAsc | L512 |

| es | sortEndDesc | L513 |

| es | sortStatus | L514 |

| es | sortName | L515 |

| es | btnClear | L516 |

| es | ganttTimeline | L518 |

| es | ganttTaskCol | L519 |

| es | ganttEmpty | L520 |

| es | ganttRange | L521 |

| es | legendProg | L523 |

| es | legendDone | L524 |

| es | legendPend | L525 |

| es | legendBloc | L526 |

| es | legendLate | L527 |

| es | legendOver | L528 |

| es | legendToday | L529 |

| es | healthTitle | L531 |

| es | healthSubtitle | L532 |

| es | statusProg | L534 |

| es | statusDone | L535 |

| es | statusPend | L536 |

| es | statusBloc | L537 |

| es | statusLate | L538 |

| es | statusOver | L539 |

| es | statOverview | L541 |

| es | statDoing | L542 |

| es | statDone | L543 |

| es | statFocus | L544 |

| es | statRisk | L545 |

| es | statLate | L546 |

| es | statProgLabel | L547 |

| es | statDoneLabel | L548 |

| es | statPendLabel | L549 |

| es | statBlocLabel | L550 |

| es | statLateLabel | L551 |

| es | progressTitle | L552 |

| es | progressCopy | L553 |

| es | pulseToday | L554 |

| es | pulseNext | L555 |

| es | pulseDays | L556 |

| es | pctBadge | L557 |

| es | resultInfo | L558 |

| es | taskCount | L559 |

| es | pieCompleted | L561 |

| es | pieSelected | L562 |

| es | pieDesc | L563 |

| es | pieDesc.done | L564 |

| es | pieDesc.prog | L565 |

| es | pieDesc.pend | L566 |

| es | pieDesc.late | L567 |

| es | pieDesc.bloc | L568 |

| es | pieTasks | L570 |

| es | pieOfTotal | L571 |

| es | pieOverdue | L572 |

| es | pieActive | L573 |

| es | pieOverdueTotal | L574 |

| es | pieToday | L575 |

| es | shareTitle | L577 |

| es | shareDesc | L578 |

| es | shareCopy | L579 |

| es | shareClose | L580 |

| es | toastAdded | L582 |

| es | toastSaved | L583 |

| es | toastDeleted | L584 |

| es | toastDuplicated | L585 |

| es | duplicateSuffix | L586 |

| es | toastExcelOk | L587 |

| es | toastPngOk | L588 |

| es | toastShared | L589 |

| es | toastCopied | L590 |

| es | toastDemoReset | L591 |

| es | toastUploading | L592 |

| es | toastShareError | L593 |

| es | toastCopyError | L594 |

| es | toastCanvasError | L595 |

| es | toastImgError | L596 |

| es | toastShareMissing | L597 |

| es | toastShareReadonly | L598 |

| es | toastShareLoad | L599 |

| es | confirmDelete | L600 |

| es | confirmReset | L601 |

| es | errName | L603 |

| es | errDates | L604 |

| es | errInvalidDates | L605 |

| es | errDateOrder | L606 |

| es | errParentDesc | L607 |

| es | errParentMissing | L608 |

| es | editStart | L610 |

| es | editEnd | L611 |

| es | editParent | L612 |

| es | editSave | L613 |

| es | editCancel | L614 |

| es | editCommentPlaceholder | L615 |

| es | readonlyBanner | L617 |

| es | shareHintMissing | L618 |

| es | shareHintDisabled | L619 |

| es | themeNotify | L620 |

| es | excelTitle | L622 |

| es | excelColTask | L623 |

| es | excelColStatus | L624 |

| es | excelColComment | L625 |

| es | pngTimeline | L626 |

| es | pngTaskCol | L627 |

| es | footer | L628 |

| en | appKicker | L631 |

| en | appTitle | L632 |

| en | appSubtitle | L633 |

| en | todayPrefix | L634 |

| en | lockPrompt | L635 |

| en | lockPlaceholder | L636 |

| en | lockButton | L637 |

| en | lockHint | L638 |

| en | lockError | L639 |

| en | lockSuccess | L640 |

| en | menuExportExcel | L641 |

| en | menuExportPNG | L642 |

| en | menuShare | L643 |

| en | menuThemeLabel | L644 |

| en | menuThemeDark | L645 |

| en | menuThemeSystem | L646 |

| en | menuThemeLight | L647 |

| en | menuReset | L648 |

| en | menuLangLabel | L649 |

| en | menuLangEs | L650 |

| en | menuLangEn | L651 |

| en | overviewTitle | L652 |

| en | overviewSubtitle | L653 |

| en | formTitle | L654 |

| en | formSubtitle | L655 |

| en | formViewDay | L656 |

| en | formViewWeek | L657 |

| en | formPlaceholderName | L658 |

| en | formPlaceholderComment | L659 |

| en | formParentNone | L660 |

| en | formBtnAdd | L661 |

| en | formTip | L662 |

| en | filterTitle | L663 |

| en | filterSubtitle | L664 |

| en | filterPlaceholder | L665 |

| en | filterAll | L666 |

| en | filterProg | L667 |

| en | filterDone | L668 |

| en | filterPend | L669 |

| en | filterBloc | L670 |

| en | filterLate | L671 |

| en | filterOver | L672 |

| en | sortStartAsc | L673 |

| en | sortStartDesc | L674 |

| en | sortEndAsc | L675 |

| en | sortEndDesc | L676 |

| en | sortStatus | L677 |

| en | sortName | L678 |

| en | btnClear | L679 |

| en | ganttTimeline | L680 |

| en | ganttTaskCol | L681 |

| en | ganttEmpty | L682 |

| en | ganttRange | L683 |

| en | legendProg | L684 |

| en | legendDone | L685 |

| en | legendPend | L686 |

| en | legendBloc | L687 |

| en | legendLate | L688 |

| en | legendOver | L689 |

| en | legendToday | L690 |

| en | healthTitle | L691 |

| en | healthSubtitle | L692 |

| en | statusProg | L693 |

| en | statusDone | L694 |

| en | statusPend | L695 |

| en | statusBloc | L696 |

| en | statusLate | L697 |

| en | statusOver | L698 |

| en | statOverview | L699 |

| en | statDoing | L700 |

| en | statDone | L701 |

| en | statFocus | L702 |

| en | statRisk | L703 |

| en | statLate | L704 |

| en | statProgLabel | L705 |

| en | statDoneLabel | L706 |

| en | statPendLabel | L707 |

| en | statBlocLabel | L708 |

| en | statLateLabel | L709 |

| en | progressTitle | L710 |

| en | progressCopy | L711 |

| en | pulseToday | L712 |

| en | pulseNext | L713 |

| en | pulseDays | L714 |

| en | pctBadge | L715 |

| en | resultInfo | L716 |

| en | taskCount | L717 |

| en | pieCompleted | L718 |

| en | pieSelected | L719 |

| en | pieDesc | L720 |

| en | pieDesc.done | L721 |

| en | pieDesc.prog | L722 |

| en | pieDesc.pend | L723 |

| en | pieDesc.late | L724 |

| en | pieDesc.bloc | L725 |

| en | pieTasks | L727 |

| en | pieOfTotal | L728 |

| en | pieOverdue | L729 |

| en | pieActive | L730 |

| en | pieOverdueTotal | L731 |

| en | pieToday | L732 |

| en | shareTitle | L733 |

| en | shareDesc | L734 |

| en | shareCopy | L735 |

| en | shareClose | L736 |

| en | toastAdded | L737 |

| en | toastSaved | L738 |

| en | toastDeleted | L739 |

| en | toastDuplicated | L740 |

| en | duplicateSuffix | L741 |

| en | toastExcelOk | L742 |

| en | toastPngOk | L743 |

| en | toastShared | L744 |

| en | toastCopied | L745 |

| en | toastDemoReset | L746 |

| en | toastUploading | L747 |

| en | toastShareError | L748 |

| en | toastCopyError | L749 |

| en | toastCanvasError | L750 |

| en | toastImgError | L751 |

| en | toastShareMissing | L752 |

| en | toastShareReadonly | L753 |

| en | toastShareLoad | L754 |

| en | confirmDelete | L755 |

| en | confirmReset | L756 |

| en | errName | L757 |

| en | errDates | L758 |

| en | errInvalidDates | L759 |

| en | errDateOrder | L760 |

| en | errParentDesc | L761 |

| en | errParentMissing | L762 |

| en | editStart | L763 |

| en | editEnd | L764 |

| en | editParent | L765 |

| en | editSave | L766 |

| en | editCancel | L767 |

| en | editCommentPlaceholder | L768 |

| en | readonlyBanner | L769 |

| en | shareHintMissing | L770 |

| en | shareHintDisabled | L771 |

| en | themeNotify | L772 |

| en | excelTitle | L773 |

| en | excelColTask | L774 |

| en | excelColStatus | L775 |

| en | excelColComment | L776 |

| en | pngTimeline | L777 |

| en | pngTaskCol | L778 |

| en | footer | L779 |



**Outside-dictionary copy is also part of parity:** visible-count label L1547; drag day/days/no-change/duration/moved/undo strings L1142–L1165,L1214–L1244; reorder errors L1702,L1704,L1707; cloud missing-ID/connection fallback L1787,L1794; PNG completed label L2052; theme toast Theme/Tema prefix L940; comment aria-label hardcoded Comentario L1573; static HTML labels/ARIA and Add button L253–L448. All are reproduced in the literal regions above or §9. Dictionary entries such as formBtnAdd, ganttRange, toastShareReadonly and shareHintMissing do not establish that UI actually uses them; inspect binding code, not dictionary presence alone (L800–L880,L1382–L1439).

## 9. Theme / language / menu / login / storage

**Language:** initial localStorage language or navigator.language lowercased startsWith(en), else es. Setter rejects unknown I18N key, saves raw code, updates html.lang, switch data-active and active classes, translates/renders/closes menu. T uses nullish ES fallback and invokes function values; applyLangToDOM directly dereferences current language. MONTHS/WDAYS window getters track currentLang. Document.title/meta description are not translated. applyLangToDOM uses first nonblank text-node replacement to retain children, applies data-i18n/data-i18n-ph, option-index maps, lock and footer markup. Exact operations/text below. (L460,L782–L880,L894–L902.)

**Source: L782–L880.**

```javascript
function T(key,...args){
  const v=I18N[currentLang]?.[key]??I18N.es[key];
  return typeof v==='function'?v(...args):v??key;
}
function setLang(lang){
  if(!I18N[lang])return;
  currentLang=lang;
  localStorage.setItem(LANG_PREF_KEY,currentLang);
  document.documentElement.lang=currentLang;
  const sw=document.getElementById('langSwitch');
  if(sw)sw.dataset.active=lang;
  document.querySelectorAll('.lang-option').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
  const lbl=document.getElementById('langSwitchLabel');
  if(lbl)lbl.textContent=T('menuLangLabel');
  applyLangToDOM();
  render();
  toggleMenu(false);
}
function applyLangToDOM(){
  const L=I18N[currentLang];
  document.documentElement.lang=currentLang;
  // Helper: actualiza solo el textNode sin tocar hijos o atributos
  const setText=(el,txt)=>{if(!el)return;const nodes=[...el.childNodes];const tn=nodes.find(n=>n.nodeType===3&&n.textContent.trim());if(tn)tn.textContent=txt;else el.prepend(document.createTextNode(txt));};
  // App header
  document.querySelector('.kicker')&&(document.querySelector('.kicker').lastChild.textContent=' '+L.appKicker);
  document.querySelector('h1')&&(document.querySelector('h1').textContent=L.appTitle);
  document.querySelector('.subtitle')&&(document.querySelector('.subtitle').textContent=L.appSubtitle);
  // Menú — usar data-i18n para no pisar onclick
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.dataset.i18n;
    if(L[key]!==undefined)setText(el,L[key]);
  });
  // Theme options spans
  const to=document.querySelectorAll('#themeSwitch .theme-option span');
  if(to[0])to[0].textContent=L.menuThemeDark;
  if(to[1])to[1].textContent=L.menuThemeSystem;
  if(to[2])to[2].textContent=L.menuThemeLight;
  // Lang switch
  document.querySelectorAll('.lang-option span').forEach(s=>{
    const lang=s.parentElement?.dataset.lang;
    if(lang==='es')s.textContent=L.menuLangEs;
    if(lang==='en')s.textContent=L.menuLangEn;
  });
  document.querySelectorAll('.lang-option').forEach(b=>b.classList.toggle('active',b.dataset.lang===currentLang));
  // Placeholders con data-i18n-ph
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const key=el.dataset.i18nPh;
    if(L[key])el.placeholder=L[key];
  });
  // Form inputs
  document.getElementById('btnDay')&&(document.getElementById('btnDay').textContent=L.formViewDay);
  document.getElementById('btnWeek')&&(document.getElementById('btnWeek').textContent=L.formViewWeek);
  document.getElementById('newTask')&&(document.getElementById('newTask').placeholder=L.formPlaceholderName);
  document.getElementById('newComment')&&(document.getElementById('newComment').placeholder=L.formPlaceholderComment);
  document.querySelector('.helper')&&(document.querySelector('.helper').textContent=L.formTip);
  // Filterbar options
  const fs=document.getElementById('filterStatus');
  if(fs){const keys=['filterAll','filterProg','filterDone','filterPend','filterBloc','filterLate','filterOver'];[...fs.options].forEach((o,i)=>{if(L[keys[i]])o.text=L[keys[i]];});}
  const sb=document.getElementById('sortBy');
  if(sb){const keys=['sortStartAsc','sortStartDesc','sortEndAsc','sortEndDesc','sortStatus','sortName'];[...sb.options].forEach((o,i)=>{if(L[keys[i]])o.text=L[keys[i]];});}
  // Gantt leyenda — manejada por data-i18n arriba
  // Select de estado del form
  const ns=document.getElementById('newStatus');
  if(ns){
    const map={pend:L.statusPend,prog:L.statusProg,done:L.statusDone,bloc:L.statusBloc};
    [...ns.options].forEach(o=>{if(map[o.value])o.text=map[o.value];});
  }
  // Today label
  const tl=document.getElementById('todayLabel');
  if(tl)tl.textContent=`${L.todayPrefix} · ${formatHuman(today)}`;
  // Readonly banner
  document.getElementById('readonlyBanner')&&(document.getElementById('readonlyBanner').textContent=L.readonlyBanner);
  const shareDesc=document.querySelector('#linkModal p');
  if(shareDesc)shareDesc.textContent=L.shareDesc;
  const shareBtn=document.getElementById('shareBtn');
  if(shareBtn&&shareBtn.disabled)shareBtn.title=L.shareHintDisabled;
  // Parent selector placeholder
  const np=document.getElementById('newParent');
  if(np&&np.options[0])np.options[0].text=L.formParentNone;
  const lockDoc=document.getElementById('lockDocName');
  if(lockDoc)lockDoc.textContent=document.title;
  const lockCopy=document.getElementById('lockCopy');
  if(lockCopy)lockCopy.textContent=L.lockPrompt;
  const lockInput=document.getElementById('lockPassword');
  if(lockInput){
    lockInput.placeholder=L.lockPlaceholder;
    lockInput.setAttribute('aria-label',L.lockPlaceholder);
  }
  const lockSubmit=document.getElementById('lockSubmit');
  if(lockSubmit)lockSubmit.textContent=L.lockButton;
  const lockHint=document.getElementById('lockHint');
  if(lockHint)lockHint.textContent=L.lockHint;
  const lockFeedback=document.getElementById('lockFeedback');
  if(lockFeedback?.classList.contains('error'))lockFeedback.textContent=L.lockError;
  if(lockFeedback?.classList.contains('success'))lockFeedback.textContent=L.lockSuccess;
  // Footer
  const foot=document.querySelector('footer strong')?.parentElement;
  if(foot)foot.innerHTML=L.footer.replace('CJLB','<strong style="color:var(--text-2)">CJLB</strong>');
}
```


**Theme and lock:** stored theme preference defaults system, resolved using matchMedia; root data-theme, switch thumb/classes and both logos update; system changes rerender only when preference system. Theme setter accepts dark/system/light only and writes even in shared mode. Lock is client-only, no backend/login/session token. Password is hardcoded at APP_CONFIG.unlockPassword, **L456; value deliberately withheld**. Form compares exact input without trimming at L1010; empty configured password bypasses; success disables input/submit and dismisses after700ms; failure shakes/refocuses/selects; input clears feedback; initial focus80ms. Lock state is not persisted, rate-limited or remote authorization. Init loads tasks before installing lock and renders behind it. (L907–L1022,L1382–L1439.)

**Source: L910–L1022.**

```javascript
function getSystemTheme(){return mediaTheme.matches?'dark':'light';}
function getActiveTheme(){return themePreference==='system'?getSystemTheme():themePreference;}
function isDarkTheme(){return getActiveTheme()==='dark';}
function applyUnlockTheme(){
  const logo=document.getElementById('unlockLogo');
  if(!logo)return;
  const nextSrc=isDarkTheme()?APP_CONFIG.logoDark:APP_CONFIG.logoLight;
  if(nextSrc)logo.src=nextSrc;
}
function refreshThemeSwitch(){
  const wrap=document.getElementById('themeSwitch');
  if(!wrap)return;
  wrap.dataset.active=themePreference;
  wrap.querySelectorAll('.theme-option').forEach(btn=>btn.classList.toggle('active',btn.dataset.theme===themePreference));
}
function applyTheme(forceRender=false){
  document.documentElement.setAttribute('data-theme',getActiveTheme());
  refreshThemeSwitch();
  applyLogoTheme();
  applyUnlockTheme();
  if(forceRender&&typeof render==='function'&&document.getElementById('tbody'))render();
}
function setThemePreference(nextTheme,{renderNow=true,closeMenu=false,notify=false}={}){
  if(!['dark','system','light'].includes(nextTheme))return;
  themePreference=nextTheme;
  localStorage.setItem(THEME_PREF_KEY,themePreference);
  applyTheme(renderNow);
  if(closeMenu)toggleMenu(false);
  if(notify){
    const map=T('themeNotify');
    showToast(`${currentLang==='en'?'Theme':'Tema'}: ${map[themePreference]}`);
  }
}
function bindThemeSwitch(){
  document.querySelectorAll('#themeSwitch .theme-option').forEach(btn=>{
    btn.onclick=e=>{
      e.stopPropagation();
      setThemePreference(btn.dataset.theme,{renderNow:true,closeMenu:false,notify:true});
    };
  });
}
function clearLockFeedback(){
  const feedback=document.getElementById('lockFeedback');
  if(!feedback)return;
  feedback.textContent='';
  feedback.className='lock-feedback';
}
function unlockApp(){
  const lockScreen=document.getElementById('lockScreen');
  const submit=document.getElementById('lockSubmit');
  const input=document.getElementById('lockPassword');
  const feedback=document.getElementById('lockFeedback');
  if(!lockScreen)return;
  appUnlocked=true;
  if(submit)submit.disabled=true;
  if(input)input.disabled=true;
  if(feedback){
    feedback.textContent=T('lockSuccess');
    feedback.className='lock-feedback success';
  }
  setTimeout(()=>{
    lockScreen.classList.add('hidden');
    document.body.classList.remove('app-locked');
  },700);
}
function showLockError(){
  const card=document.getElementById('lockCard');
  const feedback=document.getElementById('lockFeedback');
  const input=document.getElementById('lockPassword');
  if(feedback){
    feedback.textContent=T('lockError');
    feedback.className='lock-feedback error';
  }
  if(card){
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }
  if(input){
    input.focus();
    input.select();
  }
}
function initLockScreen(){
  const lockScreen=document.getElementById('lockScreen');
  const form=document.getElementById('lockForm');
  const input=document.getElementById('lockPassword');
  if(!lockScreen||!form||!input)return;
  applyUnlockTheme();
  document.body.classList.add('app-locked');
  if(!APP_CONFIG.unlockPassword){
    lockScreen.classList.add('hidden');
    document.body.classList.remove('app-locked');
    appUnlocked=true;
    return;
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(appUnlocked)return;
    const entered=input.value;
    if(entered===APP_CONFIG.unlockPassword){
      unlockApp();
      return;
    }
    showLockError();
  });
  input.addEventListener('input',()=>{
    const card=document.getElementById('lockCard');
    if(card)card.classList.remove('shake');
    clearLockFeedback();
  });
  setTimeout(()=>input.focus(),80);
}
```


**Menu/toast/keyboard/logo:** toggleMenu sets block/none and aria-expanded; outside click/focus and Escape dismiss. Modal closes on backdrop or Escape. showToast uses textContent and2800ms default; bar undo deliberately uses innerHTML and5000ms in its own path. Ctrl or Meta+K focuses/selects search; Enter in newTask adds; search debounce120ms; filter/sort change immediately render. Theme logos set fallback class on error; no external image download/export of logos. No relock/logout UI exists. Storage keys/shapes and all read/write sites are enumerated in §6. (L1754–L1766,L1817,L2107–L2134.)

**Source: L1754–L1766.**

```javascript
function toggleMenu(force){
  const m=document.getElementById('dropMenu');
  const btn=document.getElementById('menuBtn');
  if(!m||!btn)return;
  const open=typeof force==='boolean'?force:m.style.display!=='block';
  m.style.display=open?'block':'none';
  btn.setAttribute('aria-expanded',open?'true':'false');
}
document.addEventListener('click',e=>{if(!e.target.closest('#menuBtn')&&!e.target.closest('#dropMenu'))toggleMenu(false);});
document.addEventListener('focusin',e=>{if(!e.target.closest('#menuBtn')&&!e.target.closest('#dropMenu'))toggleMenu(false);});

let toastTimer;
function showToast(msg,dur=2800){const t=document.getElementById('toast');clearTimeout(toastTimer);t.textContent=msg;t.classList.add('show');toastTimer=setTimeout(()=>t.classList.remove('show'),dur);}
```


**Source: L2107–L2134.**

```javascript
function applyLogoTheme(){
  const logo=document.getElementById('logoWm');
  const badge=document.getElementById('logoBadge');
  if(!logo||!badge)return;
  const isDark=isDarkTheme();
  const nextSrc=isDark?APP_CONFIG.logoDark:APP_CONFIG.logoLight;
  if(!nextSrc){badge.classList.add('fallback');return;}
  badge.classList.remove('fallback');
  logo.onerror=()=>{badge.classList.add('fallback');};
  logo.onload=()=>{badge.classList.remove('fallback');};
  // Solo reasignar si cambia para no disparar onerror innecesariamente
  if(logo.src!==nextSrc&&logo.getAttribute('src')!==nextSrc){
    logo.src=nextSrc;
  }
}
mediaTheme.addEventListener('change',()=>{if(themePreference==='system')applyTheme(true);});

let searchDebounce;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){toggleMenu(false);closeModal();if(editingId!==null){editingId=null;render();}}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('searchTask').focus();document.getElementById('searchTask').select();}
});
document.getElementById('newTask').addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
document.getElementById('searchTask').addEventListener('input',()=>{clearTimeout(searchDebounce);searchDebounce=setTimeout(render,120);});
document.getElementById('filterStatus').addEventListener('change',render);
document.getElementById('sortBy').addEventListener('change',render);

init();
```


## 10. Edge cases handled and observed bugs

**Handled edge cases — source-observed, not claims of runtime test coverage:**

- Missing/malformed/empty saved task array falls back to six demo records; missing/invalid preference JSON catches to empty object. (L1051–L1052.)

- Shared GET HTTP error, malformed JSON, missing/nonarray/empty remote tasks falls back to demo and notifies. (L1399–L1413.)

- Manual blank name, missing/invalid/reversed dates, missing/self/descendant parent rejected. (L1080–L1085,L1675.)

- Name/comment escaped in HTML; max lengths via form attributes; comments trimmed on write. (L1028,L341,L360,L1573–L1595,L1673–L1675.)

- Depth traversal seen-set avoids ancestor-loop hang in getDepth only; Monday maps Sunday to7; ISO week uses UTC arithmetic. (L1029–L1030,L1066.)

- Empty result table, empty donut, zero-denominator percentages, missing selected pie category and empty date range have explicit fallbacks. (L1467–L1472,L1504–L1517,L1544,L1659,L1666.)

- Date resize cannot cross start/end; in-progress bar drag cancels on Escape/blur/hidden; unchanged mouseup restores originals. (L1312–L1317,L1329–L1352,L1370–L1377.)

- Read-only rendering omits task actions/interactive bars, hides form/share, blocks normal task/prefs persistence. (L1053,L1395–L1398,L1442,L1586,L1610–L1612,L1668.)

- Deleting a subtree clears related collapse/editor state; duplication remaps descendant parent IDs and preserves collapse state. (L1677–L1678.)

- Reorder rejects roots, non-siblings and own-descendant targets; touchcancel/blur/hidden clean row drag. (L1697–L1739.)

- Restored finite width clamped80–520; theme setter rejects unknown themes; language setter rejects unknown dictionary codes. (L787,L933,L1061,L1388,L1744–L1749.)

- Clipboard API rejection/unavailability falls back to legacy copy; copy failure notified; logo load error falls back to CJLB. (L1796–L1814,L2107–L2120.)

- Excel private ZIP patch failure falls back to original buffer; PNG handles absent context/null blob and catches synchronous exceptions. (L1988–L2021,L2034,L2102–L2103.)

- Lock missing required DOM elements returns; empty configured password bypasses; repeated submit after unlock is ignored. (L993–L1008.)

**Observed bugs:** these are static-source findings with the triggering condition and causal lines. Browser/CDN/Excel interoperability was not executed; conditional export defects below explicitly say when their branch matters. No fix is applied or silently prescribed. The port parity decision belongs to the user.

1. **observed bug — Empty-project persistence restores demo.** Delete all tasks: persist saves [], but loadTasks treats a zero-length array as invalid and reloads the demo on refresh. (L1051,L1442,L1677.)

2. **observed bug — Visible sorting overrides the selected comparator.** filteredTasks honors sortBy, but buildTreeList re-sorts roots by effective start/ID and obtains children from tasks order. Thus name/status/end/descending sort choices do not control displayed/exported hierarchy order. (L1090–L1105,L1455–L1463,L1643–L1644,L1840,L2030.)

3. **observed bug — Local-date / UTC serialization mismatch.** Dates parse at local midnight while fmtDate uses UTC ISO slicing. In a positive UTC offset, local YYYY-MM-DD midnight serializes as the preceding date; repeated save/reload can shift calendar dates. This is conditional on timezone, not claimed for every locale. (L1024,L1049–L1050,L1675.)

4. **observed bug — Frozen today after midnight.** today is computed once at script load; no rollover timer recomputes it. Leaving the tab open across midnight leaves status/today lines/defaults/filenames anchored to the old date. (L893,L1073–L1074,L1426–L1428,L2023,L2102,L2122–L2134.)

5. **observed bug — Stored unknown language breaks direct dictionary access.** A nonempty unsupported ganttLangPrefV1 is accepted at startup. T can fall back, but applyLangToDOM uses I18N[currentLang] directly and dereferences L.appKicker etc., causing an exception. (L460,L783–L784,L801–L808,L1437.)

6. **observed bug — English Add button remains Spanish.** formBtnAdd exists in both dictionaries, but the actual + Agregar button has no data-i18n/id binding and applyLangToDOM never writes it. Switching to English does not change that button. (L362,L497,L800–L880.)

7. **observed bug — Initial language thumb remains on ES.** HTML langSwitch data-active=es is changed by setLang only. Startup applyLangToDOM updates active button classes but not data-active, so initial stored/browser EN can display the ES thumb position. (L308,L791–L793,L819–L825,L1437.)

8. **observed bug — Today/current-week stripe disappears inside an earlier-starting colspan.** today-col is attached only to the first day/week cell used for a joined bar. If a bar spans today but starts before today/current week, its colspan skips that day's separate cell, so the row has no correctly positioned today stripe. (L1604–L1623,L1633–L1635,L131.)

9. **observed bug — Read-only view hides day/week selector.** The day/week controls are inside formCard, and shared mode hides the whole card. Users of shared views cannot switch views through those controls, although a stored viewMode can still initialize the page. (L327–L334,L1387,L1395–L1398.)

10. **observed bug — Excel fallback conditional formatting disagrees with effective spans/statuses.** Static cell fills use effective parent dates, but original per-cell rules use t.start/t.end and omit late. If the optional private ZIP patch is unavailable/fails, changing a parent status in Excel does not recolor the full effective range or cover the late state consistently. (L1879–L1880,L1905–L1925,L1938–L1965,L1988–L2021.)

11. **observed bug — Client-side lock is not data protection.** The literal password and comparison are delivered to the client; tasks/cloud loading occurs before initLockScreen and render runs regardless of appUnlocked. The overlay is a presentation gate, not authorization, despite protection language in lockHint. (L456,L471,L1006–L1014,L1382–L1439.)

12. **observed bug — Excel load/build failure has no user-facing error path.** The lazy script has onload but no onerror, and exportExcel invokes async buildExcel without catch. A failed CDN load or rejected writeBuffer has no translated failure notification. (L1820–L1829,L1932,L2020–L2022.)

13. **observed bug — Valid JSON null preferences crash initialization.** loadPrefs accepts JSON.parse('null') without a shape check. init immediately reads prefs.viewMode; null therefore throws instead of falling back to defaults. (L1052,L1386–L1388.)

**Summary:** 122 named `function name(...)` declarations, including nested walk/pt/arc/toColLetter; plus3 named window function-expression APIs and10 named arrow helpers = **135 named application callable bindings**, excluding anonymous callbacks. The dictionaries add13 function-valued keys per language,26 total: **161 named/property-bound functions including i18n formatters**. This is not a count of every anonymous event/callback expression. I18N has **143 direct keys per language /286 total**, or **149 leaf entries per language /298 total** with the two nested containers expanded. **13 observed bugs** are listed above. Function locations: §2A/§2B; dictionary source: L461–L781; bug evidence: each item above. No port, bug fix, remote publication or demo deletion was performed.

## Key Learnings:

1. The visible hierarchy reorders roots independently of the selected filter comparator. (L1093–L1101,L1455–L1463.)
2. Excel and PNG exports rebuild daily timelines from the collapsed visible tree. (L1840–L1842,L2030–L2032.)
3. Local-midnight parsing and UTC ISO serialization can disagree on the calendar date. (L1024,L1049.)
