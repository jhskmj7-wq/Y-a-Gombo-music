import { app } from '../server';

export default function handler(req: any, res: any) {
  try {
    // Normalizing route path for Express when invoked via Vercel serverless
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
    }
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Catch-All Error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Erreur serveur Vercel Catch-All."
    });
  }
}
