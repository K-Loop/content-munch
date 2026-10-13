import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { calculateBookingPrice } from '../services/pricingEngine.js';

export const publicRouter = Router();

// GET /api/public/config - Authoritative public studio configuration
publicRouter.get('/config', (req: Request, res: Response) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC').all();
    const addons = db.prepare('SELECT * FROM addons WHERE is_active = 1 ORDER BY id ASC').all();
    const operatingHours = db.prepare('SELECT * FROM operating_hours ORDER BY day_of_week ASC').all();
    
    const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    const resources = db.prepare('SELECT id, name, description, capacity FROM resources WHERE is_active = 1').all();

    return res.json({
      services,
      addons,
      operatingHours,
      settings,
      resources,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch studio configuration' });
  }
});

// POST /api/public/quote - Instant live price quote calculation
publicRouter.post('/quote', (req: Request, res: Response) => {
  try {
    const { serviceId, durationHours, addonIds } = req.body;
    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    const duration = parseFloat(String(durationHours || '1.0'));
    const addons = Array.isArray(addonIds) ? addonIds.map(Number) : [];

    const quote = calculateBookingPrice(Number(serviceId), duration, addons);
    return res.json(quote);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to calculate quote' });
  }
});
