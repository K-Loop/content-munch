import { Router, Request, Response } from 'express';
import { getAvailableSlotsForDate, getNowInKolkata } from '../services/availabilityEngine.js';
import { db } from '../db.js';

export const availabilityRouter = Router();

availabilityRouter.get('/', (req: Request, res: Response) => {
  try {
    const { date, duration, serviceId, resourceId, staffId } = req.query;

    if (!date || typeof date !== 'string') {
      const today = getNowInKolkata().dateStr;
      return res.status(400).json({ error: 'Date parameter is required in YYYY-MM-DD format.', today });
    }

    let durationHours = parseFloat(String(duration || '1.0'));
    if (isNaN(durationHours) || durationHours <= 0) {
      durationHours = 1.0;
    }

    // Check service min duration if serviceId provided
    if (serviceId) {
      const sId = parseInt(String(serviceId), 10);
      const service = db.prepare('SELECT min_duration_hours FROM services WHERE id = ?').get(sId) as { min_duration_hours: number } | undefined;
      if (service && service.min_duration_hours > durationHours) {
        durationHours = service.min_duration_hours;
      }
    }

    const rId = resourceId ? parseInt(String(resourceId), 10) : 1;
    const stId = staffId ? parseInt(String(staffId), 10) : undefined;

    const result = getAvailableSlotsForDate(date, durationHours, rId, stId);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to calculate availability' });
  }
});
