// backend/config/db.js
import mongoose from 'mongoose';
import dns from 'dns';

// Fix Node.js on Windows querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if custom dns server cannot be set
}

let isMongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.includes('<db_password>') || uri.includes('<password>')) {
    console.log('\n-------------------------------------------------------------');
    console.log('⚠️  [DATABASE NOTICE]: MongoDB URI has placeholder <db_password>.');
    console.log('📦  Running with Resilient Local File Storage (data/urls.json).');
    console.log('💡  To connect MongoDB Atlas, update backened/.env with your password.');
    console.log('-------------------------------------------------------------\n');
    isMongoConnected = false;
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    });
    isMongoConnected = true;
    console.log('\n✅  [DATABASE]: MongoDB Atlas Connected Successfully!\n');
    return true;
  } catch (error) {
    console.warn(`\n⚠️  [DATABASE NOTICE]: Could not connect to MongoDB Atlas (${error.message}).`);
    console.log('📦  Running with Resilient Local File Storage (data/urls.json). The app remains 100% functional!');
    console.log('-------------------------------------------------------------\n');
    isMongoConnected = false;
    return false;
  }
};

export const getDbStatus = () => ({
  connected: isMongoConnected,
  type: isMongoConnected ? 'MongoDB Atlas' : 'Local Persistent Storage'
});