import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import {randomUUID,timingSafeEqual,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {seedProducts} from './seed.js';
import {SHELVES,SHAPES} from '../shared/store.js';
mongoose.set('bufferCommands',false);
const databaseConfigured=Boolean(process.env.MONGODB_URI);
const app=express();
app.disable('x-powered-by');app.use(express.json({limit:'3mb'}));app.use(cookieParser());
const PORT=Number(process.env.PORT||3001),production=process.env.NODE_ENV==='production';
const jwtSecret=process.env.JWT_SECRET,adminPassword=process.env.ADMIN_PASSWORD;
if(!jwtSecret||jwtSecret.length<32||!adminPassword||adminPassword.length<12){console.error('Set JWT_SECRET (32+ chars) and ADMIN_PASSWORD (12+ chars) in .env.');process.exit(1);}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const uploadDir=path.join(root,'data/uploads');
app.use('/uploads',express.static(uploadDir,{dotfiles:'deny',setHeaders:res=>res.set('X-Content-Type-Options','nosniff')}));
const Product=mongoose.model('Product',new mongoose.Schema({name:{type:String,required:true},category:String,price:Number,stock:Number,color:String,description:String,image:String,shape:String,shelfId:String,shelfSlot:Number,active:{type:Boolean,default:true}},{timestamps:true}));
const Order=mongoose.model('Order',new mongoose.Schema({customer:{name:String,phone:String,address:String},items:[{productId:String,name:String,price:Number,quantity:Number}],total:Number,paymentMethod:String,paymentReference:String,paymentStatus:{type:String,default:'pending'},status:{type:String,default:'new'}},{timestamps:true}));
let mongoReady=false;
let databaseInitialized=false;
mongoose.connection.on('disconnected',()=>{mongoReady=false;});
mongoose.connection.on('connected',()=>{if(databaseInitialized)mongoReady=true;});
let demoProducts=seedProducts.map((x,i)=>({...x,_id:`demo-${i+1}`})),demoOrders=[];
const safe=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const products=()=>mongoReady?Product.find().lean():Promise.resolve(demoProducts);
const orders=()=>mongoReady?Order.find().sort({createdAt:-1}).lean():Promise.resolve([...demoOrders].reverse());
// Same-origin mutation check complements the HttpOnly, SameSite session cookie.
app.use('/api',(req,res,next)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Cross-origin requests are not allowed'});}catch{return res.status(403).json({error:'Invalid origin'});}}next();});
const auth=(req,res,next)=>{try{const payload=jwt.verify(req.cookies.admin_token||'',jwtSecret,{algorithms:['HS256']});if(payload.role!=='admin')throw Error();next();}catch{return res.status(401).json({error:'Admin login required'});}};
app.get('/api/health',(req,res)=>{const available=!databaseConfigured||mongoReady;res.status(available?200:503).json({ok:available,persistent:mongoReady,mode:databaseConfigured?'database':'demo',database:databaseConfigured?(mongoReady?'connected':'unavailable'):'not configured'});});
// A configured store must never accept orders into temporary memory on DB failure.
app.use('/api',(req,res,next)=>{if(databaseConfigured&&!mongoReady)return res.status(503).json({error:'The store database is temporarily unavailable. Please try again shortly.'});next();});
app.get('/api/products',safe(async(req,res)=>{res.set('Cache-Control','no-store');res.json((await products()).filter(p=>p.active!==false));}));
const attempts=new Map();
const cleanup=setInterval(()=>{for(const [ip,v]of attempts)if(v.until<Date.now())attempts.delete(ip);},60000);cleanup.unref();
app.post('/api/auth/login',(req,res)=>{
 const ip=req.ip,now=Date.now(),entry=attempts.get(ip);if(entry&&entry.until>now&&entry.count>=10)return res.status(429).json({error:'Too many login attempts. Try again in 15 minutes.'});
 const pw=req.body?.password;const supplied=Buffer.from(typeof pw==='string'?pw:'');const expected=Buffer.from(adminPassword);
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected)){const v=entry&&entry.until>now?entry:{count:0,until:now+900000};v.count++;attempts.set(ip,v);return res.status(401).json({error:'Invalid password'});}
 attempts.delete(ip);res.cookie('admin_token',jwt.sign({role:'admin'},jwtSecret,{expiresIn:'8h',algorithm:'HS256'}),{httpOnly:true,sameSite:'strict',secure:production,maxAge:8*3600000,path:'/api'});res.json({ok:true});
});
app.get('/api/auth/me',auth,(req,res)=>res.json({ok:true}));
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('admin_token',{path:'/api'});res.json({ok:true});});
app.get('/api/admin/products',auth,safe(async(req,res)=>res.json(await products())));
function validateProduct(v){
 if(!v||typeof v.name!=='string'||v.name.trim().length<2||v.name.length>100||typeof v.category!=='string'||!v.category.trim()||v.category.length>50||typeof v.price!=='number'||!Number.isFinite(v.price)||v.price<0||v.price>100000||!Number.isSafeInteger(v.stock)||v.stock<0||v.stock>100000||!SHAPES.includes(v.shape)||!SHELVES.some(s=>s.id===v.shelfId)||!Number.isInteger(v.shelfSlot)||v.shelfSlot<0||v.shelfSlot>17)return null;
 const image=String(v.image||'');if(image&&!/^\/(products\/[a-z0-9-]+\.svg|uploads\/[a-f0-9-]+\.(png|jpg|webp))$/.test(image))return null;
 return {name:v.name.trim(),category:v.category.trim(),price:Math.round(v.price*100)/100,stock:v.stock,description:String(v.description||'').slice(0,300),color:/^#[0-9a-f]{6}$/i.test(v.color)?v.color:'#648c78',image,shape:v.shape,shelfId:v.shelfId,shelfSlot:v.shelfSlot,active:v.active!==false};
}
async function occupied(data,id){return (await products()).some(p=>p.active!==false&&String(p._id)!==id&&p.shelfId===data.shelfId&&p.shelfSlot===data.shelfSlot);}
app.post('/api/admin/products',auth,safe(async(req,res)=>{
 const data=validateProduct(req.body);if(!data)return res.status(400).json({error:'Invalid product details or shelf position'});
 if(await occupied(data))return res.status(409).json({error:'Shelf position is occupied. Choose another slot.'});
 const item=mongoReady?await Product.create(data):{...data,_id:`demo-${randomUUID()}`};if(!mongoReady)demoProducts.push(item);res.status(201).json(item);
}));
app.put('/api/admin/products/:id',auth,safe(async(req,res)=>{
 const data=validateProduct(req.body);if(!data)return res.status(400).json({error:'Invalid product details or shelf position'});
 if(await occupied(data,req.params.id))return res.status(409).json({error:'Shelf position is occupied. Choose another slot.'});
 let item;if(mongoReady){if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Invalid ID'});item=await Product.findByIdAndUpdate(req.params.id,data,{new:true});}else{item=demoProducts.find(p=>p._id===req.params.id);if(item)Object.assign(item,data);}if(!item)return res.status(404).json({error:'Product not found'});res.json(item);
}));
app.delete('/api/admin/products/:id',auth,safe(async(req,res)=>{let item;if(mongoReady){if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Invalid ID'});item=await Product.findByIdAndUpdate(req.params.id,{active:false});}else{item=demoProducts.find(p=>p._id===req.params.id);if(item)item.active=false;}if(!item)return res.status(404).json({error:'Product not found'});res.json({ok:true});}));
app.post('/api/admin/uploads',auth,safe(async(req,res)=>{
 const {data}=req.body||{};if(typeof data!=='string')return res.status(400).json({error:'Choose a PNG, JPEG or WebP image'});
 const match=data.match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/);if(!match)return res.status(400).json({error:'Unsupported image format'});
 const bytes=Buffer.from(match[2],'base64');const type=match[1];
 const valid=type==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 if(!valid||bytes.length>2*1024*1024)return res.status(400).json({error:'Invalid image or file exceeds 2 MB'});
 await mkdir(uploadDir,{recursive:true});const filename=`${randomUUID()}.${type==='jpeg'?'jpg':type}`;await writeFile(path.join(uploadDir,filename),bytes,{flag:'wx'});res.status(201).json({image:`/uploads/${filename}`});
}));
app.post('/api/orders',safe(async(req,res)=>{
 const {customer,items,paymentMethod,paymentReference}=req.body||{};
 if(!customer||![customer.name,customer.phone,customer.address].every(v=>typeof v==='string'&&v.trim().length>=3&&v.length<=180)||!Array.isArray(items)||items.length<1||items.length>144||!['cash','zaad','evc'].includes(paymentMethod))return res.status(400).json({error:'Please complete all checkout fields'});
 const current=(await products()).filter(p=>p.active!==false),validated=[],seen=new Set();let cents=0;
 for(const entry of items){if(!entry||typeof entry.productId!=='string'||seen.has(entry.productId)||!Number.isSafeInteger(entry.quantity)||entry.quantity<1||entry.quantity>100)return res.status(400).json({error:'Invalid cart'});seen.add(entry.productId);const p=current.find(x=>String(x._id)===entry.productId);if(!p||p.stock<entry.quantity)return res.status(409).json({error:`Not enough stock for ${p?.name||'a product'}`});validated.push({productId:entry.productId,name:p.name,price:p.price,quantity:entry.quantity});cents+=Math.round(p.price*100)*entry.quantity;}
 const data={customer:{name:customer.name.trim(),phone:customer.phone.trim(),address:customer.address.trim()},items:validated,total:cents/100,paymentMethod,paymentReference:String(paymentReference||'').slice(0,100),paymentStatus:'pending',status:'new'};
 let order;
 if(mongoReady){const session=await mongoose.startSession();try{await session.withTransaction(async()=>{for(const x of validated){const updated=await Product.updateOne({_id:x.productId,active:{$ne:false},stock:{$gte:x.quantity}},{$inc:{stock:-x.quantity}},{session});if(updated.modifiedCount!==1){const err=new Error(`Insufficient stock: ${x.name}`);err.status=409;throw err;}}[order]=await Order.create([data],{session});});}finally{await session.endSession();}}
 else{
  // Recheck and mutate synchronously after the last await, preventing demo-order races.
  if(validated.some(x=>{const p=demoProducts.find(p=>p._id===x.productId);return !p||p.active===false||p.stock<x.quantity;}))return res.status(409).json({error:'Stock changed. Refresh your cart.'});
  for(const x of validated)demoProducts.find(p=>p._id===x.productId).stock-=x.quantity;
  order={...data,_id:`order-${randomUUID()}`,createdAt:new Date().toISOString()};demoOrders.push(order);
 }
 res.status(201).json({id:order._id,total:data.total,status:order.status,paymentStatus:order.paymentStatus});
}));
app.get('/api/admin/orders',auth,safe(async(req,res)=>res.json(await orders())));
app.patch('/api/admin/orders/:id',auth,safe(async(req,res)=>{
 const {status,paymentStatus}=req.body||{};if(!['new','preparing','completed','cancelled'].includes(status)||!['pending','paid','failed'].includes(paymentStatus))return res.status(400).json({error:'Invalid status'});
 let order;if(mongoReady){if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Invalid ID'});order=await Order.findByIdAndUpdate(req.params.id,{status,paymentStatus},{new:true});}else{order=demoOrders.find(x=>x._id===req.params.id);if(order)Object.assign(order,{status,paymentStatus});}if(!order)return res.status(404).json({error:'Order not found'});res.json(order);
}));
app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found'}));
app.use((err,req,res,next)=>{console.error(err.message);res.status(err.status||500).json({error:err.status===409?err.message:err.status===413?'File exceeds upload limit':'Request failed; check server logs'});});
if(production){const dist=path.join(root,'dist');app.use(express.static(dist));app.get('*',(req,res)=>res.sendFile(path.join(dist,'index.html')));}
// Older installations used emoji-only records. Add display/placement metadata
// without replacing their IDs, prices, stock, images or existing shelf assignments.
async function upgradeLegacyInventory(){
 const records=await Product.find().lean();
 const used=new Set(records.filter(p=>p.active!==false&&p.shelfId&&Number.isInteger(p.shelfSlot)).map(p=>`${p.shelfId}:${p.shelfSlot}`));
 const changes=[];
 for(const p of records){
  const seed=seedProducts.find(s=>s.name===p.name);const updates={};
  if(!p.shape)updates.shape=seed?.shape||'box';
  if(!p.image&&seed)updates.image=seed.image;
  if(!p.shelfId||!Number.isInteger(p.shelfSlot)){
   const preferred=seed?.shelfId||SHELVES.find(s=>s.category===p.category)?.id||'aisle-1';
   for(const shelf of [preferred,...SHELVES.map(s=>s.id).filter(id=>id!==preferred)]){
    const slot=Array.from({length:18},(_,i)=>i).find(i=>!used.has(`${shelf}:${i}`));
    if(slot!==undefined){updates.shelfId=shelf;updates.shelfSlot=slot;used.add(`${shelf}:${slot}`);break;}
   }
  }
  if(Object.keys(updates).length)changes.push({updateOne:{filter:{_id:p._id},update:{$set:updates}}});
 }
 if(changes.length)await Product.bulkWrite(changes);
}
async function boot(){
 if(databaseConfigured){
  try{
   await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
   if(await Product.countDocuments()===0){
    // Deterministic IDs make first-start seeding safe with multiple API workers.
    await Product.bulkWrite(seedProducts.map(p=>({updateOne:{filter:{_id:new mongoose.Types.ObjectId(createHash('sha256').update(`suuqverse-seed:${p.name}`).digest('hex').slice(0,24))},update:{$setOnInsert:p},upsert:true}})));
   }
   await upgradeLegacyInventory();
   databaseInitialized=true;mongoReady=true;
   console.log('MongoDB connected; persistent inventory and orders enabled.');
  }catch(e){
   const detail=String(e.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi,'[redacted connection URI]');
   console.error('Database connection failed. Check Atlas access and .env configuration:',detail);
   await mongoose.disconnect();process.exit(1);
  }
 }else if(production){console.error('MONGODB_URI is required in production.');process.exit(1);}
 else console.warn('Demo mode: products and orders reset on API restart.');
 app.listen(PORT,'0.0.0.0',()=>console.log(`API running on port ${PORT}`));
}
boot().catch(e=>{console.error(e.message);process.exit(1);});
