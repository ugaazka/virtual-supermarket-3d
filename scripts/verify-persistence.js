import 'dotenv/config';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {unlink} from 'node:fs/promises';
import mongoose from 'mongoose';
const base='http://127.0.0.1:3111';
const marker=`Connection verification ${randomUUID()}`;
let child,cookie,productId,upload;
async function start(){
 child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'3111',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
 let failed=false;child.once('exit',()=>{failed=true;});
 for(let i=0;i<250;i++){
  if(failed)throw Error('Verification API could not start');
  try{const r=await fetch(base+'/api/health');if(r.ok){const h=await r.json();assert.equal(h.persistent,true);return;}}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('Verification API startup timed out');
}
async function stop(){if(child&&child.exitCode===null){const closed=once(child,'exit');child.kill('SIGTERM');await closed;}child=null;}
async function api(route,{method='GET',body,auth=true}={}){
 const r=await fetch(base+'/api'+route,{method,headers:{'Content-Type':'application/json',...(auth?{Cookie:cookie||''}:{})},body:body?JSON.stringify(body):undefined});
 return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};
}
try{
 assert.ok(process.env.MONGODB_URI,'MONGODB_URI is required');
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
 await start();
 const login=await api('/auth/login',{method:'POST',auth:false,body:{password:process.env.ADMIN_PASSWORD}});assert.equal(login.status,200);cookie=login.cookie.split(';')[0];
 const inventory=(await api('/admin/products')).data;
 const shelfId='aisle-8';const shelfSlot=Array.from({length:18},(_,i)=>17-i).find(i=>!inventory.some(p=>p.active!==false&&p.shelfId===shelfId&&p.shelfSlot===i));assert.notEqual(shelfSlot,undefined,'No free verification shelf slot');
 const created=await api('/admin/products',{method:'POST',body:{name:marker,category:'Household',price:3.25,stock:3,shape:'bottle',color:'#638d76',description:'Temporary persistence verification; automatically removed.',image:'',shelfId,shelfSlot,active:true}});assert.equal(created.status,201);productId=created.data._id;assert.ok(mongoose.isValidObjectId(productId));
 const updated=await api(`/admin/products/${productId}`,{method:'PUT',body:{...created.data,description:'Updated inventory persisted in Atlas'}});assert.equal(updated.status,200);
 const orderBody={customer:{name:marker,phone:'0000000000',address:'SYSTEM VERIFICATION ONLY - DO NOT FULFILL'},items:[{productId,quantity:2,price:.01}],total:.01,paymentMethod:'cash',paymentReference:marker};
 const invalid=await api('/orders',{method:'POST',auth:false,body:{...orderBody,items:[{productId,quantity:4}]}});assert.equal(invalid.status,409);
 const order=await api('/orders',{method:'POST',auth:false,body:orderBody});assert.equal(order.status,201);assert.equal(order.data.total,6.5);assert.equal(order.data.paymentStatus,'pending');
 const status=await api(`/admin/orders/${order.data.id}`,{method:'PATCH',body:{status:'preparing',paymentStatus:'pending'}});assert.equal(status.status,200);
 const finalUnit={...orderBody,items:[{productId,quantity:1}]};
 const parallel=await Promise.all([api('/orders',{method:'POST',auth:false,body:finalUnit}),api('/orders',{method:'POST',auth:false,body:finalUnit})]);assert.deepEqual(parallel.map(r=>r.status).sort(),[201,409]);
 const image=await api('/admin/uploads',{method:'POST',body:{data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a30sAAAAASUVORK5CYII='}});assert.equal(image.status,201);upload=image.data.image;
 await stop();await start();
 const after=(await api('/admin/products')).data.find(p=>p._id===productId);assert.ok(after);assert.equal(after.stock,0);assert.equal(after.description,'Updated inventory persisted in Atlas');
 const saved=(await api('/admin/orders')).data.find(o=>o._id===order.data.id);assert.ok(saved);assert.equal(saved.total,6.5);assert.equal(saved.status,'preparing');assert.equal(saved.paymentStatus,'pending');assert.equal((await fetch(base+upload)).status,200);
 const removed=await api(`/admin/products/${productId}`,{method:'DELETE'});assert.equal(removed.status,200);assert.ok(!(await api('/products',{auth:false})).data.some(p=>p._id===productId));
 console.log(JSON.stringify({connected:true,database:mongoose.connection.name,adminCRUD:'passed',serverTotals:'passed',stockValidation:'passed',atlasTransactions:'passed',concurrentLastUnit:'passed',apiRestartPersistence:'passed',orderStatusPersistence:'passed',uploadPersistence:'passed'}));
}catch(error){console.error('Persistence verification failed:',String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi,'[redacted connection URI]'));process.exitCode=1;}
finally{
 await stop();
 if(mongoose.connection.readyState===1&&productId){
  const orders=await mongoose.connection.db.collection('orders').deleteMany({'customer.name':marker,paymentReference:marker,'items.productId':productId});
  const products=await mongoose.connection.db.collection('products').deleteOne({_id:new mongoose.Types.ObjectId(productId),name:marker});
  console.log(JSON.stringify({temporaryTestProductsRemoved:products.deletedCount,temporaryTestOrdersRemoved:orders.deletedCount}));
 }
 if(upload)await unlink(new URL(`../data${upload}`,import.meta.url)).catch(()=>{});
 await mongoose.disconnect();
}
