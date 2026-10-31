import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOPPERS,shopperState,stepShopper} from '../shared/shoppers.js';
import {blocked} from '../shared/store.js';
test('every shopper route stays clear of shelves, counters and store bounds',()=>{
 for(const shopper of SHOPPERS){
  for(let i=0;i<shopper.route.length;i++){
   const a=shopper.route[i],b=shopper.route[(i+1)%shopper.route.length];
   for(let j=0;j<=100;j++){const t=j/100;assert.equal(blocked(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,undefined,.35),false,`${shopper.id}, segment ${i}`);}
  }
 }
});
test('shoppers advance, stop to browse, and yield rather than walk into a customer',()=>{
 const config=SHOPPERS[0],state=shopperState(config);state.wait=0;
 const before={...state};assert.equal(stepShopper(state,config,.05,{x:12,z:14}).walking,true);assert.ok(state.z<before.z);
 const stopped={...state,wait:2};assert.equal(stepShopper(stopped,config,.05).walking,false);assert.equal(stopped.z,state.z);
 const near={...state,wait:0};const previous=near.z;assert.equal(stepShopper(near,config,.05,{x:near.x,z:near.z-.8}).walking,false);assert.equal(near.z,previous);
});
