import { HRef } from 'haystack-core';
import { scalar, ref,value,timestamp } from './point-schema.js';
export const axonRef=input=>HRef.make(String(input).replace(/^@/,'')).toAxon();
export const gridRows=grid=>typeof grid?.getRows==='function'?grid.getRows():[];
export class RequestGate { #version=0; next(){return ++this.#version;} current(version){return version===this.#version;} }
export async function historyResults(points,read){return Promise.allSettled(points.map(read));}
export function orderRisks(assessment,risks){
  const references=value(assessment,'riskItemRefs');
  const source=typeof references?.toArray==='function'?references.toArray():Array.isArray(references)?references:[];
  const order=new Map(source.map((reference,index)=>[String(reference?.value??reference?.val??reference).replace(/^@/,''),index]));
  return [...risks].sort((a,b)=>{
    const rankA=order.get(String(ref(a)))??Infinity,rankB=order.get(String(ref(b)))??Infinity;
    return (rankA===rankB?0:rankA-rankB)||String(ref(a)).localeCompare(String(ref(b)));
  });
}
export function recommendationsByRisk(groups){return new Map(groups.map(group=>[String(group.riskRef),group.rows]));}
export function sortAlarms(alarms){return [...alarms].sort((a,b)=>{
  const timeA=timestamp(value(a,'raisedAt'))??-Infinity,timeB=timestamp(value(b,'raisedAt'))??-Infinity;
  return (timeA===timeB?0:timeB-timeA)||String(ref(a)).localeCompare(String(ref(b)));
});}
export function resolveTreeSelection(equips,currentRef){
  const current=equips.find(equip=>ref(equip)===currentRef);
  return {equip:current??equips[0]??null,preserve:Boolean(current)};
}
export async function alarmAck(alarm,evaluate,refresh) {
  const id=ref(alarm);const version=scalar(alarm,'upsAlarmVersion');
  if(!id||!Number.isInteger(version)||version<0)throw Error('告警缺少有效版本，无法确认');
  try{return await evaluate(`upsAlarmAck(${axonRef(id)}, null, ${version})`);}
  catch(error){const text=error?.message??String(error);if(text.includes('UPS-3002')){await refresh();throw Error('告警记录已变化，已刷新，请核对后重试');}if(/permission|forbidden|not authorized|admin/i.test(text))throw Error('当前账号无权确认告警');throw error;}
}
