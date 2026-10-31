import 'dotenv/config';
import mongoose from 'mongoose';
import {writeFile,mkdir} from 'node:fs/promises';
import {seedProducts} from '../server/seed.js';
try{
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
 const db=mongoose.connection.db,groups=[];
 for(const seed of seedProducts){
  const copies=await db.collection('products').find(seed,{projection:{_id:1,name:1,stock:1,price:1,createdAt:1}}).sort({createdAt:1,_id:1}).toArray();
  if(copies.length>1){const ids=copies.map(p=>String(p._id));const linkedOrders=await db.collection('orders').countDocuments({'items.productId':{$in:ids}});groups.push({name:seed.name,exactUntouchedCopies:copies,linkedOrders});}
 }
 const report={database:mongoose.connection.name,products:await db.collection('products').countDocuments(),orders:await db.collection('orders').countDocuments(),duplicateGroups:groups.length,extraUntouchedSeedCopies:groups.reduce((n,g)=>n+g.exactUntouchedCopies.length-1,0),groups};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/database-inventory-audit.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({database:report.database,products:report.products,orders:report.orders,duplicateGroups:report.duplicateGroups,extraUntouchedSeedCopies:report.extraUntouchedSeedCopies,linkedOrders:groups.reduce((n,g)=>n+g.linkedOrders,0),report:'artifacts/database-inventory-audit.json',databaseWrites:0}));
}catch(error){console.error('Read-only inventory inspection failed:',String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi,'[redacted connection URI]'));process.exitCode=1;}
finally{await mongoose.disconnect();}
