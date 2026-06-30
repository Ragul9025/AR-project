const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Configuration (uses environment variables with local fallbacks)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ragul@2510$';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'aura-admin-secure-token-2026';

const useVercelKV = !!process.env.KV_URL;
const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

let kv;
if (useVercelKV) {
  kv = require('@vercel/kv').kv;
}

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Local-only: Ensure directories exist
if (!useVercelBlob) {
  const dirs = [
    path.join(__dirname, '..', 'data'),
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', 'public', 'uploads'),
    path.join(__dirname, '..', 'public', 'uploads', 'images'),
    path.join(__dirname, '..', 'public', 'uploads', 'videos'),
    path.join(__dirname, '..', 'public', 'uploads', 'targets')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

const ARTWORKS_FILE = path.join(__dirname, '..', 'data', 'artworks.json');

// Helper to get all artworks
async function getArtworks() {
  if (useVercelKV) {
    try {
      const data = await kv.get('artworks');
      return data || [];
    } catch (err) {
      console.error("Error reading from Vercel KV, falling back to empty array:", err);
      return [];
    }
  } else {
    try {
      if (!fs.existsSync(ARTWORKS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(ARTWORKS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading from local file:", err);
      return [];
    }
  }
}

// Helper to save all artworks
async function saveArtworks(artworks) {
  if (useVercelKV) {
    await kv.set('artworks', artworks);
  } else {
    const dataDir = path.dirname(ARTWORKS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(ARTWORKS_FILE, JSON.stringify(artworks, null, 2));
  }
}

// Helper to generate a 4-character short code
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Seed sample data if empty
async function seedSampleData() {
  let artworks = await getArtworks();
  if (artworks.length === 0) {
    const defaultArtworks = [
      {
        id: 'sample-artwork',
        code: 'PORT',
        title: 'Cyberpunk Portal (Sample)',
        artist: 'MindAR Team & Blender',
        description: 'A beautiful demo showcasing a futuristic portal. Scan the sample card to see the video play in augmented reality!',
        imageUrl: 'https://raw.githubusercontent.com/hiukim/mind-ar-js/master/examples/image-tracking/assets/card-example/card.png',
        targetUrl: 'https://raw.githubusercontent.com/hiukim/mind-ar-js/master/examples/image-tracking/assets/card-example/card.mind',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        createdAt: new Date().toISOString()
      }
    ];
    await saveArtworks(defaultArtworks);
    console.log('Seeded default artwork in database.');
  }
}

// Seeding middleware for Serverless environment (runs once per cold start)
let seeded = false;
app.use(async (req, res, next) => {
  if (!seeded) {
    try {
      await seedSampleData();
      seeded = true;
    } catch (err) {
      console.error("Seeding failed:", err);
    }
  }
  next();
});

// Multer memory storage configuration (for both local and cloud uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
    } else if (file.fieldname === 'video') {
      if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Only video files are allowed!'), false);
      }
    } else if (file.fieldname === 'target') {
      if (!file.originalname.endsWith('.mind')) {
        return cb(new Error('Target must be a .mind file!'), false);
      }
    }
    cb(null, true);
  }
});

// Helper to upload a file (either to Vercel Blob or local disk)
async function uploadFile(file, folderName) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = uniqueSuffix + path.extname(file.originalname);

  if (useVercelBlob) {
    const { put } = require('@vercel/blob');
    const blob = await put(`uploads/${folderName}/${filename}`, file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return blob.url;
  } else {
    const destDir = path.join(__dirname, '..', 'public', 'uploads', folderName);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, filename);
    fs.writeFileSync(destPath, file.buffer);
    return `/uploads/${folderName}/${filename}`;
  }
}

// Helper to delete a file safely
async function deleteFile(url) {
  if (!url) return;

  if (useVercelBlob) {
    if (!url.includes('public.blob.vercel-storage.com')) return;
    const { del } = require('@vercel/blob');
    try {
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (err) {
      console.error(`Failed to delete blob: ${url}`, err);
    }
  } else {
    if (url.startsWith('http')) return; // Don't delete external URLs
    const absolutePath = path.join(__dirname, '..', 'public', url);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }
}

// Middleware to protect admin routes
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
  }
  next();
}

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API: Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect password.' });
  }
});

// API: Get all artworks
app.get('/api/artworks', async (req, res) => {
  try {
    const artworks = await getArtworks();
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read artworks database.' });
  }
});

// API: Get specific artwork by ID
app.get('/api/artworks/:id', async (req, res) => {
  try {
    const artworks = await getArtworks();
    const artwork = artworks.find(item => item.id === req.params.id);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found.' });
    }
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artwork.' });
  }
});

// API: Get specific artwork by short-code
app.get('/api/artworks/code/:code', async (req, res) => {
  try {
    const artworks = await getArtworks();
    const artwork = artworks.find(item => item.code === req.params.code.toUpperCase());
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found.' });
    }
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artwork.' });
  }
});

// API: Upload a single file (Protected)
app.post('/api/upload', requireAdminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const type = req.query.type || 'temp'; // 'images', 'targets', 'videos'
    const fileUrl = await uploadFile(req.file, type);
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed.' });
  }
});

// API: Add new artwork (Protected, JSON payload)
app.post('/api/artworks', requireAdminAuth, async (req, res) => {
  try {
    const { title, artist, description, imageUrl, targetUrl, videoUrl } = req.body;

    if (!title || !artist || !description || !imageUrl || !targetUrl || !videoUrl) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    let artworks = await getArtworks();

    // Ensure unique short code
    let code = generateShortCode();
    while (artworks.some(art => art.code === code)) {
      code = generateShortCode();
    }

    const newArtwork = {
      id: Date.now().toString(),
      code: code,
      title,
      artist,
      description,
      imageUrl,
      targetUrl,
      videoUrl,
      createdAt: new Date().toISOString()
    };

    artworks.push(newArtwork);
    await saveArtworks(artworks);

    res.status(201).json(newArtwork);
  } catch (error) {
    console.error('Error adding artwork:', error);
    res.status(500).json({ error: error.message || 'Failed to save artwork.' });
  }
});

// API: Delete artwork (Protected)
app.delete('/api/artworks/:id', requireAdminAuth, async (req, res) => {
  try {
    let artworks = await getArtworks();
    const index = artworks.findIndex(item => item.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Artwork not found.' });
    }

    const artwork = artworks[index];

    // Delete associated files
    await deleteFile(artwork.imageUrl);
    await deleteFile(artwork.videoUrl);
    await deleteFile(artwork.targetUrl);

    // Remove from array
    artworks.splice(index, 1);
    await saveArtworks(artworks);

    res.json({ success: true, message: 'Artwork deleted successfully.' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork.' });
  }
});

// Serve frontend routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start local server if run directly (not under Vercel serverless)
if (require.main === module || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  Artivive-like WebAR Server running locally!`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}

module.exports = app;
