import { db } from '../db.js';

export function logAuditEvent(
  actorName: string,
  action: string,
  entityType: string,
  entityId?: string | number,
  details?: Record<string, any>
) {
  try {
    const now = new Date().toISOString();
    const detailsJson = details ? JSON.stringify(details) : null;
    const stmt = db.prepare(`
      INSERT INTO audit_logs (actor_name, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(actorName, action, entityType, entityId ? String(entityId) : null, detailsJson, now);
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
