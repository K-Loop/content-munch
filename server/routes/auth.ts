import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, authenticateAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../services/auditLogger.js';

export const authRouter = Router();

// Login
authRouter.post('/login', (req, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim()) as {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: 'owner' | 'admin' | 'booking_manager';
  } | undefined;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Issue token valid for 7 days
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logAuditEvent(user.name, 'LOGIN', 'users', user.id, { email: user.email, role: user.role });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Current User Profile
authRouter.get('/me', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// Change Password
authRouter.post('/change-password', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as { password_hash: string };
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user!.id);

  logAuditEvent(req.user!.name, 'PASSWORD_CHANGE', 'users', req.user!.id);
  return res.json({ message: 'Password updated successfully.' });
});
