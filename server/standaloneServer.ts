/**
 * Standalone Production AI Server
 * Godavari Pushkar Ghat 3D Digital Twin - Rajamahendravaram
 * 
 * Provides independent server runtime outside Vite development mode.
 * Mounts secure server-side Gemini AI API routes on /api/ai/*
 * Serves production static client assets from dist/
 * Never exposes secret GEMINI_API_KEY to browser clients.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { handleAIRequest } from './aiServerRouter';

const PORT = parseInt(process.env.PORT || '5174', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';

  // 1. Route AI API Requests through Secure Server Router
  if (url.startsWith('/api/ai')) {
    const handled = await handleAIRequest(req, res);
    if (handled) return;
  }

  // 2. Serve Static Production Files if dist exists
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, url.split('?')[0]);
    if (url === '/' || !path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // 3. Fallback Response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    service: 'Godavari Pushkar Ghat 3D Digital Twin AI Server',
    status: 'ONLINE',
    version: '2.5.0',
    endpoints: [
      'GET  /api/ai/health',
      'POST /api/ai/command',
      'POST /api/ai/predict-crowd',
      'POST /api/ai/detect-anomalies',
      'POST /api/ai/evacuation-advice',
      'POST /api/ai/resource-allocation',
      'POST /api/ai/flood-intelligence',
      'POST /api/ai/generate-report',
      'POST /api/ai/generate-announcement',
      'POST /api/ai/approve-action'
    ],
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, HOST, () => {
  console.log(`[Godavari AI Server] Listening on http://${HOST}:${PORT}`);
  console.log(`[Godavari AI Server] Gemini Provider: ${process.env.GEMINI_API_KEY ? 'CONFIGURED (Active)' : 'MOCK / DEMO MODE'}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

export default server;
