import test from 'node:test';
import assert from 'node:assert/strict';
import { HDict, HNum, HDateTime,HNa } from 'haystack-core';
import { selectPoint, pointQuality, scalar, pointNumber } from '../point-schema.js';
import * as telemetry from '../point-schema.js';
import { parseHistory, historyStats, downsample, chartSegments, rangeBounds, historyExpression,customEpoch } from '../history.js';
import { readTheme, setTheme } from '../theme.js';
import { RequestGate, historyResults, alarmAck } from '../api.js';

const make = (id, extra = {}) => HDict.make({ id:{_kind:'ref',val:id}, dis:id, point:{_kind:'marker'}, sensor:{_kind:'marker'}, upsBatteryVolt:{_kind:'marker'}, unit:'V', curVal:HNum.make(402.8,'V'), ...extra });

test('semantic point selection enforces all tags and units; primary is deterministic', () => {
  const wrong = make('wrong',{unit:'mV'});
  const secondary = make('a'); const primary = make('z',{primary:{_kind:'marker'}});
  const selected = selectPoint([wrong,secondary,primary], 'batteryVoltage');
  assert.equal(scalar(selected.point,'id'),'z'); assert.equal(selected.ambiguous,true);
  assert.equal(selectPoint([wrong],'batteryVoltage').point,null);
  assert.equal(selectPoint([make('b'),make('a')],'batteryVoltage').point.get('id').value,'a');
});
test('telemetry quality uses observation time and refuses missing metadata', () => {
  const now=Date.parse('2026-11-05T08:00:00Z');
  const good=make('p',{upsObservedAt:HDateTime.make('2026-11-05T07:59:00Z'),upsStaleAfterSec:120,upsDataQuality:'valid',curStatus:'ok'});
  assert.equal(pointQuality(good,now).state,'valid');
  assert.equal(pointQuality(good,now+121000).state,'stale');
  assert.equal(pointQuality(make('missing'),now).state,'unknown');
  assert.equal(pointQuality(make('error',{curErr:'offline'}),now).state,'invalid');
  assert.equal(pointNumber(make('bad',{curVal:'bad'})),null);
});
test('telemetry display keeps percentage units adjacent and clock seconds padded',()=>{
  assert.equal(telemetry.formatUnitValue('58','%'),'58%');
  assert.equal(telemetry.formatUnitValue('1.8','%'),'1.8%');
  assert.equal(telemetry.formatUnitValue('41','%RH'),'41%RH');
  assert.equal(telemetry.formatUnitValue('402.8','V'),'402.8 V');
  assert.equal(telemetry.formatUnitValue('26.4','°C'),'26.4 °C');
  assert.match(telemetry.formatClock(Date.parse('2026-11-05T08:32:04Z'),'Asia/Shanghai'),/16:32:04$/);
  assert.match(telemetry.formatClock(Date.parse('2026-11-05T08:32:00Z'),'Asia/Shanghai'),/16:32:00$/);
});
test('unknown quality, missing observations and NA never become valid telemetry',()=>{
  const now=Date.parse('2026-11-05T08:00:00Z');
  const metadata={upsObservedAt:HDateTime.make('2026-11-05T07:59:00Z'),upsStaleAfterSec:120,upsDataQuality:'valid',curStatus:'ok'};
  assert.equal(pointQuality(make('unknown',{...metadata,upsDataQuality:'unknown'}),now).state,'unknown');
  assert.equal(pointQuality(make('unsupported',{...metadata,upsDataQuality:'unexpected'}),now).state,'unknown');
  assert.equal(pointQuality(make('missing',{...metadata,curVal:null}),now).state,'missing');
  assert.equal(pointQuality(make('na',{...metadata,curVal:HNa.make()}),now).state,'missing');
  assert.equal(pointQuality(make('nan',{...metadata,curVal:HNum.make(NaN,'V')}),now).state,'invalid');
});
test('an empty hero cannot claim valid data quality',()=>{
  assert.equal(telemetry.telemetryQuality([]).state,'unknown');
  assert.notEqual(telemetry.telemetryQuality([]).label,'质量有效');
});
test('runtime estimate and assurance only use fresh valid observations',()=>{
  const now=Date.parse('2026-11-05T08:00:00Z');
  const point=make('runtime',{curVal:HNum.make(36,'min'),upsObservedAt:HDateTime.make('2026-11-05T07:59:00Z'),upsStaleAfterSec:120,upsDataQuality:'valid',curStatus:'ok'});
  const good=telemetry.runtimeState(point,15,now);assert.equal(good.value,36);assert.equal(good.margin,21);assert.equal(good.tone,'ok');
  const stale=telemetry.runtimeState(point,15,now+121000);assert.equal(stale.value,null);assert.equal(stale.margin,null);assert.notEqual(stale.tone,'ok');assert.match(stale.message,/过期/);
  const invalid=telemetry.runtimeState(make('bad',{curVal:36,curErr:'bad sensor'}),15,now);assert.equal(invalid.value,null);assert.notEqual(invalid.tone,'ok');
  const unknown=telemetry.runtimeState(make('unknown',{curVal:36}),15,now);assert.equal(unknown.value,null);assert.notEqual(unknown.tone,'ok');
});
test('history statistics use finite valid data and preserve missing samples', () => {
  const series=parseHistory([{ts:HDateTime.make('2026-11-05T01:00:00Z'),val:HNum.make(20,'%')},{ts:HDateTime.make('2026-11-05T02:00:00Z'),val:HNum.make(80,'%'),quality:'stale'},{ts:HDateTime.make('2026-11-05T03:00:00Z'),val:null},{ts:HDateTime.make('2026-11-05T04:00:00Z'),val:HNum.make(40,'%')}]);
  const stats=historyStats(series);
  assert.deepEqual(stats,{latest:40,min:20,max:40,average:30,count:2,total:4,excluded:2});
  assert.equal(series[2].value,null);
});
test('downsampling bounds display points while retaining endpoints and extrema',()=>{
  const series=Array.from({length:2000},(_,i)=>({time:i,value:i===1001?1000:0,valid:true}));
  const small=downsample(series,600);
  assert.ok(small.length<=600); assert.equal(small[0].time,0); assert.equal(small.at(-1).time,1999); assert.ok(small.some(p=>p.value===1000));
});
test('large histories do not overflow calls and charts retain data gaps',()=>{
  const series=Array.from({length:150000},(_,i)=>({time:i,value:i,valid:true}));
  series[50000]={time:50000,value:null,valid:false};
  const stats=historyStats(series);assert.equal(stats.count,149999);assert.equal(stats.max,149999);
  const segments=chartSegments(series,600);assert.equal(segments.length,2);assert.ok(segments.flat().length<=600);
  assert.ok(segments[0].every(p=>p.time<50000));assert.ok(segments[1].every(p=>p.time>50000));
});
test('custom ranges use the project timezone rather than the browser timezone',()=>{
  assert.equal(customEpoch('2026-11-05T15:00','Asia/Shanghai'),Date.parse('2026-11-05T07:00:00Z'));
  assert.throws(()=>customEpoch('2026-02-30T15:00','Asia/Shanghai'),/不存在/);
});
test('history range validates absolute instants and encodes refs with Haystack',()=>{
  const end=Date.parse('2026-11-05T08:00:00Z'); const range=rangeBounds('24h',end);
  assert.equal(range.end-range.start,24*3600000);
  assert.throws(()=>rangeBounds('custom',end,{start:end,end:end-1}),/开始/);
  assert.throws(()=>rangeBounds('custom',end,{start:0,end:367*86400000}),/366/);
  const expr=historyExpression('p-1',range); assert.match(expr,/^upsPointHistory\(@p-1,/); assert.ok(expr.includes('dateTime(')); assert.ok(expr.endsWith(', {})'));
});
test('theme defaults to light, tolerates blocked storage and persists only valid values',()=>{
  assert.equal(readTheme({getItem:()=>null}),'light'); assert.equal(readTheme({getItem:()=> 'junk'}),'light'); assert.equal(readTheme({getItem:()=> 'dark'}),'dark'); assert.equal(readTheme({getItem:()=>{throw Error();}}),'light');
  let stored; assert.equal(setTheme('dark',{setItem:(_,v)=>stored=v}),'dark'); assert.equal(stored,'dark'); assert.equal(setTheme('invalid',null),'light');
});
test('request gate rejects stale device responses',()=>{
  const gate=new RequestGate();const old=gate.next();const current=gate.next();assert.equal(gate.current(old),false);assert.equal(gate.current(current),true);
});
test('history reads preserve successful series when a peer fails',async()=>{
  const results=await historyResults([{id:'one'},{id:'two'}],async p=>{if(p.id==='two')throw Error('offline');return [{value:1}];});
  assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');
});
test('alarm version conflict refreshes but never retries the write',async()=>{
  let writes=0,reads=0;
  await assert.rejects(alarmAck({id:'a',upsAlarmVersion:3},async()=>{writes++;throw Error('UPS-3002 ALARM_VERSION_CONFLICT');},async()=>{reads++;}),/记录已变化/);
  assert.equal(writes,1);assert.equal(reads,1);
});
