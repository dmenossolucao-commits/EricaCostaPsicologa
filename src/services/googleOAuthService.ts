import { googleOAuthManager, GoogleUserMetadata } from './googleOAuthManager';
import { googleCalendarService, CreateMeetEventParams, CalendarEventResponse } from './googleCalendarService';

export interface GoogleConnectionState {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  lastSync?: string;
}

class GoogleOAuthServiceAdapter {
  public getState(): GoogleConnectionState {
    const meta = googleOAuthManager.getMetadata();
    return {
      isConnected: meta.googleConnected,
      userEmail: meta.googleEmail,
      userName: meta.googleUserName,
      lastSync: meta.lastSync,
    };
  }

  public async connectGoogleAccount(userEmailHint?: string): Promise<GoogleConnectionState> {
    const meta = await googleOAuthManager.loginGoogle({ emailHint: userEmailHint });
    return {
      isConnected: meta.googleConnected,
      userEmail: meta.googleEmail,
      userName: meta.googleUserName,
      lastSync: meta.lastSync,
    };
  }

  public disconnect(): GoogleConnectionState {
    googleOAuthManager.logoutGoogle();
    return {
      isConnected: false
    };
  }

  public async createMeetEvent(params: CreateMeetEventParams): Promise<{ meetingLink: string; eventId?: string; isOfficialApi: boolean }> {
    const res: CalendarEventResponse = await googleCalendarService.createMeetEvent(params);
    return {
      meetingLink: res.meetingLink,
      eventId: res.eventId,
      isOfficialApi: res.isOfficialApi
    };
  }
}

export const googleOAuthService = new GoogleOAuthServiceAdapter();

