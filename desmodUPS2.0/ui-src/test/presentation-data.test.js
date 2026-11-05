import test from 'node:test';
import assert from 'node:assert/strict';
import { HDict,HList,HRef,HDateTime } from 'haystack-core';
import * as presentation from '../api.js';
import {ref} from '../point-schema.js';

test('maintenance uses assessment risk references and associates each recommendation by reference',()=>{
  const battery=HDict.make({id:HRef.make('battery'),dis:'电池组更换窗口'});
  const capacitor=HDict.make({id:HRef.make('capacitor'),dis:'电容组维护'});
  const fan=HDict.make({id:HRef.make('fan'),dis:'风机轴承磨损'});
  const assessment=HDict.make({riskItemRefs:HList.make([HRef.make('battery'),HRef.make('capacitor'),HRef.make('fan')])});
  const shuffled=[fan,battery,capacitor];
  const ordered=presentation.orderRisks(assessment,shuffled);
  assert.deepEqual(ordered.map(r=>ref(r)),['battery','capacitor','fan']);
  assert.deepEqual(shuffled.map(r=>ref(r)),['fan','battery','capacitor']);
  const byRisk=presentation.recommendationsByRisk([{riskRef:'fan',rows:['状态正常']},{riskRef:'battery',rows:['18–22 月']},{riskRef:'capacitor',rows:['约 14 月']}]);
  assert.deepEqual(ordered.map(r=>byRisk.get(ref(r))[0]),['18–22 月','约 14 月','状态正常']);
});
test('alarms display newest raised time first, independent of severity or acknowledgement',()=>{
  const yesterday=HDict.make({id:HRef.make('warn'),upsRiskLevel:'warning',upsAlarmState:'open',raisedAt:HDateTime.make('2026-11-04T10:00:00Z')});
  const today=HDict.make({id:HRef.make('info'),upsRiskLevel:'info',upsAlarmState:'acknowledged',raisedAt:HDateTime.make('2026-11-05T01:00:00Z')});
  const noTime=HDict.make({id:HRef.make('unknown'),upsRiskLevel:'critical'});
  assert.deepEqual(presentation.sortAlarms([yesterday,noTime,today]).map(r=>ref(r)),['info','warn','unknown']);
});
test('tree refresh preserves a present selection and selects a replacement only after removal',()=>{
  const first=HDict.make({id:HRef.make('a01'),dis:'UPS A01'});
  const current=HDict.make({id:HRef.make('b01'),dis:'UPS B01'});
  const refreshed=presentation.resolveTreeSelection([first,current],'b01');
  assert.equal(ref(refreshed.equip),'b01');assert.equal(refreshed.preserve,true);
  const deleted=presentation.resolveTreeSelection([first],'b01');
  assert.equal(ref(deleted.equip),'a01');assert.equal(deleted.preserve,false);
  const empty=presentation.resolveTreeSelection([],'b01');
  assert.equal(empty.equip,null);assert.equal(empty.preserve,false);
});
