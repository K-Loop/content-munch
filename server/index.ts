import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './db.js';
import { publicRouter } from './routes/public.js';
import { availabilityRouter } from './routes/availability.js';
import { bookingsRouter } from './routes/bookings.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database schema and authoritative seeds
initDatabase();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/public', publicRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    studio: 'Content Munch Studio by Social Angadi',
    timezone: 'Asia/Kolkata',
    timestamp: new Date().toISOString()
  });
});

// Production: serve built frontend SPA
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// For SPA routing fallback (HTML5 history API)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // If dist hasn't been built yet during dev
      res.status(200).send('Content Munch Studio API is running. Build frontend or run `npm run dev` to view web application.');
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Content Munch Studio backend server listening on http://localhost:${PORT}`);
  });
}

export default app;
