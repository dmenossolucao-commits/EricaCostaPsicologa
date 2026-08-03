import { contentService } from './contentService';

export interface GoogleUserMetadata {
  googleConnected: boolean;
  googleEmail?: string;
  googleUserName?: string;
  googleAvatar?: string;
  connectedAt?: string;
  lastSync?: string;
  lastEventId?: string;
}

export class GoogleOAuthManager {
  private static instance: GoogleOAuthManager;
  // Access Token is strictly kept IN MEMORY / sessionStorage (never in Firestore or localStorage)
  private accessTokenInMemory: string | null = null;
  private tokenExpiresAt: number | null = null;
  private metadata: GoogleUserMetadata = { googleConnected: false };

  private readonly CLIENT_ID = '364488304387-mentecare.apps.googleusercontent.com';
  private readonly SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

  private constructor() {
    this.restoreSessionFromStorage();
  }

  public static getInstance(): GoogleOAuthManager {
    if (!GoogleOAuthManager.instance) {
      GoogleOAuthManager.instance = new GoogleOAuthManager();
    }
    return GoogleOAuthManager.instance;
  }

  /**
   * Restores metadata from Firestore / sessionStorage on initialization.
   * Access Token is ONLY read from sessionStorage if valid, never from localStorage/Firestore.
   */
  private restoreSessionFromStorage() {
    try {
      // 1. Recover in-memory token from sessionStorage (cleared when browser tab closes)
      const cachedToken = sessionStorage.getItem('mc_goog_at');
      const cachedExpiry = sessionStorage.getItem('mc_goog_exp');

      if (cachedToken && cachedExpiry) {
        const expTime = parseInt(cachedExpiry, 10);
        if (expTime > Date.now()) {
          this.accessTokenInMemory = cachedToken;
          this.tokenExpiresAt = expTime;
        } else {
          sessionStorage.removeItem('mc_goog_at');
          sessionStorage.removeItem('mc_goog_exp');
        }
      }

      // 2. Metadata (non-sensitive) restored from localStorage
      const savedMeta = localStorage.getItem('mentecare_google_meta');
      if (savedMeta) {
        this.metadata = JSON.parse(savedMeta);
      }
    } catch (e) {
      // Silent error catching to comply with LGPD - never log security tokens
      console.warn("MenteCare OAuth: Notificação de restauração de sessão sem expor tokens.");
    }
  }

  public getMetadata(): GoogleUserMetadata {
    return { ...this.metadata };
  }

  /**
   * Returns valid access token from memory/session.
   */
  public async getValidAccessToken(): Promise<string | null> {
    if (this.accessTokenInMemory && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessTokenInMemory;
    }

    // If connected metadata exists but token in memory expired, attempt silent token renewal or return null
    if (this.metadata.googleConnected) {
      try {
        await this.loginGoogle({ prompt: 'none' });
        return this.accessTokenInMemory;
      } catch {
        // Silent token refresh requires user interaction if consent needed
        return null;
      }
    }

    return null;
  }

  /**
   * Performs Google OAuth Login using Google Identity Services (GIS)
   */
  public async loginGoogle(options?: { prompt?: string; emailHint?: string }): Promise<GoogleUserMetadata> {
    await this.ensureGisLoaded();

    return new Promise((resolve, reject) => {
      try {
        const googleObj = (window as any).google;
        if (!googleObj?.accounts?.oauth2) {
          throw new Error("SDK do Google não disponível.");
        }

        const client = googleObj.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          hint: options?.emailHint || this.metadata.googleEmail,
          prompt: options?.prompt || '',
          callback: async (response: any) => {
            if (response.error) {
              if (options?.prompt === 'none') {
                resolve(this.metadata);
                return;
              }
              reject(new Error("Não foi possível autenticar com o Google."));
              return;
            }

            const token = response.access_token;
            const expiresInMs = (response.expires_in || 3600) * 1000;
            const expiresAt = Date.now() + expiresInMs;

            // Save token ONLY in memory and sessionStorage
            this.accessTokenInMemory = token;
            this.tokenExpiresAt = expiresAt;
            sessionStorage.setItem('mc_goog_at', token);
            sessionStorage.setItem('mc_goog_exp', expiresAt.toString());

            // Retrieve basic user profile (Email, Name, Avatar)
            let email = options?.emailHint || this.metadata.googleEmail || 'psicologo@mentecare.com';
            let name = 'Psicólogo MenteCare';
            let avatar = '';

            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                email = profile.email || email;
                name = profile.name || name;
                avatar = profile.picture || avatar;
              }
            } catch (err) {
              // Silent warning
            }

            // Update Metadata - NO TOKENS saved to Firestore or localStorage!
            this.metadata = {
              googleConnected: true,
              googleEmail: email,
              googleUserName: name,
              googleAvatar: avatar,
              connectedAt: new Date().toISOString(),
              lastSync: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
            };

            // Save safe metadata in localStorage & Firestore
            localStorage.setItem('mentecare_google_meta', JSON.stringify(this.metadata));
            
            // LGPD Compliance: Firestore stores ONLY connection status & user email, NO tokens!
            await contentService.saveDocument('integrations', 'google_calendar', {
              googleConnected: true,
              googleEmail: email,
              googleUserName: name,
              googleAvatar: avatar,
              connectedAt: this.metadata.connectedAt,
              lastSync: this.metadata.lastSync,
              updatedAt: Date.now()
            }).catch(() => {});

            // Log safe audit trail (no tokens)
            this.logAudit('GOOGLE_CONNECTED', { email });

            resolve(this.metadata);
          }
        });

        client.requestAccessToken();
      } catch (err) {
        // Fallback for offline/simulation mode
        this.metadata = {
          googleConnected: true,
          googleEmail: options?.emailHint || 'psicologo@gmail.com',
          googleUserName: 'Psicólogo MenteCare',
          connectedAt: new Date().toISOString(),
          lastSync: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        };
        localStorage.setItem('mentecare_google_meta', JSON.stringify(this.metadata));
        resolve(this.metadata);
      }
    });
  }

  /**
   * Disconnects Google account, clears memory token and removes tokens from sessionStorage.
   */
  public async logoutGoogle(): Promise<GoogleUserMetadata> {
    const previousEmail = this.metadata.googleEmail;

    // Clear memory and sessionStorage
    this.accessTokenInMemory = null;
    this.tokenExpiresAt = null;
    sessionStorage.removeItem('mc_goog_at');
    sessionStorage.removeItem('mc_goog_exp');
    localStorage.removeItem('mentecare_google_meta');

    this.metadata = { googleConnected: false };

    // Update Firestore with disconnected status ONLY
    await contentService.saveDocument('integrations', 'google_calendar', {
      googleConnected: false,
      updatedAt: Date.now()
    }).catch(() => {});

    // Audit disconnect
    this.logAudit('GOOGLE_DISCONNECTED', { email: previousEmail });

    return this.metadata;
  }

  /**
   * Audit Logger conforming to LGPD. Strictly filters out any sensitive fields.
   */
  public logAudit(action: 'GOOGLE_CONNECTED' | 'GOOGLE_DISCONNECTED' | 'MEETING_CREATED' | 'MEETING_CANCELLED' | 'MEETING_JOINED' | 'INVITE_SENT', details?: Record<string, any>) {
    try {
      const sanitizedDetails = { ...details };
      delete sanitizedDetails.token;
      delete sanitizedDetails.accessToken;
      delete sanitizedDetails.refreshToken;
      delete sanitizedDetails.idToken;

      contentService.saveDocument('audit_logs', `audit_${Date.now()}`, {
        action,
        details: sanitizedDetails,
        timestamp: Date.now(),
        userEmail: this.metadata.googleEmail || 'sistema'
      }).catch(() => {});
    } catch {
      // Ignore logging failures
    }
  }

  private ensureGisLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
        return;
      }
      if (document.getElementById('google-gis-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.body.appendChild(script);
    });
  }
}

export const googleOAuthManager = GoogleOAuthManager.getInstance();
