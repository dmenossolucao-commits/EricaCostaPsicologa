import { IMeetingProvider, MeetingCreateParams } from './meetingProviderInterface';
import { MeetingSession } from '../../types';
import { googleCalendarService } from '../googleCalendarService';
import { contentService } from '../contentService';

export class GoogleMeetProvider implements IMeetingProvider {
  readonly id = 'google_meet';
  readonly name = 'Google Meet';
  readonly displayName = 'Google Meet (Oficial / Calendar)';

  async createMeeting(params: MeetingCreateParams): Promise<MeetingSession> {
    let meetingLink = '';
    let meetingId = '';
    let isOfficial = false;

    try {
      const calendarResult = await googleCalendarService.createMeetEvent({
        appointmentId: params.appointmentId,
        patientName: params.patientName,
        patientEmail: params.patientEmail,
        summary: `Consulta MenteCare - ${params.patientName}`
      });

      if (calendarResult.meetingLink && calendarResult.meetingLink.startsWith('https://')) {
        meetingId = calendarResult.eventId;
        meetingLink = calendarResult.meetingLink;
        isOfficial = true;
      }
    } catch (err: any) {
      console.warn('[GOOGLE_MEET_AUDIT] Google Calendar API error, using secure fallback room:', err?.message || err);
    }

    if (!meetingLink) {
      const cleanName = params.patientName ? params.patientName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'paciente';
      const roomSlug = `mentecare-${cleanName}-${Date.now().toString().slice(-6)}`;
      meetingId = `meet_room_${Date.now()}`;
      meetingLink = `https://meet.jit.si/${encodeURIComponent(roomSlug)}`;
    }

    console.log('[GOOGLE_MEET_AUDIT] Link retornado e prestes a ser salvo:', meetingLink);

    const session: MeetingSession = {
      id: meetingId,
      meetingId: meetingId,
      meetingLink: meetingLink,
      meetingProvider: 'google_meet',
      meetingStatus: 'created',
      meetingCreatedAt: Date.now(),
      patientName: params.patientName,
      patientEmail: params.patientEmail,
      patientPhone: params.patientPhone,
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      createdAt: Date.now(),
    };

    // Save session in Firestore under teleconsulta_sessions
    try {
      await contentService.saveDocument('teleconsulta_sessions', session.id, {
        ...session,
        isOfficialApi: isOfficial,
        updatedAt: Date.now()
      });
      console.log('[GOOGLE_MEET_AUDIT] Reunião salva com sucesso no Firestore:', session.id, 'com link:', meetingLink);
    } catch (err) {
      console.warn('[GOOGLE_MEET_AUDIT] Aviso ao salvar reunião no Firestore:', err);
    }

    return session;
  }

  async cancelMeeting(meetingId: string): Promise<boolean> {
    return googleCalendarService.cancelMeetEvent(meetingId);
  }

  getMeetingUrl(meetingId: string): string {
    if (meetingId && meetingId.startsWith('http')) {
      return meetingId;
    }
    return '';
  }
}

export const googleMeetProvider = new GoogleMeetProvider();
