// @ts-nocheck
// Referencia legacy de Gantt: copia literal de las funciones del original (gantt/index.html) dentro de
// una fábrica; los globales (tasks, today, currentLang, collapsedIds, inputs del DOM, render, toast,
// confirm) se sustituyen por variables de la fábrica. Origen:
//   T                         <- 782-785
//   MONTHS/WDAYS/statusRank   <- 894-899, 903-906 (sin los alias de window)
//   fmtDate..isActiveToday    <- 1024-1034
//   deserialize/serialize     <- 1049-1050
//   árbol, estado, padres     <- 1063-1088 (sin toggleCollapse)
//   buildTreeList             <- 1090-1106
//   filteredTasks..buildMonthCells <- 1444-1464, 1466-1479 (sin clearFilters)
//   normalizeTask, delTask, duplicateTask <- 1675, 1677, 1678
//   moveTask                  <- 1697-1724
//   legacyStats / legacyPie   <- expresiones de renderStats 1537-1567 y renderPie 1482-1532
//   resultInfo/rango          <- render 1643-1648
//   dayCols/weekCols (modelo) <- 1597-1636, devolviendo celdas en vez de HTML
import { GANTT_I18N } from '../../src/tools/gantt/i18n'

export interface LegacyInput {
  tasks: { id: number; name: string; start: string; end: string; status: string; comment?: string; parentId?: number | null }[]
  today: Date
  lang?: 'es' | 'en'
  collapsed?: number[]
  search?: string
  filter?: string
  sort?: string
}

export function createLegacy(input: LegacyInput) {
  const today = new Date(input.today); today.setHours(0,0,0,0);
  let currentLang = input.lang ?? 'es';
  const I18N = GANTT_I18N;
  const fields = { searchTask: { value: input.search ?? '' }, filterStatus: { value: input.filter ?? 'all' }, sortBy: { value: input.sort ?? 'startAsc' } };
  const document = { getElementById: (id) => fields[id] };
  let lastToast = null;
  const showToast = (m) => { lastToast = m; };
  const render = () => {};
  const confirm = () => true;
  let editingId = null;
function T(key,...args){
  const v=I18N[currentLang]?.[key]??I18N.es[key];
  return typeof v==='function'?v(...args):v??key;
}
const MONTHS_ES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_EN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WDAYS_ES=['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
const WDAYS_EN=['Su','Mo','Tu','We','Th','Fr','Sa'];
function getMonths(){return currentLang==='en'?MONTHS_EN:MONTHS_ES;}
function getWdays(){return currentLang==='en'?WDAYS_EN:WDAYS_ES;}
const MONTHS=getMonths(),WDAYS=getWdays();
function getStatusLabel(){return{prog:T('statusProg'),done:T('statusDone'),pend:T('statusPend'),bloc:T('statusBloc'),late:T('statusLate')};}
const statusClass={prog:'s-prog',done:'s-done',pend:'s-pend',bloc:'s-bloc',late:'s-late'};
const barClass={prog:'bar-prog',done:'bar-done',pend:'bar-pend',bloc:'bar-bloc',late:'bar-late'};
const statusRank={bloc:0,late:1,prog:2,pend:3,done:4};
function fmtDate(d){return d.toISOString().slice(0,10)}
function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r}
function dayDiff(a,b){return Math.round((b-a)/86400000)}
function formatHuman(d){return`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`}
function safeText(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function getWeekStart(d){const r=new Date(d);const wd=r.getDay()||7;r.setDate(r.getDate()-wd+1);r.setHours(0,0,0,0);return r}
function getWeekNum(d){const dt=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const dn=dt.getUTCDay()||7;dt.setUTCDate(dt.getUTCDate()+4-dn);const ys=new Date(Date.UTC(dt.getUTCFullYear(),0,1));return Math.ceil((((dt-ys)/86400000)+1)/7)}
function clampDateOrder(s,e){return e<s?{start:s,end:s}:{start:s,end:e}}
function isWeekend(d){return d.getDay()===0||d.getDay()===6}
function durationDays(t){return dayDiff(t.start,t.end)+1}
function isActiveToday(t){const {effectiveDates}=getTaskStateMeta(t);return effectiveDates.start<=today&&effectiveDates.end>=today}
function deserializeTask(t){return{id:t.id,name:t.name,start:new Date(t.start+'T00:00:00'),end:new Date(t.end+'T00:00:00'),status:t.status,comment:t.comment||'',parentId:t.parentId||null}}
function serializeTasks(){return tasks.map(t=>({id:t.id,name:t.name,start:fmtDate(t.start),end:fmtDate(t.end),status:t.status,comment:t.comment||'',parentId:t.parentId||null}))}
  let tasks=input.tasks.map(deserializeTask);
  let collapsedIds=new Set(input.collapsed??[]);
  let nextId=tasks.length?Math.max(...tasks.map(t=>t.id))+1:1;
// ── Árbol padre-hijo ──
function getChildren(id){return tasks.filter(t=>t.parentId===id);}
function getAllDescendants(id){const res=[];const q=[...getChildren(id)];while(q.length){const c=q.shift();res.push(c);q.push(...getChildren(c.id));}return res;}
function getDepth(t){let d=0,cur=t,seen=new Set();while(cur.parentId){if(seen.has(cur.id))break;seen.add(cur.id);cur=tasks.find(x=>x.id===cur.parentId)||{parentId:null};d++;}return d;}
function getEffectiveDates(t){const children=getAllDescendants(t.id);if(!children.length)return{start:t.start,end:t.end};const allStarts=[t.start,...children.map(c=>c.start)];const allEnds=[t.end,...children.map(c=>c.end)];return{start:new Date(Math.min(...allStarts)),end:new Date(Math.max(...allEnds))};}
function computeParentStatus(t){const children=getChildren(t.id);if(!children.length)return t.status;const statuses=children.map(c=>computeParentStatus(c));if(statuses.every(s=>s==='done'))return'done';if(statuses.some(s=>s==='bloc'))return'bloc';if(statuses.some(s=>s==='prog'))return'prog';return'pend';}
function getBaseStatus(t){return getChildren(t.id).length?computeParentStatus(t):t.status;}
function getTaskStateMeta(t){
  const effectiveDates=getEffectiveDates(t);
  const baseStatus=getBaseStatus(t);
  const overdue=baseStatus!=='done'&&effectiveDates.end<today;
  const late=!overdue&&baseStatus!=='done'&&baseStatus!=='prog'&&baseStatus!=='bloc'&&effectiveDates.start<=today;
  return{baseStatus,effectiveDates,overdue,displayStatus:late?'late':baseStatus};
}
function isOverdue(t){return getTaskStateMeta(t).overdue}
function getDisplayStatus(t){return getTaskStateMeta(t).displayStatus}
function isDescendantTask(taskId,maybeDescendantId){if(taskId==null||maybeDescendantId==null)return false;return getAllDescendants(taskId).some(t=>t.id===maybeDescendantId);}
function validateParentAssignment(taskId,parentId){
  if(parentId==null)return;
  if(!tasks.some(t=>t.id===parentId))throw new Error(T('errParentMissing'));
  if(taskId!=null&&parentId===taskId)throw new Error(T('errParentDesc'));
  if(taskId!=null&&isDescendantTask(taskId,parentId))throw new Error(T('errParentDesc'));
}
function getParentOptions(excludeId=null,selectedParentId=null){
  return tasks.filter(t=>t.id!==excludeId&&!isDescendantTask(excludeId,t.id)).map(t=>`<option value="${t.id}"${selectedParentId===t.id?' selected':''}>${'·'.repeat(getDepth(t))} ${safeText(t.name)}</option>`).join('');
}
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

function getRange(list=tasks){
  if(!list.length)return{start:addDays(today,-7),end:addDays(today,14)};
  const mn=new Date(Math.min(...list.map(t=>getTaskStateMeta(t).effectiveDates.start.getTime())));
  const mx=new Date(Math.max(...list.map(t=>getTaskStateMeta(t).effectiveDates.end.getTime())));
  return{start:addDays(mn,-2),end:addDays(mx,3)};
}

function buildMonthCells(start,end,mode){
  const cells=[];
  if(mode==='day'){let c=new Date(start);while(c<=end){const mo=c.getMonth(),yr=c.getFullYear();let sp=0,p=new Date(c);while(p<=end&&p.getMonth()===mo&&p.getFullYear()===yr){sp++;p=addDays(p,1);}cells.push({label:`${MONTHS[mo]} ${yr}`,span:sp});c=p;}}
  else{const weeks=[];let c=getWeekStart(start);while(c<=end){weeks.push(new Date(c));c=addDays(c,7);}let i=0;while(i<weeks.length){const mo=weeks[i].getMonth(),yr=weeks[i].getFullYear();let sp=1;while(i+sp<weeks.length&&weeks[i+sp].getMonth()===mo&&weeks[i+sp].getFullYear()===yr)sp++;cells.push({label:`${MONTHS[mo]} ${yr}`,span:sp});i+=sp;}}
  return cells;
}
function normalizeTask(name,ss,es,status,id,comment='',parentId=null){const n=name.trim();if(!n)throw new Error(T('errName'));if(!ss||!es)throw new Error(T('errDates'));const rs=new Date(ss+'T00:00:00'),re=new Date(es+'T00:00:00');if(isNaN(rs)||isNaN(re))throw new Error(T('errInvalidDates'));if(re<rs)throw new Error(T('errDateOrder'));const normalizedParentId=parentId==null||parentId===''?null:parseInt(parentId,10);validateParentAssignment(id,normalizedParentId);return{id,name:n,start:rs,end:re,status,comment:comment.trim(),parentId:normalizedParentId};}
function delTask(id){if(confirm(T('confirmDelete'))){const root=tasks.find(t=>t.id===id);if(!root)return;const toDelete=new Set([id,...getAllDescendants(root.id).map(t=>t.id)]);tasks=tasks.filter(t=>!toDelete.has(t.id));collapsedIds=new Set([...collapsedIds].filter(taskId=>!toDelete.has(taskId)));if(toDelete.has(editingId))editingId=null;render();showToast(T('toastDeleted'));}}
function duplicateTask(id){const base=tasks.find(t=>t.id===id);if(!base)return;const descendants=getAllDescendants(id);const sourceIds=[id,...descendants.map(t=>t.id)];const idMap=new Map();sourceIds.forEach(sourceId=>idMap.set(sourceId,nextId++));const clones=sourceIds.map(sourceId=>{const source=tasks.find(t=>t.id===sourceId);const cloneId=idMap.get(sourceId);const cloneParent=source.parentId&&idMap.has(source.parentId)?idMap.get(source.parentId):source.parentId;return{id:cloneId,name:sourceId===id?source.name+T('duplicateSuffix'):source.name,start:new Date(source.start),end:new Date(source.end),status:source.status,comment:source.comment||'',parentId:cloneParent||null};});tasks.push(...clones);if(collapsedIds.has(id))collapsedIds.add(idMap.get(id));descendants.forEach(t=>{if(collapsedIds.has(t.id))collapsedIds.add(idMap.get(t.id));});render();showToast(T('toastDuplicated'));}
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
  function legacyStats(){
    const list=filteredTasks();
    const c={prog:0,done:0,pend:0,bloc:0,late:0,over:0};
    list.forEach(t=>{
      const ds=getDisplayStatus(t);
      c[ds]=(c[ds]||0)+1;
      if(isOverdue(t))c.over++;
    });
    const pct=list.length?Math.round((c.done/list.length)*100):0;
    return {visible:list.length,prog:c.prog||0,done:c.done||0,pend:c.pend||0,bloc:c.bloc||0,late:c.late,over:c.over,pct,
      pctBadge:T('pctBadge',pct),progressCopy:T('progressCopy',c.done,c.prog,c.over),
      pulseToday:T('pulseToday',list.filter(isActiveToday).length),pulseNext:T('pulseNext',list.filter(t=>t.start>today).length),
      pulseDays:T('pulseDays',list.reduce((acc,t)=>acc+durationDays(t),0))};
  }
  function legacyPie(pieSelection='done'){
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
    const order=['done','prog','late','pend','bloc'];
    if(!pieSelection||c[pieSelection]===0)pieSelection=order.find(k=>c[k]>0)||'done';
    const pct=total?Math.round((c.done/total)*100):0;
    const sel=pieSelection,selCount=c[sel]||0,selPct=total?Math.round((selCount/total)*100):0;
    const overdueInSel=list.filter(t=>getDisplayStatus(t)===sel&&isOverdue(t)).length;
    return {counts:c,total,pct,sel,selCount,selPct,overdueInSel,activeCount,overdueCount,todayCount,taskCount:T('taskCount',total)};
  }
  function legacyHeader(){
    const filtered=filteredTasks();
    const list=buildTreeList(filtered);
    const{start,end}=getRange(list.length?list:tasks);
    return {ids:list.map(t=>t.id),range:`${formatHuman(start)} — ${formatHuman(end)}`,start,end,
      resultInfo:T('resultInfo',filtered.length,tasks.length,filtered.filter(isOverdue).length,filtered.filter(isActiveToday).length),
      months:buildMonthCells(start,end,'day'),weekMonths:buildMonthCells(start,end,'week')};
  }
  /** dayCols/weekCols (1597-1636): misma iteración, celdas como objetos. */
  function legacyDayCells(t,start,total){
    const eff=getEffectiveDates(t);const out=[];let i=0;
    while(i<total){
      const d=addDays(start,i),isT=dayDiff(today,d)===0,inR=d>=eff.start&&d<=eff.end;
      if(inR&&dayDiff(eff.start,d)===0){const sp=dayDiff(eff.start,eff.end)+1;out.push({i,span:sp,bar:true,today:isT,weekend:isWeekend(d)});i+=sp;continue;}
      out.push({i,span:1,bar:false,today:isT,weekend:isWeekend(d)});i++;
    }
    return out;
  }
  function legacyWeekCells(t,weeks){
    const eff=getEffectiveDates(t);const out=[];let i=0;
    while(i<weeks.length){
      const w=weeks[i],we=addDays(w,6),isCur=today>=w&&today<=we,ov=eff.start<=we&&eff.end>=w;
      if(ov){let sp=1;while(i+sp<weeks.length){const nw=weeks[i+sp],nwe=addDays(nw,6);if(eff.start<=nwe&&eff.end>=nw)sp++;else break;}out.push({i,span:sp,bar:true,today:isCur});i+=sp;continue;}
      out.push({i,span:1,bar:false,today:isCur});i++;
    }
    return out;
  }
  return {
    get tasks(){return tasks}, get nextId(){return nextId}, get collapsedIds(){return collapsedIds}, get lastToast(){return lastToast},
    T, fmtDate, addDays, dayDiff, formatHuman, getWeekStart, getWeekNum, clampDateOrder, isWeekend, durationDays, isActiveToday,
    serializeTasks, getChildren, getAllDescendants, getDepth, getEffectiveDates, computeParentStatus, getBaseStatus,
    getTaskStateMeta, isOverdue, getDisplayStatus, isDescendantTask, validateParentAssignment, getParentOptions,
    buildTreeList, filteredTasks, getRange, buildMonthCells, normalizeTask, delTask, duplicateTask, moveTask,
    legacyStats, legacyPie, legacyHeader, legacyDayCells, legacyWeekCells,
  };
}
