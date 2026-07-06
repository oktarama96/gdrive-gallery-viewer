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
