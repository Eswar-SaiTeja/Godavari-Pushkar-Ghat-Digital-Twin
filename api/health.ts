import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.end(JSON.stringify({
    status: 'healthy',
    service: 'godavari-twin-ai-serverless',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  }));
}
