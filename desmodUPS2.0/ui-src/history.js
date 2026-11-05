import { HDateTime, HRef } from 'haystack-core';
import {scalar,value,timestamp} from './point-schema.js';

export function parseHistory(grid) {
  const rows=typeof grid?.getRows==='function'?grid.getRows():grid??[];
  return rows.map(row=>{
    const raw=value(row,'val')??value(row,'v0'); const n=raw?.value??raw;
    const quality=scalar(row,'quality'); const time=timestamp(value(row,'ts'));
    const number=typeof n==='number'&&Number.isFinite(n)?n:null;
    return {time,value:number,valid:time!=null&&number!=null&&(!quality||quality==='valid'),quality:quality??(number==null?'missing':'valid'),source:scalar(row,'source')};
  }).filter(p=>p.time!=null).sort((a,b)=>a.time-b.time);
}
export function historyStats(series) {
  let min=Infinity,max=-Infinity,sum=0,count=0,latest=null;
  for(const point of series){if(point.valid&&Number.isFinite(point.value)){min=Math.min(min,point.value);max=Math.max(max,point.value);sum+=point.value;count++;latest=point.value;}}
  return {latest,min:count?min:null,max:count?max:null,average:count?sum/count:null,count,total:series.length,excluded:series.length-count};
}
export function downsample(data,limit=600) {
  if(data.length<=limit||limit<2)return data.slice(0,limit);
  if(limit===2)return [data[0],data.at(-1)];
  const result=[data[0]];const bucket=(data.length-2)/(limit-2);let selected=0;
  for(let i=0;i<limit-2;i++){
    let avgStart=Math.floor((i+1)*bucket)+1,avgEnd=Math.min(Math.floor((i+2)*bucket)+1,data.length);
    let avgX=0,avgY=0; const count=Math.max(1,avgEnd-avgStart);
    for(let j=avgStart;j<avgEnd;j++){avgX+=data[j].time;avgY+=data[j].value??0;}avgX/=count;avgY/=count;
    const start=Math.floor(i*bucket)+1,end=Math.min(Math.floor((i+1)*bucket)+1,data.length-1);let area=-1,next=start;
    const a=data[selected];
    for(let j=start;j<end;j++){const b=data[j];const triangle=Math.abs((a.time-avgX)*((b.value??0)-(a.value??0))-(a.time-b.time)*(avgY-(a.value??0)));if(triangle>area){area=triangle;next=j;}}
    result.push(data[next]);selected=next;
  }
  result.push(data.at(-1));return result;
}
export function chartSegments(series,limit=600){
  const segments=[];let current=[];
  for(const point of series){if(point.valid)current.push(point);else if(current.length){segments.push(current);current=[];}}
  if(current.length)segments.push(current);
  const total=segments.reduce((sum,segment)=>sum+segment.length,0);
  if(total<=limit)return segments;
  if(segments.length>=limit)return Array.from({length:limit},(_,i)=>[segments[Math.floor(i*segments.length/limit)][0]]);
  let budget=limit,remaining=total;
  return segments.map((segment,index)=>{
    const slotsLeft=segments.length-index-1;
    const target=Math.min(segment.length,Math.max(1,Math.min(budget-slotsLeft,Math.floor(budget*segment.length/remaining))));
    budget-=target;remaining-=segment.length;return downsample(segment,target);
  });
}
export function rangeBounds(range,now=Date.now(),custom={}) {
  let start,end;
  if(range==='custom'){start=Number(custom.start);end=Number(custom.end);}else{const days={'24h':1,'7d':7,'30d':30}[range];if(!days)throw Error('无效的历史范围');end=now;start=end-days*86400000;}
  if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end)throw Error('开始时间必须早于结束时间');
  if(end-start>366*86400000)throw Error('历史范围不能超过 366 天');
  return {start,end};
}
export function historyExpression(pointRef,range) {
  const id=HRef.make(String(pointRef).replace(/^@/,'')).toAxon();
  return `upsPointHistory(${id}, ${HDateTime.make(new Date(range.start)).toAxon()}..${HDateTime.make(new Date(range.end)).toAxon()}, {})`;
}
export function customEpoch(input,timezone='UTC') {
  const match=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(input??'');
  if(!match)throw Error('请输入完整的开始和结束时间');
  const parts=match.slice(1).map(Number);const nominal=Date.UTC(parts[0],parts[1]-1,parts[2],parts[3],parts[4]);
  let instant=nominal;
  for(let i=0;i<3;i++){
    const formatted=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant);
    const p=Object.fromEntries(formatted.map(x=>[x.type,x.value]));const rendered=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
    instant+=nominal-rendered;
  }
  const roundTrip=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant);
  const p=Object.fromEntries(roundTrip.map(x=>[x.type,x.value]));
  if(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`!==input)throw Error('所选时间在项目时区中不存在');
  return instant;
}

