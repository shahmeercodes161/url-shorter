// frontend/api/index.js (Vercel Serverless Function)
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// DNS fix for Windows/Atlas SRV lookup
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore
}

// In-memory fallback if MongoDB connection is pending or offline
let inMemoryUrls = [];

// Mongoose Schema & Model
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  totalClicks: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastAccess: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);

// Cache database connection across serverless invocations
let isConnecting = false;
async function ensureDbConnected() {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('<db_password>') || uri.includes('<password>')) {
    return false;
  }
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (isConnecting) return false;

  try {
    isConnecting = true;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Atlas on Vercel!');
    return true;
  } catch (err) {
    console.warn('⚠️ Atlas connection error:', err.message);
    return false;
  } finally {
    isConnecting = false;
  }
}

// Helper to normalize URL
function normalizeUrl(input) {
  let url = (input || '').trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

// Helper to generate friendly slug
function generateSlug(length = 6) {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

const RESERVED = new Set(['analytics', 'shorten', 'health', 'status', 'api', 'links', 'favicon.ico', 'robots.txt']);

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await ensureDbConnected();
  next();
});

// Health / Status
const handleHealth = (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    storage: {
      connected: isConnected,
      type: isConnected ? 'MongoDB Atlas' : 'In-Memory / Fallback'
    }
  });
};

app.get('/health', handleHealth);
app.get('/status', handleHealth);
app.get('/api/health', handleHealth);
app.get('/api/status', handleHealth);

// Analytics / All links
const handleAnalytics = async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  try {
    let urls = [];
    if (isConnected) {
      urls = await Url.find().sort({ createdAt: -1 });
    } else {
      urls = inMemoryUrls;
    }

    const totalClicks = urls.reduce((sum, u) => sum + (u.totalClicks || 0), 0);
    const activeLinks = urls.filter(u => u.isActive).length;

    res.json({
      links: urls,
      stats: {
        totalLinks: urls.length,
        totalClicks,
        activeLinks,
        disabledLinks: urls.length - activeLinks
      },
      storage: {
        connected: isConnected,
        type: isConnected ? 'MongoDB Atlas' : 'Local / In-Memory Fallback'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/analytics', handleAnalytics);
app.get('/api/analytics', handleAnalytics);

// Shorten URL
const handleShorten = async (req, res) => {
  try {
    const { longUrl, customCode } = req.body;
    if (!longUrl) return res.status(400).json({ error: 'URL is required' });

    const validatedUrl = normalizeUrl(longUrl);
    if (!validatedUrl) {
      return res.status(400).json({ error: 'Please enter a valid website address (e.g. https://google.com)' });
    }

    const isConnected = mongoose.connection.readyState === 1;
    let shortCode = '';

    if (customCode && customCode.trim()) {
      const code = customCode.trim();
      if (!/^[a-zA-Z0-9-_]{3,30}$/.test(code)) {
        return res.status(400).json({ error: 'Custom alias must be 3-30 characters with letters, numbers, hyphens, or underscores only.' });
      }
      if (RESERVED.has(code.toLowerCase())) {
        return res.status(400).json({ error: `The alias "${code}" is reserved for system use.` });
      }

      if (isConnected) {
        const taken = await Url.findOne({ shortCode: code });
        if (taken) return res.status(409).json({ error: `The alias "${code}" is already taken.` });
      }
      shortCode = code;
    } else {
      let attempts = 0;
      do {
        shortCode = generateSlug(6);
        attempts++;
      } while (isConnected && (await Url.findOne({ shortCode })) && attempts < 10);
    }

    let saved;
    if (isConnected) {
      saved = await Url.create({
        originalUrl: validatedUrl,
        shortCode,
        totalClicks: 0,
        isActive: true,
        createdAt: new Date()
      });
    } else {
      saved = {
        _id: 'mem_' + Date.now(),
        originalUrl: validatedUrl,
        shortCode,
        totalClicks: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      inMemoryUrls.unshift(saved);
    }

    const host = req.get('host') || 'localhost';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const fullShortUrl = `${protocol}://${host}/${shortCode}`;

    res.status(201).json({
      message: 'Short URL created successfully',
      data: saved,
      shortUrl: fullShortUrl
    });
  } catch (err) {
    console.error('Shorten error:', err);
    res.status(500).json({ error: 'Internal server error while shortening URL' });
  }
};

app.post('/shorten', handleShorten);
app.post('/api/shorten', handleShorten);

// Toggle link
const handleToggle = async (req, res) => {
  const { id } = req.params;
  const isConnected = mongoose.connection.readyState === 1;
  try {
    if (isConnected) {
      const url = await Url.findById(id);
      if (!url) return res.status(404).json({ error: 'Link not found' });
      url.isActive = !url.isActive;
      await url.save();
      return res.json({ message: 'Status updated', data: url });
    }

    const item = inMemoryUrls.find(u => u._id === id);
    if (!item) return res.status(404).json({ error: 'Link not found' });
    item.isActive = !item.isActive;
    return res.json({ message: 'Status updated', data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.patch('/links/:id/toggle', handleToggle);
app.patch('/api/links/:id/toggle', handleToggle);

// Delete link
const handleDelete = async (req, res) => {
  const { id } = req.params;
  const isConnected = mongoose.connection.readyState === 1;
  try {
    if (isConnected) {
      const result = await Url.findByIdAndDelete(id);
      if (!result) return res.status(404).json({ error: 'Link not found' });
      return res.json({ message: 'Link deleted successfully', id });
    }

    const initialLen = inMemoryUrls.length;
    inMemoryUrls = inMemoryUrls.filter(u => u._id !== id);
    if (inMemoryUrls.length === initialLen) return res.status(404).json({ error: 'Link not found' });
    return res.json({ message: 'Link deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.delete('/links/:id', handleDelete);
app.delete('/api/links/:id', handleDelete);

// Redirection handler (GET /:code)
const handleRedirect = async (req, res) => {
  const code = req.params.code || req.query.code;
  if (!code || code === 'favicon.ico') return res.status(204).end();

  const isConnected = mongoose.connection.readyState === 1;
  try {
    let url = null;
    if (isConnected) {
      url = await Url.findOne({ shortCode: code });
    } else {
      url = inMemoryUrls.find(u => u.shortCode.toLowerCase() === code.toLowerCase());
    }

    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>404 - Link Not Found</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#f8fafc;">
          <h1>🔍 404 - Link Not Found</h1>
          <p>The short link <strong>/${code}</strong> does not exist or has expired.</p>
          <a href="/" style="color:#6366f1;text-decoration:none;">Go to Homepage &rarr;</a>
        </body>
        </html>
      `);
    }

    if (!url.isActive) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head><title>403 - Link Paused</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#f8fafc;">
          <h1>⏸️ Link Paused</h1>
          <p>This short link is currently paused by its owner.</p>
          <a href="/" style="color:#6366f1;text-decoration:none;">Go to Homepage &rarr;</a>
        </body>
        </html>
      `);
    }

    // Increment click count asynchronously
    if (isConnected) {
      Url.findByIdAndUpdate(url._id, { $inc: { totalClicks: 1 }, lastAccess: new Date() }).exec().catch(() => {});
    } else {
      url.totalClicks = (url.totalClicks || 0) + 1;
      url.lastAccess = new Date().toISOString();
    }

    return res.redirect(url.originalUrl);
  } catch (err) {
    res.status(500).send('Redirection error');
  }
};

app.get('/:code', handleRedirect);
app.get('/api/:code', handleRedirect);

// Export for Vercel Serverless Function
export default app;
