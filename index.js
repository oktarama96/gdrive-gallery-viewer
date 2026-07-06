const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files under /gallery path
app.use('/gallery', express.static(path.join(__dirname, 'public')));

// Also handle the API under /gallery
app.get('/gallery/api/photos', async (req, res) => {
  const { folderId, gasUrl } = req.query;

  if (!folderId || !gasUrl) {
    return res.status(400).json({ error: 'Folder ID and Apps Script URL are required' });
  }

  try {
    const response = await axios.get(`${gasUrl}?id=${folderId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from GAS:', error.message);
    res.status(500).json({ error: 'Failed to fetch photos from Google Drive.' });
  }
});

// Proxy media content to avoid CORS and third-party cookie restrictions (works on mobile & incognito)
app.get('/gallery/api/media/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const { gasUrl, size } = req.query;

  if (!fileId || !gasUrl) {
    return res.status(400).send('Missing fileId or gasUrl');
  }

  try {
    const sizeParam = size ? `&size=${size}` : '';
    const response = await axios.get(`${gasUrl}?fileId=${fileId}${sizeParam}`);
    const data = response.data;

    if (typeof data === 'string' && data.startsWith('Error:')) {
      return res.status(500).send(data);
    }

    const buffer = Buffer.from(data, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(buffer);
  } catch (error) {
    console.error('Error proxying media:', error.message);
    res.status(500).send('Failed to fetch media');
  }
});

// Redirect root to /gallery for convenience
app.get('/', (req, res) => {
  res.redirect('/gallery');
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gallery server running at http://0.0.0.0:${PORT}/gallery`);
  });
}

module.exports = app;
