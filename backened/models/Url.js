// backend/models/Url.js
import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  totalClicks: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastAccess: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Url', urlSchema);