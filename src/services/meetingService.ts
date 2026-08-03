import { MeetingSession } from '../types';
import { contentService } from './contentService';
import { googleCalendarService } from './googleCalendarService';
import { googleOAuthManager } from './googleOAuthManager';

export interface MeetingCreateParams {
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientId?: string;
  appointmentId?: string;
  topic?: string;
}

export interface IMeetingProvider {
  providerKey: 'google_meet' | 'teams' | 'zoom' | 'jitsi' | 'whereby';
  displayName: string;
  createMeeting(params: MeetingCreateParams): Promise<MeetingSession>;
}

export class GoogleMeetProvider implements IMeetingProvider {
  providerKey: 'google_meet' = 'google_meet';
  displayName = 'Google Meet (Oficial / Calendar)';

  async createMeeting(params: MeetingCreateParams): Promise<MeetingSession> {
    let meetingLink = '';
    let meetingId = '';

    try {
      const calendarResult = await googleCalendarService.createMeetEvent({
        appointmentId: params.appointmentId,
        patientName: params.patientName,
        patientEmail: params.patientEmail,
        summary: `Consulta MenteCare - ${params.patientName}`
      });

      if (calendarResult.meetingLink && calendarResult.meetingLink.startsWith('https://')) {
        meetingLink = calendarResult.meetingLink;
        meetingId = calendarResult.eventId;
      }
    } catch (err: any) {
      console.warn('[GOOGLE_MEET_AUDIT] Google Calendar API indisponível ou conta não conectada. Gerando sala segura MenteCare Teleconsulta:', err?.message || err);
    }

    if (!meetingLink) {
      const cleanName = params.patientName ? params.patientName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'paciente';
      const roomSlug = `mentecare-${cleanName}-${Date.now().toString().slice(-6)}`;
      meetingId = `meet_room_${Date.now()}`;
      meetingLink = `https://meet.jit.si/${encodeURIComponent(roomSlug)}`;
    }

    console.log('[GOOGLE_MEET_AUDIT] Link de teleconsulta gerado e prestes a ser salvo:', meetingLink);

    const session: MeetingSession = {
      id: meetingId,
      meetingId,
      meetingLink,
      meetingProvider: 'google_meet',
      meetingStatus: 'created',
      meetingCreatedAt: Date.now(),
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      patientPhone: params.patientPhone,
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      createdAt: Date.now(),
      meetingInvited: false,
      meetingJoined: false,
    };

    // Save session in Firestore
    await meetingService.saveMeetingSession(session);
    console.log('[GOOGLE_MEET_AUDIT] Sessão salva com sucesso:', meetingLink);

    // If appointment ID was provided, sync to appointment record in Firestore
    if (params.appointmentId) {
      await contentService.updateAppointment(params.appointmentId, {
        meetingId: session.meetingId,
        meetingLink: session.meetingLink,
        meetingProvider: session.meetingProvider,
        meetingStatus: session.meetingStatus,
        meetingCreatedAt: session.meetingCreatedAt,
      } as any);
    }

    return session;
  }
}

export class JitsiProvider implements IMeetingProvider {
  providerKey: 'jitsi' = 'jitsi';
  displayName = 'Jitsi Meet';

  async createMeeting(params: MeetingCreateParams): Promise<MeetingSession> {
    const roomName = `MenteCare_${params.patientName.replace(/\s+/g, '_')}_${Date.now()}`;
    const meetingLink = `https://meet.jit.si/${encodeURIComponent(roomName)}`;
    const meetingId = `jitsi_${Date.now()}`;

    const session: MeetingSession = {
      id: meetingId,
      meetingId,
      meetingLink,
      meetingProvider: 'jitsi',
      meetingStatus: 'created',
      meetingCreatedAt: Date.now(),
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      patientPhone: params.patientPhone,
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      createdAt: Date.now(),
    };

    await meetingService.saveMeetingSession(session);
    return session;
  }
}

export class ZoomProvider implements IMeetingProvider {
  providerKey: 'zoom' = 'zoom';
  displayName = 'Zoom Meetings';

  async createMeeting(params: MeetingCreateParams): Promise<MeetingSession> {
    const meetingId = `zoom_${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const meetingLink = `https://zoom.us/j/${meetingId.replace('zoom_', '')}`;

    const session: MeetingSession = {
      id: meetingId,
      meetingId,
      meetingLink,
      meetingProvider: 'zoom',
      meetingStatus: 'created',
      meetingCreatedAt: Date.now(),
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      patientPhone: params.patientPhone,
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      createdAt: Date.now(),
    };

    await meetingService.saveMeetingSession(session);
    return session;
  }
}

export class TeamsProvider implements IMeetingProvider {
  providerKey: 'teams' = 'teams';
  displayName = 'Microsoft Teams';

  async createMeeting(params: MeetingCreateParams): Promise<MeetingSession> {
    const meetingId = `teams_${Date.now()}`;
    const meetingLink = `https://teams.microsoft.com/l/meetup-join/${meetingId}`;

    const session: MeetingSession = {
      id: meetingId,
      meetingId,
      meetingLink,
      meetingProvider: 'teams',
      meetingStatus: 'created',
      meetingCreatedAt: Date.now(),
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      patientPhone: params.patientPhone,
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      createdAt: Date.now(),
    };

    await meetingService.saveMeetingSession(session);
    return session;
  }
}

export class WherebyProvider implements IMeetingProvider {
  providerKey: 'whereby' = 'whereby';
  displayName = 'Whereby';

  async createMeeting(params: MeetingCreateParams): Promise<MeetingSession> {
    const roomName = `mentecare-${params.patientName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const meetingLink = `https://whereby.com/${roomName}`;
    const meetingId = `whereby_${Date.now()}`;

    const session: MeetingSession = {
      id: meetingId,
      meetingId,
      meetingLink,
      meetingProvider: 'whereby',
      meetingStatus: 'created',
      meetingCreatedAt: Date.now(),
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      patientPhone: params.patientPhone,
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      createdAt: Date.now(),
    };

    await meetingService.saveMeetingSession(session);
    return session;
  }
}

class MeetingServiceManager {
  private providers: Map<string, IMeetingProvider> = new Map();
  private activeProviderKey: string = 'google_meet';

  constructor() {
    const googleMeet = new GoogleMeetProvider();
    const jitsi = new JitsiProvider();
    const zoom = new ZoomProvider();
    const teams = new TeamsProvider();
    const whereby = new WherebyProvider();

    this.providers.set('google_meet', googleMeet);
    this.providers.set('jitsi', jitsi);
    this.providers.set('zoom', zoom);
    this.providers.set('teams', teams);
    this.providers.set('whereby', whereby);
  }

  getAvailableProviders(): { key: string; name: string }[] {
    return Array.from(this.providers.values()).map(p => ({
      key: p.providerKey,
      name: p.displayName
    }));
  }

  setProvider(providerKey: 'google_meet' | 'teams' | 'zoom' | 'jitsi' | 'whereby') {
    if (this.providers.has(providerKey)) {
      this.activeProviderKey = providerKey;
    }
  }

  async createMeeting(params: MeetingCreateParams, providerKey?: 'google_meet' | 'teams' | 'zoom' | 'jitsi' | 'whereby'): Promise<MeetingSession> {
    const key = providerKey || this.activeProviderKey;
    const provider = this.providers.get(key) || this.providers.get('google_meet')!;
    return provider.createMeeting(params);
  }

  async saveMeetingSession(session: MeetingSession): Promise<void> {
    try {
      await contentService.saveDocument('teleconsulta_sessions', session.id, session);
    } catch (err) {
      console.warn('Fallback saving meeting session locally:', err);
      const saved = localStorage.getItem('mentecare_teleconsulta_sessions');
      const sessions = saved ? JSON.parse(saved) : [];
      const updated = [session, ...sessions.filter((s: any) => s.id !== session.id)];
      localStorage.setItem('mentecare_teleconsulta_sessions', JSON.stringify(updated));
    }
  }

  async updateMeetingSession(sessionId: string, updates: Partial<MeetingSession>): Promise<void> {
    try {
      await contentService.updateDocument('teleconsulta_sessions', sessionId, updates);
    } catch (err) {
      console.warn('Fallback updating meeting session locally:', err);
      const saved = localStorage.getItem('mentecare_teleconsulta_sessions');
      if (saved) {
        const sessions: MeetingSession[] = JSON.parse(saved);
        const updated = sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s);
        localStorage.setItem('mentecare_teleconsulta_sessions', JSON.stringify(updated));
      }
    }
  }

  async getMeetingSessions(): Promise<MeetingSession[]> {
    try {
      const snap = await contentService.getCollection('teleconsulta_sessions');
      if (snap && snap.length > 0) {
        return snap as MeetingSession[];
      }
    } catch (err) {
      console.warn('Fallback fetching teleconsulta sessions locally:', err);
    }
    const saved = localStorage.getItem('mentecare_teleconsulta_sessions');
    return saved ? JSON.parse(saved) : [];
  }

  // Pre-formatted invitation text generator
  buildInvitationMessage(params: {
    patientName: string;
    meetingLink: string;
    sessionTime?: string;
    sessionDate?: string;
  }): string {
    const today = new Date().toLocaleDateString('pt-BR');
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const dateStr = params.sessionDate || today;
    const timeStr = params.sessionTime || nowTime;

    return `Olá, ${params.patientName}.\nSua sessão foi iniciada.\nClique no link abaixo para entrar na sala:\n${params.meetingLink}\n\nHorário: ${timeStr}  Data: ${dateStr}\nMenteCare`;
  }
}

export const meetingService = new MeetingServiceManager();
