import { contentService } from './contentService';

export interface TeleconsultaAuditLog {
  id: string;
  sessionId?: string;
  patientName?: string;
  action: 
    | 'ROOM_CREATED'
    | 'PATIENT_JOINED'
    | 'PATIENT_LEFT'
    | 'PATIENT_RECONNECTED'
    | 'PATIENT_DISCONNECTED'
    | 'PSYCHOLOGIST_JOINED'
    | 'PSYCHOLOGIST_LEFT'
    | 'INVITE_SENT'
    | 'RESCHEDULED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'NO_SHOW'
    | 'TECHNICAL_ISSUE'
    | 'OAUTH_SYNC'
    | 'CALENDAR_SYNC';
  details: string;
  timestamp: number;
  userEmail?: string;
  metadata?: Record<string, any>;
}

class TeleconsultaAuditService {
  async logEvent(params: {
    sessionId?: string;
    patientName?: string;
    action: TeleconsultaAuditLog['action'];
    details: string;
    userEmail?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const log: TeleconsultaAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionId: params.sessionId,
      patientName: params.patientName,
      action: params.action,
      details: params.details,
      timestamp: Date.now(),
      userEmail: params.userEmail || 'psicologo@mentecare.com.br',
      metadata: params.metadata || {}
    };

    try {
      await contentService.saveDocument('teleconsulta_audit', log.id, log);
    } catch (err) {
      console.warn('[TeleconsultaAuditService] Error saving log to Firestore:', err);
      const saved = localStorage.getItem('mentecare_teleconsulta_audit_logs');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('mentecare_teleconsulta_audit_logs', JSON.stringify([log, ...list]));
    }
  }

  async getAuditLogs(sessionId?: string): Promise<TeleconsultaAuditLog[]> {
    try {
      const snap = await contentService.getCollection('teleconsulta_audit');
      if (snap && snap.length > 0) {
        let logs = snap as TeleconsultaAuditLog[];
        if (sessionId) {
          logs = logs.filter(l => l.sessionId === sessionId);
        }
        return logs.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (err) {
      console.warn('[TeleconsultaAuditService] Error reading audit logs:', err);
    }
    const saved = localStorage.getItem('mentecare_teleconsulta_audit_logs');
    const logs: TeleconsultaAuditLog[] = saved ? JSON.parse(saved) : [];
    if (sessionId) {
      return logs.filter(l => l.sessionId === sessionId);
    }
    return logs;
  }
}

export const teleconsultaAuditService = new TeleconsultaAuditService();
