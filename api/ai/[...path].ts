/**
 * Vercel Serverless Function Adapter for AI Backend
 * Mounts /api/ai/* on Vercel's serverless edge/Node runtime.
 * Keeps GEMINI_API_KEY secure in Vercel Project Environment Variables.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { handleAIRequest } from '../../server/aiServerRouter';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleAIRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `AI endpoint not found: ${req.url}` }));
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Serverless Execution Error', message: err.message }));
  }
}
