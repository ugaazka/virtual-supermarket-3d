import 'dotenv/config';
import mongoose from 'mongoose';
try {
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
 const ping=await mongoose.connection.db.command({ping:1});
 console.log(JSON.stringify({connected:ping.ok===1,database:mongoose.connection.name,products:await mongoose.connection.db.collection('products').countDocuments(),orders:await mongoose.connection.db.collection('orders').countDocuments()}));
} catch(error) {
 console.error('Database connection failed:',String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi,'[redacted connection URI]'));
 process.exitCode=1;
} finally {await mongoose.disconnect();}
