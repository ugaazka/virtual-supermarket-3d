import test from 'node:test';
import assert from 'node:assert/strict';
import {blocked,movePlayer,lookAngles,assignPlacements,SHELVES,sanitizeCart} from '../shared/store.js';
test('player cannot cross a shelf even with a large delta',()=>{const p=movePlayer({x:0,z:3},6,0);assert.ok(p.x<1.91);assert.ok(!blocked(p.x,p.z));});
test('slides along shelves and stays within store',()=>{const p=movePlayer({x:1.8,z:3},2,1);assert.ok(p.x<1.91);assert.ok(p.z>3.9);const end=movePlayer({x:0,z:13},0,100);assert.ok(end.z<=15.7);});
test('checkout counters block passage',()=>assert.ok(movePlayer({x:6,z:15},0,-5).z>13.29));
test('mouse pitch is clamped; yaw remains free',()=>{const a=lookAngles(0,0,100,10000);assert.equal(a.pitch,-1.25);assert.ok(a.yaw<0);});
test('records have unique shelf slots and overflow is explicit',()=>{const p=Array.from({length:150},(_,i)=>({_id:String(i),category:'Drinks',shelfId:'aisle-2',shelfSlot:0}));const r=assignPlacements(p);assert.equal(r.placed.length,SHELVES.length*18);assert.equal(r.unplaced.length,6);assert.equal(new Set(r.placed.map(x=>`${x.shelfId}:${x.slot}`)).size,144);});
test('cart rejects malformed persisted values',()=>{assert.deepEqual(sanitizeCart([1,2]),{});assert.deepEqual(sanitizeCart({a:2,b:-1,c:'4',d:Infinity}),{a:2});});
