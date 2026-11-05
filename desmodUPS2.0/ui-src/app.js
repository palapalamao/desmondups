import { Client } from 'haystack-nclient';
import { HDateTime } from 'haystack-core';
import { version as appVersion } from './package.json';
import { value,scalar,ref,dis,has,escapeHtml as esc,selectPoint,pointNumber,pointQuality,telemetryQuality,runtimeState,numberText,formatUnitValue,formatClock,formatTime,timestamp } from './point-schema.js';
import { readTheme,setTheme,applyTheme } from './theme.js';
import { parseHistory,historyStats,chartSegments,rangeBounds,historyExpression,customEpoch } from './history.js';
import { axonRef,gridRows,RequestGate,historyResults,orderRisks,recommendationsByRisk,sortAlarms,resolveTreeSelection,alarmAck } from './api.js';

const $=id=>document.getElementById(id);
const state={client:null,project:null,tz:'UTC',sites:[],floors:[],equips:[],equip:null,points:[],alarms:[],assessment:null,risks:[],recommendations:new Map(),selection:new RequestGate(),selectionVersion:0,historyGate:new RequestGate(),histories:new Map(),modes:new Map(),historyField:'capacity',historyRange:'24h',historyUnit:'%',historySelected:[],historyCustom:null,telemetryBusy:false};
const severityClass={info:'info',warning:'warn',critical:'crit',unknown:'unknown'};
const labels={online:'市电在线供电',battery:'电池供电',bypass:'旁路供电',off:'设备停机',fault:'设备故障',unknown:'状态未知',onlineDoubleConversion:'在线双变换',modularN1:'模块化 N+1',charging:'正常',running:'正常',good:'良好',utility:'就绪',ready:'就绪',normal:'正常',stopped:'已停止',unavailable:'不可用'};
function text(id,content){if($(id))$(id).textContent=content;}
function html(id,content){if($(id))$(id).innerHTML=content;}
function announce(message){text('live-status',message);}
function errorMessage(error){return error?.message??String(error);}
function showError(error){const message=errorMessage(error),banner=$('app-error');if(banner){banner.hidden=false;const target=banner.querySelector('span');if(target)target.textContent=message;}announce(message);}
function clearError(){if($('app-error'))$('app-error').hidden=true;}
async function evaluate(expression){return state.client.ext.eval(expression);}
function first(grid){return gridRows(grid)[0]??null;}
function point(field){return selectPoint(state.points,field).point;}
function n(field){return pointNumber(point(field));}
function status(field){const p=point(field),quality=pointQuality(p);return quality.state==='valid'?severityClass[scalar(p,'upsRiskLevel')]??(pointNumber(p)==null?'ok':''):quality.state==='invalid'?'crit':quality.state;}
function metric(field,digits=1,unit=true){const p=point(field);if(!p)return '未配置';const numeric=pointNumber(p),val=scalar(p,'curVal');const output=numeric==null?(typeof val==='boolean'?(val?'是':'否'):labels[val]??val??'—'):numberText(numeric,digits);return unit&&numeric!=null?formatUnitValue(output,scalar(p,'unit')):String(output);}
function stat(label,content,className='',note=''){return `<div class="stat"><div class="stat__label">${esc(label)}</div><div class="stat__value${className?' status-'+className:''}">${esc(content)}</div>${note?`<div class="stat__quality">${esc(note)}</div>`:''}</div>`;}
function fieldStat(field,label,digits=1,unit=true){const choice=selectPoint(state.points,field),q=pointQuality(choice.point);return stat(label,metric(field,digits,unit),status(field),choice.ambiguous?'存在多个匹配点位':q.state!=='valid'&&q.state!=='missing'?q.label:'');}
function path(equip=state.equip){const site=state.sites.find(s=>ref(s)===ref(equip,'siteRef')),floor=state.floors.find(f=>ref(f)===ref(equip,'floorRef'));return [site?dis(site):ref(equip,'siteRef'),floor?dis(floor):ref(equip,'floorRef')].filter(Boolean).join(' / ');}
function isDemo(equip=state.equip){return has(equip,'upsDemo')&&scalar(equip,'upsDataSource')==='simulated';}
function projectName(){try{const top=window.top,project=top?.finstack?.projectName??top?.fin5Top?.finstack?.projectName;if(project)return project;}catch{}return new URLSearchParams(location.search).get('project');}
function setTimezone(){const site=state.sites.find(s=>ref(s)===ref(state.equip,'siteRef'))??state.sites[0],zone=scalar(state.equip,'tz')??scalar(site,'tz');state.tz=zone?HDateTime.getIANATimeZone(zone)||'UTC':'UTC';}

function renderTabs(){html('fleet-tabs',state.equips.length?state.equips.map(equip=>{
  const id=ref(equip),active=id===ref(state.equip),mode=active?scalar(point('mode'),'curVal'):state.modes.get(id);
  const tone=mode==='bypass'?'bypass':mode==='battery'||mode==='fault'?'battery':mode==='online'?'online':'unknown';
  return `<button type="button" class="fleet-tab${active?' is-active':''}" data-equip-ref="${esc(id)}" aria-pressed="${active}"><span class="fleet-tab__dot status-dot-${tone}" aria-hidden="true"></span><span class="fleet-tab__text"><span class="fleet-tab__name">${esc(dis(equip))}</span><span class="fleet-tab__location">${esc(path(equip))}</span></span></button>`;
}).join(''):'<div class="empty-state">此项目尚未配置 UPS 设备</div>');}

function renderHero(){
  const equip=state.equip,mode=scalar(point('mode'),'curVal'),modeQuality=pointQuality(point('mode'));
  const modeClass=modeQuality.state!=='valid'?'unknown':['battery','bypass','online','fault'].includes(mode)?mode:'unknown';
  if($('hero'))$('hero').className=`hero status-${modeClass}`;
  text('hero-mode',modeQuality.state==='valid'?(labels[mode]??mode??'未配置运行模式'):modeQuality.label);
  text('equip-name',equip?dis(equip):'尚无 UPS 设备');text('equip-topology',labels[scalar(equip,'upsTopology')]??scalar(equip,'upsTopology')??'未配置拓扑');text('equip-location',equip?path():'请在当前项目配置 UPS 设备树');
  const observed=state.points.map(p=>timestamp(value(p,'upsObservedAt'))).filter(x=>x!=null),latest=observed.length?Math.max(...observed):null;
  const quality=telemetryQuality(state.points);
  text('observed-status',`${isDemo()?'模拟数据':'实时数据'} · ${latest==null?'未提供观测时间':formatTime(latest,state.tz,false)} · ${quality.label}`);
  text('last-refresh',latest==null?'未提供':formatTime(latest,state.tz));
  const runtime=runtimeState(point('runtime'),scalar(equip,'upsRequiredRuntime')),runtimeValue=$('runtime-value');
  text('runtime-value',runtime.value==null?'—':numberText(runtime.value,0));text('runtime-unit','min');text('runtime-label',runtime.quality.state==='valid'?'当前负载下预计续航':`预计续航 · ${runtime.quality.label}`);
  if(runtimeValue)runtimeValue.className=runtime.quality.state==='valid'?'':`status-${runtime.quality.state==='invalid'?'crit':'unknown'}`;
  text('runtime-flag',runtime.message);if($('runtime-flag'))$('runtime-flag').className=`hero__metric-flag flag-${runtime.tone}`;
  const score=scalar(state.assessment,'upsHealthScore'),validScore=typeof score==='number'&&Number.isFinite(score)&&score>=0&&score<=100;
  text('health-score',validScore?numberText(score,0):'—');text('health-label',validScore?(isDemo()?'模拟健康评分':'健康评分'):'尚无评分');
  const ring=$('health-progress');if(ring){ring.style.strokeDasharray='301.593';ring.style.strokeDashoffset=String(validScore?301.593*(1-score/100):301.593);}
  text('project-name',state.project??'未连接');text('connection-status',`${isDemo()?'模拟演示 · ':''}已连接`);
}

function sparkline(field,label,tone){
  const p=point(field),history=p?state.histories.get(ref(p)):null,series=history?.series??[],latest=n(field);
  const graphic=history?.error?'<span class="empty-state">历史读取失败，点击重试</span>':series.length?chartSvg([{series,color:tone==='info'?'var(--info)':'var(--ok)',name:label}],true):'<span class="empty-state">暂无历史数据</span>';
  const heading=`<span>${esc(label)} · 最近 24 小时</span>`;
  return field==='load'?`<button type="button" class="sparkline__button" data-history="${field}" ${p?'':'disabled'} aria-label="查看${esc(label)}历史详情"><span class="sparkline sparkline--muted">${graphic}</span><span class="sparkline__caption">${heading}</span></button>`:`<div class="sparkline-block"><button type="button" class="sparkline__button" data-history="${field}" ${p?'':'disabled'} aria-label="查看${esc(label)}历史详情"><span class="sparkline__head">${heading}<strong>${latest==null?'—':esc(numberText(latest,0)+'%')}</strong></span><span class="sparkline">${graphic}</span></button></div>`;
}

function renderPanels(){
  const cells=scalar(state.equip,'upsCellCount');text('battery-meta',typeof cells==='number'?`${cells} cells · ${scalar(state.equip,'upsBatteryType')??'电池组'}`:'未配置电池组');
  html('battery-body',`<div class="stat-grid">${fieldStat('batteryVoltage','电池组电压')}${fieldStat('impedance','内阻')}${fieldStat('batteryTemp','电池温度')}${fieldStat('chargeCurrent','充电电流')}</div>${sparkline('capacity','容量趋势','ok')}`);
  const load=n('load'),rated=scalar(state.equip,'upsRatedPower');text('load-meta',`${n('loadPower')==null?'—':numberText(n('loadPower'),1)} kW / ${typeof rated==='number'?numberText(rated,0):'—'} kW`);
  html('load-body',`<div class="load-bar" role="meter" aria-label="当前负载率" ${load==null?'':`aria-valuenow="${load}" aria-valuemin="0" aria-valuemax="100"`}><div class="load-bar__fill" style="width:${load==null?0:Math.max(0,Math.min(100,load))}%"></div></div><div class="load-bar__scale"><span>0%</span><span>50%</span><span>100%</span></div>${sparkline('load','负载趋势','info')}<div class="stat-grid">${stat('保障时长',typeof scalar(state.equip,'upsRequiredRuntime')==='number'?numberText(scalar(state.equip,'upsRequiredRuntime'),0)+' min':'未配置')}${fieldStat('load','当前负载',0)}</div>`);
  text('electronics-meta','实时点位');const capacitor=n('capacitor');
  html('electronics-body',`<div class="stat-grid stat-grid--electronics">${stat('逆变器输出',`${metric('inverterVoltage')} / ${metric('inverterFrequency',2)}`,status('inverterVoltage'))}${fieldStat('thd','输出 THD')}${fieldStat('rectifier','整流器 / 充电器')}${fieldStat('fan','冷却风机')}</div><div class="mini-gauge"><span class="mini-gauge__label">电容健康度</span><div class="mini-gauge__track"><div class="mini-gauge__fill" style="width:${capacitor==null?0:Math.max(0,Math.min(100,capacitor))}%"></div></div><strong class="mini-gauge__value">${capacitor==null?'—':numberText(capacitor,0)+'%'}</strong></div>`);
  text('environment-meta','机房传感器');
  html('environment-body',`<div class="stat-grid">${fieldStat('ambientTemp','环境温度')}${fieldStat('humidity','相对湿度',0)}${fieldStat('airQuality','空气质量')}${stat('漏水检测',point('water')?(scalar(point('water'),'curVal')===false?'干燥':scalar(point('water'),'curVal')===true?'检测到漏水':'未知'):'未配置',status('water'))}</div><p class="panel-note">${esc(isDemo()?'模拟快照时间':'数据更新时间')} ${esc(formatTime(value(point('ambientTemp'),'upsObservedAt'),state.tz,false))}</p>`);
  text('transfer-meta','供电连续性');const transferAt=value(point('transferDuration'),'upsLastTransferAt')??value(point('transfer'),'upsLastTransferAt')??value(state.equip,'upsLastTransferAt');
  html('transfer-body',`<div class="stat-grid">${fieldStat('transfer','转换开关')}${stat('维护旁路',point('bypass')?(scalar(point('bypass'),'curVal')===true?'可用':'不可用'):'未配置',status('bypass'))}${fieldStat('transferDuration','最近转换耗时',0)}${stat('最近转换时间',formatTime(transferAt,state.tz))}</div><p class="panel-note">所有设备控制点保持只读</p>`);
  text('predictive-meta',isDemo()?'模拟健康评估':'最新健康评估');
  html('predictive-body',state.assessment?`<ul class="predict-list">${state.risks.map(risk=>{const recommendation=state.recommendations.get(ref(risk))?.[0],level=scalar(risk,'upsRiskLevel');return `<li><i class="predict-list__dot risk-${esc(level??'unknown')}" aria-hidden="true"></i><span class="predict-list__label">${esc(dis(risk))}</span><span class="predict-list__value">${esc(recommendation?dis(recommendation):'尚无维护建议')}</span></li>`;}).join('')||'<li class="empty-state">尚无维护建议</li>'}</ul><span class="assessment-badge status-${isDemo()?'info':'ok'}">${esc(scalar(state.assessment,'upsRuleVersion')??'规则版本未提供')} · ${isDemo()?'模拟评估':'已评估'}</span>`:'<div class="empty-state">尚无健康评估与维护建议</div>');
}

function renderAlarms(){
  const open=state.alarms.filter(a=>scalar(a,'upsAlarmState')==='open').length;text('alarm-count',`${open} 个待确认`);
  html('alarm-list',state.alarms.length?sortAlarms(state.alarms).map(alarm=>{const level=scalar(alarm,'upsRiskLevel'),stage=scalar(alarm,'upsAlarmState');return `<div class="alarm-row${stage==='acknowledged'?' is-ack':''}"><span class="alarm-row__level status-${severityClass[level]??'unknown'}">${esc(({info:'提示',warning:'警告',critical:'严重',unknown:'未知'})[level]??level??'未知')}</span><span class="alarm-row__text">${esc(dis(alarm))}</span><time class="alarm-row__time">${esc(formatTime(value(alarm,'raisedAt'),state.tz))}</time>${stage==='open'?`<button type="button" class="alarm-row__action" data-ack-ref="${esc(ref(alarm))}">确认告警</button>`:`<span class="alarm__acked" aria-disabled="true">${esc(({acknowledged:'已确认',inProgress:'处置中',resolved:'已恢复'})[stage]??stage)}</span>`}</div>`;}).join(''):'<div class="empty-state">当前设备没有活动 UPS 告警</div>');
}

async function readAssessment(equip,version){
  const assessment=first(await evaluate(`${isDemo(equip)?'upsDemoAssessment':'upsLatestAssessment'}(${axonRef(ref(equip))})`));
  if(!state.selection.current(version))return;state.assessment=assessment;state.risks=[];state.recommendations=new Map();
  if(assessment){const risks=orderRisks(assessment,gridRows(await evaluate(`upsAssessmentRiskItems(${axonRef(ref(assessment))})`))),results=await Promise.allSettled(risks.map(r=>evaluate(`upsRiskRecommendations(${axonRef(ref(r))})`)));if(!state.selection.current(version))return;state.risks=risks;state.recommendations=recommendationsByRisk(results.map((result,index)=>({riskRef:ref(risks[index]),rows:result.status==='fulfilled'?gridRows(result.value):[]})));}
  if(state.selection.current(version)){renderHero();renderPanels();}
}
async function readAlarms(version){const equipId=ref(state.equip),alarms=gridRows(await evaluate(`upsActiveAlarms({equipRef:${axonRef(equipId)}})`));if(state.selection.current(version)){state.alarms=alarms;renderAlarms();}}
async function readSparklines(version){
  const points=['capacity','load'].map(field=>point(field)).filter(Boolean),range=rangeBounds('24h');
  const results=await historyResults(points,async p=>parseHistory(await evaluate(historyExpression(ref(p),range))));if(!state.selection.current(version))return;
  results.forEach((result,i)=>state.histories.set(ref(points[i]),result.status==='fulfilled'?{series:result.value}:{error:errorMessage(result.reason)}));renderPanels();
}
async function selectEquipment(id){
  const equip=state.equips.find(e=>ref(e)===id);if(!equip)return;
  const version=state.selection.next();state.selectionVersion=version;state.historyGate.next();if($('history-dialog')?.open)$('history-dialog').close();
  state.equip=equip;state.points=[];state.alarms=[];state.assessment=null;state.risks=[];state.recommendations=new Map();state.histories.clear();setTimezone();renderTabs();renderHero();renderPanels();renderAlarms();announce(`正在读取 ${dis(equip)}`);
  const results=await Promise.allSettled([evaluate(`upsEquipSummary(${axonRef(id)})`),evaluate(`upsEquipPoints(${axonRef(id)})`)]);if(!state.selection.current(version))return;
  if(results[0].status==='fulfilled')state.equip=first(results[0].value)??equip;if(results[1].status==='fulfilled')state.points=gridRows(results[1].value);
  results.filter(r=>r.status==='rejected').forEach(r=>showError(r.reason));state.modes.set(id,scalar(point('mode'),'curVal'));setTimezone();renderTabs();renderHero();renderPanels();
  const related=await Promise.allSettled([readAssessment(state.equip,version),readAlarms(version),readSparklines(version)]);if(!state.selection.current(version))return;
  related.filter(r=>r.status==='rejected').forEach(r=>showError(r.reason));announce(`${dis(state.equip)} 已加载${isDemo()?'，当前为模拟数据':''}`);
}
async function loadTree(){
  const [sites,equips]=await Promise.all([evaluate('upsSites()'),evaluate('upsEquips()')]);state.sites=gridRows(sites);state.equips=gridRows(equips).sort((a,b)=>String(dis(a)).localeCompare(String(dis(b))));
  const floorResults=await Promise.allSettled(state.sites.map(site=>evaluate(`upsFloors(${axonRef(ref(site))})`)));state.floors=floorResults.flatMap(r=>r.status==='fulfilled'?gridRows(r.value):[]);
  const selection=resolveTreeSelection(state.equips,ref(state.equip));
  if(selection.equip){
    const selected=ref(selection.equip);
    if(selection.preserve){
      const version=state.selectionVersion;
      const results=await Promise.allSettled([refreshTelemetry(),readAssessment(state.equip,version),readAlarms(version),readSparklines(version)]);
      results.filter(result=>result.status==='rejected').forEach(result=>showError(result.reason));
      setTimezone();
    }else await selectEquipment(selected);
    const others=state.equips.filter(e=>ref(e)!==selected),modes=await Promise.allSettled(others.map(e=>evaluate(`upsEquipPoints(${axonRef(ref(e))})`)));
    modes.forEach((result,i)=>{if(result.status==='fulfilled'){const p=selectPoint(gridRows(result.value),'mode').point;state.modes.set(ref(others[i]),pointQuality(p).state==='valid'?scalar(p,'curVal'):null);}});renderTabs();
  }else{
    if(state.equip){state.selectionVersion=state.selection.next();state.historyGate.next();if($('history-dialog')?.open)$('history-dialog').close();}
    state.equip=null;state.points=[];state.alarms=[];state.assessment=null;state.risks=[];state.recommendations=new Map();state.histories.clear();setTimezone();renderTabs();renderHero();renderPanels();renderAlarms();
  }
}
async function refreshTelemetry(){
  if(!state.equip||state.telemetryBusy||document.hidden)return;state.telemetryBusy=true;const version=state.selectionVersion,id=ref(state.equip);
  try{const results=await Promise.allSettled([evaluate(`upsEquipSummary(${axonRef(id)})`),evaluate(`upsEquipPoints(${axonRef(id)})`)]);if(!state.selection.current(version))return;if(results[0].status==='fulfilled')state.equip=first(results[0].value)??state.equip;if(results[1].status==='fulfilled')state.points=gridRows(results[1].value);renderHero();renderPanels();results.filter(r=>r.status==='rejected').forEach(r=>showError(r.reason));}finally{state.telemetryBusy=false;}
}

function chartSvg(lines,small=false){
  const width=small?360:900,height=small?58:300,pad=small?{l:2,r:2,t:5,b:5}:{l:64,r:20,t:22,b:42},valid=lines.flatMap(l=>l.series.filter(p=>p.valid));
  if(!valid.length)return '<span class="empty-state">所选范围没有有效历史数据</span>';
  let min=Infinity,max=-Infinity,minTime=Infinity,maxTime=-Infinity;for(const p of valid){min=Math.min(min,p.value);max=Math.max(max,p.value);minTime=Math.min(minTime,p.time);maxTime=Math.max(maxTime,p.time);}const space=max-min||Math.max(1,Math.abs(max)*.02);min-=space*.15;max+=space*.15;
  const x=t=>pad.l+(t-minTime)/(maxTime-minTime||1)*(width-pad.l-pad.r),y=v=>height-pad.b-(v-min)/(max-min)*(height-pad.t-pad.b);
  let axes='';if(!small){for(let i=0;i<5;i++){const v=min+(max-min)*i/4,yy=y(v);axes+=`<line x1="${pad.l}" x2="${width-pad.r}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${pad.l-10}" y="${yy+4}" text-anchor="end">${numberText(v,1)}</text>`;}for(let i=0;i<4;i++){const t=minTime+(maxTime-minTime)*i/3;axes+=`<text x="${x(t)}" y="${height-12}" text-anchor="middle">${esc(formatTime(t,state.tz,false).slice(0,5))}</text>`;}}
  const paths=lines.map(line=>{const segments=chartSegments(line.series),series=segments.flat();
    return segments.map(part=>`<polyline points="${part.map(p=>`${x(p.time).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ')}" fill="none" stroke="${line.color}" stroke-width="${small?1.9:2.3}" stroke-linejoin="round" stroke-linecap="round"/>`).join('')+(!small?series.map(p=>`<circle cx="${x(p.time)}" cy="${y(p.value)}" r="3" fill="${line.color}" tabindex="0"><title>${esc(line.name)} · ${esc(formatTime(p.time,state.tz))} · ${esc(numberText(p.value,2))}</title></circle>`).join(''):'');
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${small?'历史趋势':'历史折线图，数值统计见图表下方'}" preserveAspectRatio="${small?'none':'xMidYMid meet'}" style="width:100%;height:${small?'100%':'auto'};fill:var(--text-muted);font:11px var(--font-mono)">${axes}${paths}</svg>`;
}

function historyLabel(){return state.historyField==='capacity'?'电池容量':'当前负载率';}
async function updateHistory(){
  const token=state.historyGate.next(),equipId=ref(state.equip);if(!equipId)return;
  let range;try{range=rangeBounds(state.historyRange,Date.now(),state.historyCustom??{});}catch(error){historyError(error);return;}
  if($('history-error'))$('history-error').hidden=true;html('history-chart','<div class="empty-state">正在读取历史数据…</div>');text('history-range-label',`${formatTime(range.start,state.tz)} — ${formatTime(range.end,state.tz)} · ${state.tz} · 结束时间不含`);
  const points=state.points.filter(p=>state.historySelected.includes(ref(p))&&scalar(p,'unit')===state.historyUnit);if(!points.length){historyError(Error('请至少选择一个同单位点位'));return;}
  const results=await historyResults(points,async p=>parseHistory(await evaluate(historyExpression(ref(p),range))));if(!state.historyGate.current(token)||equipId!==ref(state.equip))return;
  const colors=['var(--ok)','var(--info)','var(--warn)','var(--crit)'],lines=[];results.forEach((result,i)=>{if(result.status==='fulfilled')lines.push({series:result.value,color:colors[i%colors.length],name:dis(points[i]),point:points[i]});});
  html('history-chart',lines.length?chartSvg(lines):'<div class="empty-state">所选点位的历史读取均失败</div>');
  html('history-legend',results.map((result,i)=>`<span style="color:${colors[i%colors.length]}">${esc(dis(points[i]))}${result.status==='rejected'?' · 读取失败':result.value.length?'':' · 无数据'}</span>`).join(''));
  html('history-stats',lines.map(line=>{const stats=historyStats(line.series);return [['最新',stats.latest],['最小',stats.min],['最大',stats.max],['平均',stats.average],['样本数',stats.count]].map(([label,v])=>`<div><span>${esc(line.name)} · ${label}</span><strong>${v==null?'—':numberText(v,label==='样本数'?0:2)}${label==='样本数'?'':' '+esc(state.historyUnit)}</strong>${label==='样本数'?`<span>${stats.excluded?'另有 '+stats.excluded+' 条质量异常或缺失':'样本均有效'}</span>`:''}</div>`).join('');}).join(''));
  if(results.some(r=>r.status==='rejected'))historyError(Error(lines.length?'部分点位读取失败，已保留成功序列':'历史接口读取失败，请重试'));announce('历史数据已更新');
}
function historyError(error){text('history-error',errorMessage(error));if($('history-error'))$('history-error').hidden=false;announce(errorMessage(error));}
let historyTrigger=null;
function openHistory(field,trigger){
  const p=point(field);if(!p)return;historyTrigger=trigger;state.historyField=field;state.historyUnit=scalar(p,'unit');state.historySelected=[ref(p)];state.historyRange='24h';
  text('history-title',`${historyLabel()}历史`);text('history-subtitle',`${dis(state.equip)} · ${path()}${isDemo()?' · 模拟数据':''}`);
  html('history-point-select',state.points.filter(item=>has(item,'his')&&scalar(item,'unit')===state.historyUnit).map(item=>`<option value="${esc(ref(item))}"${ref(item)===ref(p)?' selected':''}>${esc(dis(item))}</option>`).join(''));
  $('history-custom-range').hidden=true;document.querySelectorAll('#history-ranges [data-range]').forEach(button=>{button.classList.toggle('is-active',button.dataset.range==='24h');button.setAttribute('aria-pressed',String(button.dataset.range==='24h'));});$('history-dialog').showModal();updateHistory().catch(historyError);
}

let storage;try{storage=localStorage;}catch{}
let theme=applyTheme(readTheme(storage));
$('theme-toggle')?.addEventListener('click',()=>{theme=applyTheme(setTheme(theme==='light'?'dark':'light',storage));});
$('fleet-tabs')?.addEventListener('click',event=>{const button=event.target.closest('[data-equip-ref]');if(button){clearError();selectEquipment(button.dataset.equipRef).catch(showError);}});
document.addEventListener('click',event=>{const button=event.target.closest('[data-history]');if(button)openHistory(button.dataset.history,button);});
$('alarm-list')?.addEventListener('click',async event=>{const button=event.target.closest('[data-ack-ref]');if(!button)return;const alarm=state.alarms.find(a=>ref(a)===button.dataset.ackRef);if(!alarm)return;button.disabled=true;button.textContent='正在确认…';const equipId=ref(state.equip);try{await alarmAck(alarm,evaluate,async()=>{if(ref(state.equip)===equipId){state.alarms=gridRows(await evaluate(`upsActiveAlarms({equipRef:${axonRef(equipId)}})`));renderAlarms();}});if(ref(state.equip)===equipId){state.alarms=gridRows(await evaluate(`upsActiveAlarms({equipRef:${axonRef(equipId)}})`));renderAlarms();}announce('告警已确认');}catch(error){showError(error);if(button.isConnected){button.disabled=false;button.textContent='确认告警';}}});
for(const id of ['refresh-data','retry-load'])$(id)?.addEventListener('click',()=>{clearError();loadTree().catch(showError);});
$('history-close')?.addEventListener('click',()=>$('history-dialog').close());
$('history-dialog')?.addEventListener('close',()=>{state.historyGate.next();historyTrigger?.focus();});
$('history-dialog')?.addEventListener('click',event=>{if(event.target===$('history-dialog')){const r=$('history-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('history-dialog').close();}});
$('history-ranges')?.addEventListener('click',event=>{const button=event.target.closest('[data-range]');if(!button)return;state.historyRange=button.dataset.range;document.querySelectorAll('#history-ranges [data-range]').forEach(node=>{node.classList.toggle('is-active',node===button);node.setAttribute('aria-pressed',String(node===button));});$('history-custom-range').hidden=state.historyRange!=='custom';if(state.historyRange!=='custom')updateHistory().catch(historyError);else if(!$('history-start').value){const p=new Intl.DateTimeFormat('en-CA',{timeZone:state.tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}),local=t=>{const x=Object.fromEntries(p.formatToParts(t).map(i=>[i.type,i.value]));return `${x.year}-${x.month}-${x.day}T${x.hour}:${x.minute}`;};$('history-start').value=local(Date.now()-86400000);$('history-end').value=local(Date.now());}});
$('history-apply')?.addEventListener('click',()=>{try{state.historyCustom={start:customEpoch($('history-start').value,state.tz),end:customEpoch($('history-end').value,state.tz)};updateHistory().catch(historyError);}catch(error){historyError(error);}});
$('history-point-select')?.addEventListener('change',event=>{state.historySelected=Array.from(event.target.selectedOptions).map(o=>o.value);updateHistory().catch(historyError);});
$('history-refresh')?.addEventListener('click',()=>updateHistory().catch(historyError));
function clock(){text('clock',formatClock(Date.now(),state.tz));}
async function start(){state.project=projectName();if(!state.project)throw Error('无法确定 FIN 项目，请从 FIN 项目菜单打开 upsNew');state.client=new Client({base:new URL(`${location.origin}/`),project:state.project,options:{headers:{accept:'text/zinc'}}});await loadTree();clock();}
setInterval(clock,1000);let elapsed=0;
setInterval(()=>{if(document.hidden||!state.client)return;elapsed+=15;refreshTelemetry().catch(showError);if(elapsed%30===0&&state.equip)readAlarms(state.selectionVersion).catch(showError);if(elapsed%60===0&&state.equip)readSparklines(state.selectionVersion).catch(showError);if(elapsed%300===0)loadTree().catch(showError);},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.client)refreshTelemetry().catch(showError);});
text('app-version',`upsNew v${appVersion}`);
start().catch(error=>{text('connection-status','FIN 连接失败');showError(error);});
