// Simple Express backend for AI STUDIO skeleton
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// Simple file storage (uploads/)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer memory storage then write file to disk
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

// In-memory projects map: replace with DB later
const projects = {};

/**
 * POST /api/upload
 * fields: file (single)
 * returns: { projectId }
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const projectId = uuidv4();
    const fileName = req.file.originalname;
    const objectPath = path.join(UPLOAD_DIR, `${projectId}_${fileName}`);

    // Save file to disk
    fs.writeFileSync(objectPath, req.file.buffer);

    // Create project record (status lifecycle simulated)
    projects[projectId] = {
      id: projectId,
      filename: fileName,
      path: objectPath,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      outputUrl: null
    };

    // Simulate processing job that updates status after intervals
    simulateProcessing(projectId);

    res.json({ projectId });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * GET /api/projects/:id
 * returns project metadata and status
 */
app.get('/api/projects/:id', (req, res) => {
  const id = req.params.id;
  const p = projects[id];
  if (!p) return res.status(404).json({ error: 'Project not found' });
  res.json(p);
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => res.json({ ok: true }));

/**
 * Simulate processing (placeholder for worker queue)
 */
function simulateProcessing(projectId) {
  const p = projects[projectId];
  if (!p) return;
  // after 2s => processing
  setTimeout(() => {
    if (!projects[projectId]) return;
    projects[projectId].status = 'processing';
  }, 2000);

  // after 6s => rendering
  setTimeout(() => {
    if (!projects[projectId]) return;
    projects[projectId].status = 'rendering';
  }, 6000);

  // after 12s => done (set dummy output URL)
  setTimeout(() => {
    if (!projects[projectId]) return;
    projects[projectId].status = 'done';
    projects[projectId].outputUrl = `/downloads/${path.basename(projects[projectId].path)}.mp4`; // placeholder
  }, 12000);
}

// Serve a static download folder for demo outputs (not real video)
app.use('/downloads', express.static(UPLOAD_DIR));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
