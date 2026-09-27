// backend/controllers/urlController.js
import { storageService } from '../services/storageService.js';
import { getDbStatus } from '../config/db.js';

const RESERVED_CODES = new Set([
  'analytics', 'shorten', 'health', 'status', 'api', 'links', 
  'favicon.ico', 'robots.txt', 'dashboard', 'admin'
]);

// Helper to sanitize and normalize long URL
function normalizeUrl(input) {
  let url = (input || '').trim();
  if (!url) return null;
  // If protocol is missing, default to https://
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

// Generate friendly 6-char random alphanumeric code
function generateSlug(length = 6) {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// 1. Create Short URL
export const createShortUrl = async (req, res) => {
  try {
    const { longUrl, customCode } = req.body;
    
    if (!longUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const validatedUrl = normalizeUrl(longUrl);
    if (!validatedUrl) {
      return res.status(400).json({ 
        error: 'Please enter a valid website address (e.g. https://example.com or github.com)' 
      });
    }

    let shortCode = '';

    if (customCode && customCode.trim()) {
      const code = customCode.trim();
      // Validate custom code
      if (!/^[a-zA-Z0-9-_]{3,30}$/.test(code)) {
        return res.status(400).json({ 
          error: 'Custom alias must be 3-30 characters (letters, numbers, hyphens, and underscores only).' 
        });
      }
      if (RESERVED_CODES.has(code.toLowerCase())) {
        return res.status(400).json({ 
          error: `The alias "${code}" is reserved for system use. Please choose another one.` 
        });
      }
      const isTaken = await storageService.codeExists(code);
      if (isTaken) {
        return res.status(409).json({ 
          error: `The alias "${code}" is already taken. Please choose another one.` 
        });
      }
      shortCode = code;
    } else {
      // Generate unique short code
      let attempts = 0;
      do {
        shortCode = generateSlug(6);
        attempts++;
      } while ((await storageService.codeExists(shortCode)) && attempts < 10);
    }

    const newUrl = await storageService.create({
      originalUrl: validatedUrl,
      shortCode
    });

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const fullShortUrl = `${protocol}://${host}/${shortCode}`;

    res.status(201).json({
      message: 'Short URL created successfully',
      data: newUrl,
      shortUrl: fullShortUrl
    });
  } catch (err) {
    console.error('Error creating short URL:', err);
    res.status(500).json({ error: 'Internal server error while shortening URL' });
  }
};

// 2. Redirect and Track Clicks
export const redirectToOriginal = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code === 'favicon.ico') {
      return res.status(204).end();
    }

    const url = await storageService.findByCode(code);

    if (!url) {
      return res.status(404).send(renderErrorPage({
        code: 404,
        title: 'Short Link Not Found',
        message: `The short link with code "<strong>${escapeHtml(code)}</strong>" does not exist or has expired.`,
        icon: '🔍'
      }));
    }

    if (!url.isActive) {
      return res.status(403).send(renderErrorPage({
        code: 403,
        title: 'Link Currently Inactive',
        message: `This short link (<strong>${escapeHtml(code)}</strong>) has been paused or disabled by its owner.`,
        icon: '⏸️'
      }));
    }

    // Increment clicks and record access time asynchronously
    storageService.recordClick(code).catch(e => console.error('Failed to update clicks:', e));

    return res.redirect(url.originalUrl);
  } catch (err) {
    console.error('Error in redirection:', err);
    res.status(500).send(renderErrorPage({
      code: 500,
      title: 'Redirection Error',
      message: 'An unexpected server error occurred while processing this redirect.',
      icon: '⚠️'
    }));
  }
};

// 3. Get All Links and Analytics
export const getAnalytics = async (req, res) => {
  try {
    const urls = await storageService.getAll();
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
      storage: getDbStatus()
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: err.message });
  }
};

// 4. Toggle Link Status (Active / Paused)
export const toggleLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await storageService.toggleActive(id);
    if (!updated) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ message: 'Link status updated', data: updated });
  } catch (err) {
    console.error('Error toggling link status:', err);
    res.status(500).json({ error: err.message });
  }
};

// 5. Delete Link
export const deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storageService.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ message: 'Link deleted successfully', id });
  } catch (err) {
    console.error('Error deleting link:', err);
    res.status(500).json({ error: err.message });
  }
};

// 6. System Health & Storage Info
export const getHealth = (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    storage: getDbStatus()
  });
};

// Helper: Escape HTML to prevent XSS
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

// Helper: Modern styled error page
function renderErrorPage({ code, title, message, icon }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${code} - ${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 0%, #1e1b4b, #0f172a 70%);
      color: #f8fafc;
      padding: 24px;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 48px 36px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
      display: inline-block;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      margin-bottom: 16px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s ease;
      box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 20px -3px rgba(99, 102, 241, 0.45);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <div class="badge">HTTP ${code}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="http://localhost:5173" class="btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      Return to URL Shortener
    </a>
  </div>
</body>
</html>`;
}