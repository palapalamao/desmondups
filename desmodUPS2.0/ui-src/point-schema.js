export function value(dict, tag) { return typeof dict?.get === 'function' ? dict.get(tag) : dict?.[tag]; }
export function scalar(dict, tag) {
  const item = value(dict, tag);
  if (item == null) return undefined;
  if (typeof item.value !== 'undefined') return item.value;
  return typeof item === 'object' ? item.toString() : item;
}
export function has(dict, tag) { return value(dict, tag) != null; }
export const ref = (dict, tag='id') => scalar(dict, tag);
export const dis = dict => scalar(dict,'dis') ?? scalar(dict,'navName') ?? ref(dict) ?? '未配置';
export const escapeHtml = input => String(input ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const fields = {
  mode:{tags:['upsMode'],kind:'Str'}, batteryVoltage:{tags:['upsBatteryVolt'],unit:'V'},
  impedance:{tags:['upsBatteryImpedance'],unit:'mΩ'}, batteryTemp:{tags:['upsBatteryTemp'],unit:'°C'},
  chargeCurrent:{tags:['upsChargeCurrent'],unit:'A'}, capacity:{tags:['upsBatteryCapacity'],unit:'%'},
  runtime:{tags:['upsRuntimeEstimate'],unit:'min'}, load:{tags:['upsLoadRate'],unit:'%'},
  loadPower:{tags:['upsLoadPower'],unit:'kW'}, inverterVoltage:{tags:['upsInverter','upsVoltage'],unit:'V'},
  inverterFrequency:{tags:['upsInverter','upsFrequency'],unit:'Hz'}, thd:{tags:['upsInverter','upsThd'],unit:'%'},
  rectifier:{tags:['upsRectifier'],kind:'Str'}, capacitor:{tags:['upsCapacitorHealth'],unit:'%'}, fan:{tags:['upsFanStatus'],kind:'Str'},
  ambientTemp:{tags:['upsAmbientTemp'],unit:'°C'}, humidity:{tags:['upsHumidity'],unit:'%RH'},
  airQuality:{tags:['upsAirQuality'],kind:'Str'}, water:{tags:['upsWaterDetected'],kind:'Bool'},
  transfer:{tags:['upsTransferStatus'],kind:'Str'}, bypass:{tags:['upsBypassAvailable'],kind:'Bool'},
  transferDuration:{tags:['upsTransfer','upsTransferDuration'],unit:'ms'}
};

export function selectPoint(points, field) {
  const spec=typeof field==='string'?fields[field]:field;
  if (!spec) return {point:null,ambiguous:false};
  const matches=points.filter(p => ['point','sensor',...spec.tags].every(t=>has(p,t)) && (!spec.unit || scalar(p,'unit')===spec.unit) && (!spec.kind || scalar(p,'kind')===spec.kind));
  matches.sort((a,b)=>Number(has(b,'primary'))-Number(has(a,'primary')) || String(dis(a)).localeCompare(String(dis(b))) || String(ref(a)).localeCompare(String(ref(b))));
  return {point:matches[0]??null,ambiguous:matches.length>1};
}
export function pointNumber(point) { const n=scalar(point,'curVal'); return typeof n==='number'&&Number.isFinite(n)?n:null; }
export function timestamp(item) {
  if (item == null) return null;
  if (item.date instanceof Date) return item.date.getTime();
  if (item instanceof Date) return item.getTime();
  if (typeof item==='number') return Number.isFinite(item)?item:null;
  const result=Date.parse(String(item.value??item).replace(/ [A-Za-z_]+$/,''));
  return Number.isFinite(result)?result:null;
}
export function pointQuality(point, now=Date.now()) {
  if (!point) return {state:'missing',label:'未配置'};
  if (has(point,'curErr') || has(point,'writeErr') || (scalar(point,'curStatus') && scalar(point,'curStatus')!=='ok')) return {state:'invalid',label:'点位异常'};
  const current=value(point,'curVal');
  if(current==null || current.getKind?.()==='na')return {state:'missing',label:'数据缺失'};
  const raw=scalar(point,'curVal');
  if(typeof raw==='number'&&!Number.isFinite(raw))return {state:'invalid',label:'数据无效'};
  const quality=scalar(point,'upsDataQuality');
  if (quality==='invalid'||quality==='missing') return {state:quality,label:quality==='invalid'?'数据无效':'数据缺失'};
  if(quality!=='valid'&&quality!=='stale')return {state:'unknown',label:'质量未知'};
  const observed=timestamp(value(point,'upsObservedAt')); const threshold=scalar(point,'upsStaleAfterSec');
  if (observed==null || typeof threshold!=='number' || !Number.isFinite(threshold) || threshold<=0 || observed>now+60000 || scalar(point,'curStatus')!=='ok') return {state:'unknown',label:'质量未知'};
  if (quality==='stale'||now-observed>threshold*1000) return {state:'stale',label:'数据过期'};
  return {state:'valid',label:'质量有效'};
}
export function telemetryQuality(points,now=Date.now()){
  if(!points.length)return {state:'unknown',label:'暂无观测数据'};
  const qualities=points.map(point=>pointQuality(point,now));
  for(const [state,label] of [['invalid','存在异常值'],['missing','部分数据缺失'],['stale','部分数据过期'],['unknown','部分质量未知']]){
    if(qualities.some(quality=>quality.state===state))return {state,label};
  }
  return {state:'valid',label:'质量有效'};
}
export function runtimeState(point,required,now=Date.now()){
  const quality=pointQuality(point,now),reading=pointNumber(point);
  if(quality.state!=='valid')return {value:null,margin:null,tone:quality.state==='invalid'?'crit':'unknown',message:`${quality.label}，无法确认保障裕量`,quality};
  if(reading==null)return {value:null,margin:null,tone:'unknown',message:'续航值不可用，无法确认保障裕量',quality:{state:'invalid',label:'数据无效'}};
  if(typeof required!=='number'||!Number.isFinite(required))return {value:reading,margin:null,tone:'unknown',message:'保障时长未配置',quality};
  const margin=reading-required;
  return {value:reading,margin,tone:margin>=0?'ok':'crit',message:`${margin>=0?'高于':'低于'}保障时长 ${numberText(Math.abs(margin),0)} min`,quality};
}
export function numberText(number, digits=1) { return typeof number==='number'&&Number.isFinite(number)?number.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits}):'—'; }
export function formatUnitValue(display,unit){return unit?`${display}${unit==='%'||unit==='%RH'?'':' '}${unit}`:String(display);}
export function formatClock(input,timezone='UTC'){
  const time=timestamp(input);if(time==null)return '未提供时间';
  const seconds=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,second:'2-digit'}).format(time).padStart(2,'0');
  return `${formatTime(time,timezone)}:${seconds}`;
}
export function formatTime(input, timezone='UTC', date=true) {
  const time=timestamp(input); if(time==null)return '未提供时间';
  try { return new Intl.DateTimeFormat('zh-CN',{timeZone:timezone,year:date?'numeric':undefined,month:date?'2-digit':undefined,day:date?'2-digit':undefined,hour:'2-digit',minute:'2-digit',second:date?undefined:'2-digit',hour12:false}).format(time).replaceAll('/','-'); }
  catch { return new Date(time).toISOString().replace('T',' ').slice(0,date?16:19); }
}

