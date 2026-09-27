// backend/services/storageService.js
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import Url from '../models/Url.js';
import { getDbStatus } from '../config/db.js';

const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'urls.json');

// Ensure local storage directory and file exist
async function initFileStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing local file store:', err);
  }
}

initFileStore();

async function readLocalUrls() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalUrls(urls) {
  await fs.writeFile(DATA_FILE, JSON.stringify(urls, null, 2), 'utf-8');
}

export const storageService = {
  async getAll() {
    if (getDbStatus().connected) {
      return await Url.find().sort({ createdAt: -1 });
    }
    const urls = await readLocalUrls();
    return urls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findByCode(code) {
    if (getDbStatus().connected) {
      return await Url.findOne({ shortCode: code });
    }
    const urls = await readLocalUrls();
    return urls.find(u => u.shortCode.toLowerCase() === code.toLowerCase()) || null;
  },

  async findById(id) {
    if (getDbStatus().connected) {
      try {
        return await Url.findById(id);
      } catch {
        return null;
      }
    }
    const urls = await readLocalUrls();
    return urls.find(u => u._id === id || u.id === id) || null;
  },

  async codeExists(code) {
    if (getDbStatus().connected) {
      const existing = await Url.findOne({ shortCode: code });
      return !!existing;
    }
    const urls = await readLocalUrls();
    return urls.some(u => u.shortCode.toLowerCase() === code.toLowerCase());
  },

  async create({ originalUrl, shortCode }) {
    if (getDbStatus().connected) {
      const newUrl = new Url({
        originalUrl,
        shortCode,
        totalClicks: 0,
        isActive: true,
        lastAccess: null,
        createdAt: new Date()
      });
      return await newUrl.save();
    }

    const urls = await readLocalUrls();
    const newEntry = {
      _id: crypto.randomUUID(),
      originalUrl,
      shortCode,
      totalClicks: 0,
      isActive: true,
      lastAccess: null,
      createdAt: new Date().toISOString()
    };
    urls.unshift(newEntry);
    await writeLocalUrls(urls);
    return newEntry;
  },

  async recordClick(code) {
    if (getDbStatus().connected) {
      const url = await Url.findOne({ shortCode: code });
      if (!url) return null;
      url.totalClicks += 1;
      url.lastAccess = new Date();
      await url.save();
      return url;
    }

    const urls = await readLocalUrls();
    const index = urls.findIndex(u => u.shortCode.toLowerCase() === code.toLowerCase());
    if (index === -1) return null;

    urls[index].totalClicks = (urls[index].totalClicks || 0) + 1;
    urls[index].lastAccess = new Date().toISOString();
    await writeLocalUrls(urls);
    return urls[index];
  },

  async toggleActive(id) {
    if (getDbStatus().connected) {
      const url = await Url.findById(id);
      if (!url) return null;
      url.isActive = !url.isActive;
      await url.save();
      return url;
    }

    const urls = await readLocalUrls();
    const index = urls.findIndex(u => u._id === id || u.id === id);
    if (index === -1) return null;

    urls[index].isActive = !urls[index].isActive;
    await writeLocalUrls(urls);
    return urls[index];
  },

  async delete(id) {
    if (getDbStatus().connected) {
      const result = await Url.findByIdAndDelete(id);
      return !!result;
    }

    const urls = await readLocalUrls();
    const filtered = urls.filter(u => u._id !== id && u.id !== id);
    const deleted = filtered.length !== urls.length;
    if (deleted) {
      await writeLocalUrls(filtered);
    }
    return deleted;
  }
};
