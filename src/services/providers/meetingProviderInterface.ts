import { MeetingSession } from '../../types';

export interface MeetingCreateParams {
  appointmentId?: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientId?: string;
  scheduledTime?: string;
  durationMinutes?: number;
}

export interface IMeetingProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;

  createMeeting(params: MeetingCreateParams): Promise<MeetingSession>;
  cancelMeeting?(meetingId: string): Promise<boolean>;
  getMeetingUrl?(meetingId: string): string;
}
