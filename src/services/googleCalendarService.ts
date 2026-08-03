import { googleOAuthManager } from './googleOAuthManager';

export interface CreateMeetEventParams {
  appointmentId?: string;
  patientName: string;
  patientEmail?: string;
  startDateTime?: string | Date;
  endDateTime?: string | Date;
  summary?: string;
  description?: string;
}

export interface CalendarEventResponse {
  eventId: string;
  meetingLink: string;
  status: 'confirmed' | 'cancelled' | 'tentative';
  isOfficialApi: boolean;
  htmlLink?: string;
  conferenceData?: any;
  hangoutLink?: string;
}

export class GoogleCalendarService {
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  /**
   * Creates an official Google Calendar Event with Google Meet video conference
   */
  public async createMeetEvent(params: CreateMeetEventParams): Promise<CalendarEventResponse> {
    const accessToken = await googleOAuthManager.getValidAccessToken();

    const startDate = params.startDateTime ? new Date(params.startDateTime) : new Date();
    const endDate = params.endDateTime
      ? new Date(params.endDateTime)
      : new Date(startDate.getTime() + 50 * 60 * 1000); // 50 min default session

    if (!accessToken) {
      console.warn('[GOOGLE_MEET_AUDIT] Token de acesso do Google OAuth não encontrado. A API do Google Calendar requer que a conta Google esteja conectada.');
      throw new Error('Conta Google não conectada ou sessão expirada. Conecte a integração com o Google Calendar nas configurações para gerar eventos no Google Calendar.');
    }

    const payload = {
      summary: params.summary || `Atendimento Psicológico - ${params.patientName}`,
      description: params.description || `Consulta online agendada via MenteCare Prontuário Eletrônico.`,
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
      attendees: params.patientEmail ? [{ email: params.patientEmail }] : [],
      conferenceData: {
        createRequest: {
          requestId: `mc-${params.appointmentId || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    console.log('[GOOGLE_MEET_AUDIT] 1. Payload enviado ao Google Calendar API:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${this.CALENDAR_API_BASE}?conferenceDataVersion=1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('[GOOGLE_MEET_AUDIT] 2. HTTP Status:', response.status);

      const responseText = await response.text();
      let eventData: any = null;
      try {
        eventData = JSON.parse(responseText);
      } catch {
        eventData = responseText;
      }

      console.log('[GOOGLE_MEET_AUDIT] 3. Resposta completa da API:', JSON.stringify(eventData, null, 2));

      if (!response.ok) {
        console.error('[GOOGLE_MEET_AUDIT] ERRO: Retorno não-200 da API do Google Calendar:', response.status, responseText);
        throw new Error(`A API do Google Calendar retornou erro HTTP ${response.status}: ${eventData?.error?.message || responseText}`);
      }

      const eventId = eventData?.id;
      const conferenceData = eventData?.conferenceData;
      const hangoutLink = eventData?.hangoutLink;
      const entryPointUri = conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

      console.log('[GOOGLE_MEET_AUDIT] 4. Detalhes de Conferência:');
      console.log(' - eventId:', eventId);
      console.log(' - conferenceData:', JSON.stringify(conferenceData, null, 2));
      console.log(' - hangoutLink:', hangoutLink);
      console.log(' - conferenceData.entryPoints[].uri:', entryPointUri);

      const officialMeetLink = hangoutLink || entryPointUri;

      if (!officialMeetLink) {
        console.error('[GOOGLE_MEET_AUDIT] ERRO CRÍTICO: Google Calendar retornou HTTP 200, mas NÃO criou/retornou o link de conferência do Google Meet.');
        throw new Error('A API do Google Calendar respondeu com sucesso, mas nenhum link de reunião (hangoutLink ou conferenceData) foi retornado. Verifique se o Google Meet está ativado no seu Google Workspace / Conta Google.');
      }

      googleOAuthManager.logAudit('MEETING_CREATED', {
        patientName: params.patientName,
        eventId: eventId,
        isOfficialApi: true,
        meetingLink: officialMeetLink
      });

      return {
        eventId: eventId,
        meetingLink: officialMeetLink,
        status: 'confirmed',
        isOfficialApi: true,
        htmlLink: eventData.htmlLink,
        conferenceData: conferenceData,
        hangoutLink: hangoutLink
      };
    } catch (err: any) {
      console.error('[GOOGLE_MEET_AUDIT] ERRO durante a execução de createMeetEvent:', err);
      throw err;
    }
  }

  /**
   * Cancels a Google Calendar event
   */
  public async cancelMeetEvent(eventId: string): Promise<boolean> {
    const accessToken = await googleOAuthManager.getValidAccessToken();

    if (accessToken && !eventId.startsWith('meet_')) {
      try {
        const response = await fetch(`${this.CALENDAR_API_BASE}/${eventId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok) {
          googleOAuthManager.logAudit('MEETING_CANCELLED', { eventId });
          return true;
        }
      } catch (err) {
        console.warn("Could not cancel Google Calendar event:", err);
      }
    }

    googleOAuthManager.logAudit('MEETING_CANCELLED', { eventId });
    return true;
  }
}

export const googleCalendarService = new GoogleCalendarService();
