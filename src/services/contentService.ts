import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { Service, BlogPost, FAQ, Testimonial, Patient, PatientRecord, PatientDocument, Appointment, FinancialTransaction, Receipt, AuditLog, DocumentVersion, TrashItem } from '../types';
import { PSYCHOLOGIST_INFO, SERVICES, PROCESS_STEPS, FAQS, TESTIMONIALS, BLOG_POSTS } from '../data';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface WeeklyScheduleDay {
  enabled: boolean;
  start: string;
  end: string;
}

export interface AgendaConfig {
  segunda: WeeklyScheduleDay;
  terca: WeeklyScheduleDay;
  quarta: WeeklyScheduleDay;
  quinta: WeeklyScheduleDay;
  sexta: WeeklyScheduleDay;
  sabado: WeeklyScheduleDay;
  domingo: WeeklyScheduleDay;
}

export interface SiteContent {
  psychologist_info: typeof PSYCHOLOGIST_INFO & {
    facebookUrl?: string;
    officeHours?: string;
    footerText?: string;
    whatsappMessage?: string;
    heroImageUrl?: string;
    aboutImageUrl?: string;
    logoUrl?: string;
  };
  services: Service[];
  process_steps: typeof PROCESS_STEPS;
  faqs: FAQ[];
  testimonials: Testimonial[];
  appearance: {
    primaryColor: string; // e.g., 'sage' or hex code
    backgroundColor: string;
    backgroundImageUrl?: string;
    logoUrl?: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    shareImageUrl?: string;
  };
  agenda_config?: AgendaConfig;
}

// Default values for initialization
const DEFAULT_AGENDA: AgendaConfig = {
  segunda: { enabled: true, start: "08:00", end: "12:00" },
  terca: { enabled: true, start: "14:00", end: "18:00" },
  quarta: { enabled: true, start: "08:00", end: "18:00" },
  quinta: { enabled: true, start: "08:00", end: "18:00" },
  sexta: { enabled: true, start: "09:00", end: "16:00" },
  sabado: { enabled: false, start: "08:00", end: "12:00" },
  domingo: { enabled: false, start: "08:00", end: "12:00" }
};

const DEFAULT_CONTENT: SiteContent = {
  psychologist_info: {
    ...PSYCHOLOGIST_INFO,
    facebookUrl: "https://facebook.com/___________",
    officeHours: "Segunda a Sexta, das 08:00 às 20:00",
    footerText: "Psicoterapia online ética, sigilosa e acolhedora. Regulamentada pelo CFP.",
    whatsappMessage: "Olá, Psicóloga Erica Costa! Gostaria de agendar uma consulta.",
    heroImageUrl: "", // Will fall back to asset import if empty
    aboutImageUrl: "", // Will fall back to asset import if empty
    logoUrl: ""
  },
  services: SERVICES,
  process_steps: PROCESS_STEPS,
  faqs: FAQS,
  testimonials: TESTIMONIALS,
  appearance: {
    primaryColor: "#5c6f68", // sage-600
    backgroundColor: "#fcfaf7", // sand-50
    backgroundImageUrl: "",
    logoUrl: ""
  },
  seo: {
    title: "Erica Costa | Psicologia Clínica & Orientação de Carreira",
    description: "Espaço seguro de acolhimento e escuta qualificada. Psicoterapia online para jovens e adultos. Orientação de carreira e plantão de acolhimento emocional.",
    keywords: "psicóloga, terapia online, psicoterapia, ansiedade, autoconhecimento, orientação de carreira, Erica Costa, ceára"
  },
  agenda_config: DEFAULT_AGENDA
};

// Detect Client OS, Browser, IP
export async function detectClientInfo() {
  let ip = '127.0.0.1';
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      ip = data.ip;
    }
  } catch (e) {
    ip = '189.221.34.120'; // simulated clean default IP
  }

  const ua = navigator.userAgent;
  let browser = 'Chrome';
  let os = 'Linux';

  if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('SamsungBrowser') > -1) browser = 'Samsung Browser';
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
  else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';
  else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Microsoft Edge';
  else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';

  if (ua.indexOf('Windows NT 10.0') > -1) os = 'Windows 10/11';
  else if (ua.indexOf('Windows NT 6.2') > -1) os = 'Windows 8';
  else if (ua.indexOf('Windows NT 6.1') > -1) os = 'Windows 7';
  else if (ua.indexOf('Macintosh') > -1) os = 'macOS';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';

  return { ip, browser, os };
}

// Global Audit logger function
export async function logAuditAction(
  action: AuditLog['action'],
  details: string
): Promise<void> {
  try {
    const colRef = collection(db, 'audit_logs');
    const info = await detectClientInfo();
    const id = doc(colRef).id;
    const email = auth.currentUser?.email || 'Sistema';
    const userId = auth.currentUser?.uid || 'system';
    
    const payload: AuditLog = {
      id,
      userId,
      email,
      action,
      details,
      timestamp: Date.now(),
      ip: info.ip,
      browser: info.browser,
      os: info.os
    };

    await setDoc(doc(db, 'audit_logs', id), payload);
  } catch (err) {
    console.error("Failed to log audit action:", err);
  }
}

const CONTENT_DOC_REF = doc(db, 'site_content', 'main');

export const contentService = {
  // Fetch overall site content
  async getSiteContent(): Promise<SiteContent> {
    try {
      const snap = await getDoc(CONTENT_DOC_REF);
      if (snap.exists()) {
        const data = snap.data() as SiteContent;
        // Merge missing fields to handle schema updates gracefully
        return {
          ...DEFAULT_CONTENT,
          ...data,
          psychologist_info: {
            ...DEFAULT_CONTENT.psychologist_info,
            ...(data.psychologist_info || {})
          },
          appearance: {
            ...DEFAULT_CONTENT.appearance,
            ...(data.appearance || {})
          },
          seo: {
            ...DEFAULT_CONTENT.seo,
            ...(data.seo || {})
          },
          agenda_config: {
            ...DEFAULT_AGENDA,
            ...(data.agenda_config || {})
          }
        };
      } else {
        // Initialize with default values on first run
        await setDoc(CONTENT_DOC_REF, DEFAULT_CONTENT);
        return DEFAULT_CONTENT;
      }
    } catch (err) {
      console.error("Error fetching site content from Firestore:", err);
      return DEFAULT_CONTENT;
    }
  },

  // Save overall site content
  async updateSiteContent(content: Partial<SiteContent>): Promise<void> {
    try {
      const current = await this.getSiteContent();
      
      // Módulo 4: Versionamento de Configurações antes de atualizar
      await this.createVersion('site_content', 'main', current, `Alterações: ${Object.keys(content).join(', ')}`);
      
      const updated = {
        ...current,
        ...content,
        psychologist_info: {
          ...current.psychologist_info,
          ...(content.psychologist_info || {})
        },
        appearance: {
          ...current.appearance,
          ...(content.appearance || {})
        },
        seo: {
          ...current.seo,
          ...(content.seo || {})
        }
      };
      await setDoc(CONTENT_DOC_REF, updated);
      
      // Dynamic updates to document title and meta description
      if (updated.seo.title) {
        document.title = updated.seo.title;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && updated.seo.description) {
        metaDesc.setAttribute('content', updated.seo.description);
      }

      // Módulo 6: Auditoria Completa
      await logAuditAction('UPDATE', `Configurações globais de site_content atualizadas.`);
    } catch (err) {
      console.error("Error updating site content in Firestore:", err);
      throw err;
    }
  },

  // Fetch blog posts
  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const colRef = collection(db, 'blog_posts');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const posts: BlogPost[] = [];
        const seenIds = new Set<string>();
        
        for (const docSnapshot of snap.docs) {
          const data = docSnapshot.data() as BlogPost;
          // The stored document might have an embedded 'id', or we use the Firestore doc.id
          const finalId = data.id || docSnapshot.id;
          
          if (!seenIds.has(finalId)) {
            seenIds.add(finalId);
            posts.push({ ...data, id: finalId });
          } else {
            // Self-healing database: clean up any duplicate documents created previously
            try {
              await deleteDoc(docSnapshot.ref);
              console.log(`Deleted duplicate blog post document from Firestore: ${docSnapshot.id} with slug: ${finalId}`);
            } catch (cleanupErr) {
              console.error("Error cleaning up duplicate doc:", cleanupErr);
            }
          }
        }
        return posts;
      } else {
        // Seed database on first run
        const posts: BlogPost[] = [];
        for (const post of BLOG_POSTS) {
          const docRef = doc(db, 'blog_posts', post.id);
          await setDoc(docRef, post);
          posts.push(post);
        }
        return posts;
      }
    } catch (err) {
      console.error("Error fetching blog posts from Firestore:", err);
      return BLOG_POSTS;
    }
  },

  // Add a blog post
  async createBlogPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
    try {
      const colRef = collection(db, 'blog_posts');
      const docRef = await addDoc(colRef, post);
      return { ...post, id: docRef.id };
    } catch (err) {
      console.error("Error creating blog post:", err);
      throw err;
    }
  },

  // Update a blog post
  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<void> {
    try {
      const docRef = doc(db, 'blog_posts', id);
      await updateDoc(docRef, post);
    } catch (err) {
      console.error("Error updating blog post:", err);
      throw err;
    }
  },

  // Delete a blog post
  async deleteBlogPost(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'blog_posts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.imageUrl) {
          try {
            await this.deleteImage(data.imageUrl);
          } catch (err) {
            console.error("Error deleting blog post image from storage:", err);
          }
        }
      }
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting blog post:", err);
      throw err;
    }
  },

  // Update complete list of blog posts (handles syncing with Firestore)
  async updateBlogPostsList(posts: BlogPost[]): Promise<void> {
    try {
      const current = await this.getBlogPosts();
      for (const post of posts) {
        const docRef = doc(db, 'blog_posts', post.id);
        await setDoc(docRef, post);
      }
      for (const p of current) {
        if (!posts.some(post => post.id === p.id)) {
          const docRef = doc(db, 'blog_posts', p.id);
          await deleteDoc(docRef);
        }
      }
    } catch (err) {
      console.error("Error updating blog posts list:", err);
      throw err;
    }
  },

  // Upload image to Firebase Storage (with optional progress tracking)
  async uploadImage(
    file: File,
    folder: string = 'site',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    console.log(`[Firebase Upload Image] --- STARTING ---`);
    console.log(`[Firebase Upload Image] File name: "${file.name}" | Size: ${file.size} bytes | MIME type: "${file.type}"`);
    console.log(`[Firebase Upload Image] Target folder: "${folder}"`);
    const currentUser = auth.currentUser;
    console.log(`[Firebase Upload Image] Current User ID: "${currentUser?.uid || 'Not Authenticated'}" | Email: "${currentUser?.email || 'N/A'}"`);
    console.log(`[Firebase Upload Image] Firebase Storage Bucket: "gs://${storage.app.options.storageBucket}"`);

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storagePath = `${folder}/${fileName}`;
    const fileRef = ref(storage, storagePath);
    console.log(`[Firebase Upload Image] Created reference path: "${storagePath}"`);

    try {
      console.log(`[Firebase Upload Image] Initiating uploadBytesResumable...`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      console.log(`[Firebase Upload Image] uploadBytesResumable instance created successfully.`);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = snapshot.totalBytes > 0 
              ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 
              : 0;
            console.log(`[Firebase Upload Image] Progress Snapshot: ${snapshot.bytesTransferred} of ${snapshot.totalBytes} bytes (${progress.toFixed(2)}%) | State: "${snapshot.state}"`);
            if (onProgress) {
              onProgress(Math.round(progress));
            }
          },
          (error) => {
            console.error(`[Firebase Upload Image] ❌ Upload failed with error:`, error);
            console.error(`[Firebase Upload Image] Error Code: "${(error as any).code}" | Message: "${error.message}"`);
            reject(error);
          },
          async () => {
            console.log(`[Firebase Upload Image] ✅ Resumable upload finished. Retrieving download URL...`);
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`[Firebase Upload Image] Successfully got download URL: "${url}"`);
              resolve(url);
            } catch (urlError: any) {
              console.error(`[Firebase Upload Image] ❌ Error retrieving download URL:`, urlError);
              reject(urlError);
            }
          }
        );
      });
    } catch (startError: any) {
      console.error(`[Firebase Upload Image] ❌ Exception caught starting uploadBytesResumable:`, startError);
      throw startError;
    }
  },

  // Delete image from Firebase Storage
  async deleteImage(url: string): Promise<void> {
    if (!url || url.startsWith('data:')) return; // Ignore base64
    try {
      // Find reference by parsing URL
      const decodedUrl = decodeURIComponent(url);
      const matches = decodedUrl.match(/\/o\/(.+?)\?/);
      if (matches && matches[1]) {
        const path = matches[1];
        const fileRef = ref(storage, path);
        await deleteObject(fileRef);
      }
    } catch (err) {
      console.error("Error deleting image from storage:", err);
    }
  },

  // Fetch lead messages from Firestore
  async getLeadMessages(): Promise<any[]> {
    try {
      const colRef = collection(db, 'leads_messages');
      const snap = await getDocs(colRef);
      const messages = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // Sort messages by date descending (assuming date string or sorting chronologically)
      return messages.sort((a: any, b: any) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });
    } catch (err) {
      console.error("Error fetching lead messages:", err);
      return [];
    }
  },

  // Save lead message to Firestore
  async createLeadMessage(message: any): Promise<void> {
    try {
      const colRef = collection(db, 'leads_messages');
      await addDoc(colRef, {
        ...message,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Error saving lead message:", err);
      throw err;
    }
  },

  // Update lead message status
  async updateLeadMessageStatus(id: string, status: 'pending' | 'responded'): Promise<void> {
    try {
      const docRef = doc(db, 'leads_messages', id);
      await updateDoc(docRef, { status });
    } catch (err) {
      console.error("Error updating lead message status:", err);
      throw err;
    }
  },

  // Delete lead message from Firestore
  async deleteLeadMessage(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'leads_messages', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting lead message:", err);
      throw err;
    }
  },

  // Clear all lead messages
  async clearAllLeadMessages(): Promise<void> {
    try {
      const colRef = collection(db, 'leads_messages');
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'leads_messages', d.id));
      }
    } catch (err) {
      console.error("Error clearing lead messages:", err);
      throw err;
    }
  },

  // === APPOINTMENTS & AGENDA SCHEDULING METHODS ===

  // Book a new appointment (handles Mercado Pago/Simulator preference creation on server)
  async bookAppointment(apptData: {
    serviceId: string;
    serviceTitle: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    date: string; // YYYY-MM-DD
    timeSlot: string; // HH:MM
    amount: number;
    paymentMethod: 'pix' | 'credit_card';
  }): Promise<any> {
    const response = await fetch('/api/appointments/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apptData),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Erro ao realizar agendamento.');
    }
    return response.json();
  },

  // Confirm simulated payment (triggers webhook status change)
  async simulatePayment(appointmentId: string, paymentType?: string): Promise<any> {
    const response = await fetch('/api/appointments/simulate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, paymentType }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Erro ao simular pagamento.');
    }
    return response.json();
  },

  // Retrieve details for a single appointment
  async getAppointmentById(id: string): Promise<any> {
    const response = await fetch(`/api/appointments/${id}`);
    if (!response.ok) {
      throw new Error('Agendamento não encontrado.');
    }
    return response.json();
  },

  // Update appointment status (Admin)
  async updateAppointmentStatus(id: string, status: 'pending_payment' | 'confirmed' | 'cancelled'): Promise<any> {
    const response = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Erro ao atualizar status do agendamento.');
    }
    return response.json();
  },

  // Blocked slots for administrative agenda exceptions
  async getBlockedSlots(): Promise<any[]> {
    const response = await fetch('/api/blocked-slots');
    if (!response.ok) {
      throw new Error('Erro ao buscar horários bloqueados.');
    }
    return response.json();
  },

  // Block a slot (Admin)
  async createBlockedSlot(date: string, timeSlot: string): Promise<any> {
    const response = await fetch('/api/blocked-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, timeSlot }),
    });
    if (!response.ok) {
      throw new Error('Erro ao bloquear horário.');
    }
    return response.json();
  },

  // Unblock a slot (Admin)
  async deleteBlockedSlot(id: string): Promise<any> {
    const response = await fetch(`/api/blocked-slots/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Erro ao remover bloqueio.');
    }
    return response.json();
  },

  // === PATIENTS METHODS (ADMIN) ===
  async getPatients(): Promise<Patient[]> {
    try {
      const colRef = collection(db, 'patients');
      const snap = await getDocs(colRef);
      const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Patient));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.error("Error fetching patients:", err);
      handleFirestoreError(err, OperationType.LIST, 'patients');
    }
  },

  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    try {
      const colRef = collection(db, 'patients');
      const docRef = await addDoc(colRef, {
        ...patient,
        createdAt: Date.now()
      });
      return { ...patient, id: docRef.id, createdAt: Date.now() } as Patient;
    } catch (err) {
      console.error("Error creating patient:", err);
      handleFirestoreError(err, OperationType.CREATE, 'patients');
    }
  },

  async updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    try {
      const docRef = doc(db, 'patients', id);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error("Error updating patient:", err);
      handleFirestoreError(err, OperationType.UPDATE, `patients/${id}`);
    }
  },

  async deletePatient(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'patients', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const item = snap.data() as Patient;
        // Módulo 5: Lixeira Inteligente
        await this.moveToTrash('patients', id, item, `Paciente: ${item.name || item.nome}`);
      }
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting patient:", err);
      handleFirestoreError(err, OperationType.DELETE, `patients/${id}`);
    }
  },

  // === CLINICAL MEDICAL RECORDS (patient_records) ===
  async getPatientRecords(patientId: string): Promise<PatientRecord[]> {
    try {
      const colRef = collection(db, 'patient_records');
      const q = query(colRef, where('patientId', '==', patientId));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as PatientRecord));
      
      // Sort from newest to oldest
      return list.sort((a, b) => {
        // Safe parsing of sessionDate (YYYY-MM-DD)
        const dateA = new Date(`${a.sessionDate}T00:00:00`).getTime() || 0;
        const dateB = new Date(`${b.sessionDate}T00:00:00`).getTime() || 0;
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        return b.createdAt - a.createdAt;
      });
    } catch (err) {
      console.error("Error fetching patient records:", err);
      handleFirestoreError(err, OperationType.LIST, `patient_records`);
    }
  },

  async createPatientRecord(record: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PatientRecord> {
    try {
      const colRef = collection(db, 'patient_records');
      const now = Date.now();
      const docRef = await addDoc(colRef, {
        ...record,
        createdAt: now,
        updatedAt: now
      });
      return {
        ...record,
        id: docRef.id,
        createdAt: now,
        updatedAt: now
      } as PatientRecord;
    } catch (err) {
      console.error("Error creating patient record:", err);
      handleFirestoreError(err, OperationType.CREATE, 'patient_records');
    }
  },

  async updatePatientRecord(id: string, data: Partial<PatientRecord>): Promise<void> {
    try {
      const docRef = doc(db, 'patient_records', id);
      const currentSnap = await getDoc(docRef);
      if (currentSnap.exists()) {
        const currentData = currentSnap.data() as PatientRecord;
        // Módulo 4: Versionamento de Prontuários
        await this.createVersion('patient_records', id, currentData, `Edição de prontuário: ${Object.keys(data).join(', ')}`);
      }
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now()
      });
      // Módulo 6: Auditoria Completa
      await logAuditAction('UPDATE', `Prontuário clínico #${id} editado.`);
    } catch (err) {
      console.error("Error updating patient record:", err);
      handleFirestoreError(err, OperationType.UPDATE, `patient_records/${id}`);
    }
  },

  async deletePatientRecord(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'patient_records', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const item = snap.data() as PatientRecord;
        // Módulo 5: Lixeira Inteligente
        await this.moveToTrash('patient_records', id, item, `Prontuário de sessão em ${item.sessionDate}`);
      }
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting patient record:", err);
      handleFirestoreError(err, OperationType.DELETE, `patient_records/${id}`);
    }
  },

  // === CLINICAL DOCUMENTS (patient_documents) ===
  async getPatientDocuments(patientId: string): Promise<PatientDocument[]> {
    try {
      const colRef = collection(db, 'patient_documents');
      const q = query(colRef, where('patientId', '==', patientId));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as PatientDocument));
      
      // Sort from newest to oldest
      return list.sort((a, b) => b.uploadedAt - a.uploadedAt);
    } catch (err) {
      console.error("Error fetching patient documents:", err);
      handleFirestoreError(err, OperationType.LIST, 'patient_documents');
    }
  },

  async createPatientDocument(docData: Omit<PatientDocument, 'id' | 'uploadedAt'>): Promise<PatientDocument> {
    try {
      const colRef = collection(db, 'patient_documents');
      const now = Date.now();
      const payload = {
        ...docData,
        uploadedAt: now
      };
      const docRef = await addDoc(colRef, payload);
      return {
        ...payload,
        id: docRef.id,
        uploadedAt: now
      } as PatientDocument;
    } catch (err) {
      console.error("Error creating patient document:", err);
      handleFirestoreError(err, OperationType.CREATE, 'patient_documents');
    }
  },

  async updatePatientDocument(id: string, data: Partial<PatientDocument>): Promise<void> {
    try {
      const docRef = doc(db, 'patient_documents', id);
      const currentSnap = await getDoc(docRef);
      if (currentSnap.exists()) {
        const currentData = currentSnap.data() as PatientDocument;
        // Módulo 4: Versionamento de Documentos
        await this.createVersion('patient_documents', id, currentData, `Edição de metadados do documento: ${Object.keys(data).join(', ')}`);
      }
      await updateDoc(docRef, data);
      // Módulo 6: Auditoria Completa
      await logAuditAction('UPDATE', `Metadados do documento clínico #${id} alterados.`);
    } catch (err) {
      console.error("Error updating patient document:", err);
      handleFirestoreError(err, OperationType.UPDATE, `patient_documents/${id}`);
    }
  },

  async deletePatientDocument(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'patient_documents', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const item = snap.data() as PatientDocument;
        // Módulo 5: Lixeira Inteligente
        await this.moveToTrash('patient_documents', id, item, `Documento: ${item.originalName}`);
      }
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting patient document:", err);
      handleFirestoreError(err, OperationType.DELETE, `patient_documents/${id}`);
    }
  },

  // Upload any clinical file/blob to Firebase Storage under the patient's folder
  async uploadDocumentFile(
    patientId: string,
    file: File | Blob,
    originalName: string,
    onProgress?: (progress: number) => void
  ): Promise<{ downloadURL: string; storagePath: string }> {
    console.log(`[Firebase Upload Document] --- STARTING ---`);
    console.log(`[Firebase Upload Document] Original name: "${originalName}" | Size: ${file.size} bytes | Patient ID: "${patientId}"`);
    const currentUser = auth.currentUser;
    console.log(`[Firebase Upload Document] Current User ID: "${currentUser?.uid || 'Not Authenticated'}" | Email: "${currentUser?.email || 'N/A'}"`);
    console.log(`[Firebase Upload Document] Firebase Storage Bucket: "gs://${storage.app.options.storageBucket}"`);

    // Sanitize the filename to prevent issues with special characters
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `patients/${patientId}/documents/${Date.now()}_${sanitizedName}`;
    const fileRef = ref(storage, storagePath);
    console.log(`[Firebase Upload Document] Created reference path: "${storagePath}"`);

    try {
      console.log(`[Firebase Upload Document] Initiating uploadBytesResumable...`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      console.log(`[Firebase Upload Document] uploadBytesResumable instance created successfully.`);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = snapshot.totalBytes > 0 
              ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 
              : 0;
            console.log(`[Firebase Upload Document] Progress Snapshot: ${snapshot.bytesTransferred} of ${snapshot.totalBytes} bytes (${progress.toFixed(2)}%) | State: "${snapshot.state}"`);
            if (onProgress) {
              onProgress(Math.round(progress));
            }
          },
          (error) => {
            console.error(`[Firebase Upload Document] ❌ Upload failed with error:`, error);
            console.error(`[Firebase Upload Document] Error Code: "${(error as any).code}" | Message: "${error.message}"`);
            reject(error);
          },
          async () => {
            console.log(`[Firebase Upload Document] ✅ Resumable upload finished. Retrieving download URL...`);
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`[Firebase Upload Document] Successfully got download URL: "${downloadURL}"`);
              resolve({ downloadURL, storagePath });
            } catch (urlError: any) {
              console.error(`[Firebase Upload Document] ❌ Error retrieving download URL:`, urlError);
              reject(urlError);
            }
          }
        );
      });
    } catch (startError: any) {
      console.error(`[Firebase Upload Document] ❌ Exception caught starting uploadBytesResumable:`, startError);
      throw startError;
    }
  },

  async deleteDocumentFile(storagePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (err) {
      console.error("Error deleting document file from storage:", err);
    }
  },

  // === APPOINTMENTS ===
  async getAppointments(): Promise<Appointment[]> {
    try {
      const colRef = collection(db, 'appointments');
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (err) {
      console.error("Error fetching appointments:", err);
      handleFirestoreError(err, OperationType.LIST, 'appointments');
    }
  },

  async createAppointment(appt: Omit<Appointment, 'id'> & { id?: string }): Promise<Appointment> {
    try {
      const colRef = collection(db, 'appointments');
      const id = appt.id || doc(colRef).id;
      const payload = {
        ...appt,
        id,
        createdAt: appt.createdAt || Date.now()
      };
      await setDoc(doc(db, 'appointments', id), payload);
      return payload as Appointment;
    } catch (err) {
      console.error("Error creating appointment:", err);
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
    try {
      const docRef = doc(db, 'appointments', id);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error("Error updating appointment:", err);
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'appointments', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting appointment:", err);
      handleFirestoreError(err, OperationType.DELETE, `appointments/${id}`);
    }
  },

  // === FINANCIAL TRANSACTIONS ===
  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    try {
      const colRef = collection(db, 'financial_transactions');
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialTransaction));
    } catch (err) {
      console.error("Error fetching financial transactions:", err);
      handleFirestoreError(err, OperationType.LIST, 'financial_transactions');
    }
  },

  async createFinancialTransaction(tx: Omit<FinancialTransaction, 'id'> & { id?: string }): Promise<FinancialTransaction> {
    try {
      const colRef = collection(db, 'financial_transactions');
      const id = tx.id || doc(colRef).id;
      const payload = {
        ...tx,
        id,
        createdAt: tx.createdAt || Date.now()
      };
      await setDoc(doc(db, 'financial_transactions', id), payload);
      return payload as FinancialTransaction;
    } catch (err) {
      console.error("Error creating financial transaction:", err);
      handleFirestoreError(err, OperationType.CREATE, 'financial_transactions');
    }
  },

  async updateFinancialTransaction(id: string, data: Partial<FinancialTransaction>): Promise<void> {
    try {
      const docRef = doc(db, 'financial_transactions', id);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error("Error updating financial transaction:", err);
      handleFirestoreError(err, OperationType.UPDATE, `financial_transactions/${id}`);
    }
  },

  async deleteFinancialTransaction(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'financial_transactions', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting financial transaction:", err);
      handleFirestoreError(err, OperationType.DELETE, `financial_transactions/${id}`);
    }
  },

  // === RECEIPTS ===
  async getReceipts(): Promise<Receipt[]> {
    try {
      const colRef = collection(db, 'receipts');
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));
    } catch (err) {
      console.error("Error fetching receipts:", err);
      handleFirestoreError(err, OperationType.LIST, 'receipts');
    }
  },

  async createReceipt(receipt: Omit<Receipt, 'id'> & { id?: string }): Promise<Receipt> {
    try {
      const colRef = collection(db, 'receipts');
      const id = receipt.id || doc(colRef).id;
      const payload = {
        ...receipt,
        id,
        createdAt: receipt.createdAt || Date.now()
      };
      await setDoc(doc(db, 'receipts', id), payload);
      return payload as Receipt;
    } catch (err) {
      console.error("Error creating receipt:", err);
      handleFirestoreError(err, OperationType.CREATE, 'receipts');
    }
  },

  async deleteReceipt(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'receipts', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const item = snap.data() as Receipt;
        await this.moveToTrash('receipts', id, item, `Recibo de ${item.patientName} (${item.date})`);
      }
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting receipt:", err);
      handleFirestoreError(err, OperationType.DELETE, `receipts/${id}`);
    }
  },

  // === AUDIT LOGS ===
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const snap = await getDocs(collection(db, 'audit_logs'));
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      return [];
    }
  },

  // === VERSIONING ===
  async createVersion(
    collectionName: 'patient_records' | 'patient_documents' | 'blog_posts' | 'site_content',
    documentId: string,
    data: any,
    changes: string
  ): Promise<void> {
    try {
      const colRef = collection(db, 'document_versions');
      const q = query(colRef, where('documentId', '==', documentId));
      const snap = await getDocs(q);
      const nextVersion = snap.size + 1;

      const id = doc(colRef).id;
      const email = auth.currentUser?.email || 'Sistema';

      const versionDoc: DocumentVersion = {
        id,
        documentId,
        collectionName,
        versionNumber: nextVersion,
        updatedAt: Date.now(),
        updatedBy: email,
        data,
        changes
      };

      await setDoc(doc(db, 'document_versions', id), versionDoc);
      await logAuditAction('UPDATE', `Nova versão #${nextVersion} gerada para ${collectionName}/${documentId}. Alteração: ${changes}`);
    } catch (err) {
      console.error("Error creating document version:", err);
    }
  },

  async getDocumentVersions(
    collectionName: string,
    documentId: string
  ): Promise<DocumentVersion[]> {
    try {
      const colRef = collection(db, 'document_versions');
      const q = query(
        colRef, 
        where('collectionName', '==', collectionName),
        where('documentId', '==', documentId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentVersion));
      return list.sort((a, b) => b.versionNumber - a.versionNumber);
    } catch (err) {
      console.error("Error getting document versions:", err);
      return [];
    }
  },

  async getAllDocumentVersions(): Promise<DocumentVersion[]> {
    try {
      const colRef = collection(db, 'document_versions');
      const snap = await getDocs(colRef);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentVersion));
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      console.error("Error getting all versions:", err);
      return [];
    }
  },

  async restoreVersion(versionId: string): Promise<void> {
    try {
      const versionDocRef = doc(db, 'document_versions', versionId);
      const snap = await getDoc(versionDocRef);
      if (!snap.exists()) throw new Error('Versão não encontrada');

      const version = snap.data() as DocumentVersion;
      const targetDocRef = doc(db, version.collectionName, version.documentId);
      
      await setDoc(targetDocRef, version.data, { merge: true });

      await this.createVersion(
        version.collectionName,
        version.documentId,
        version.data,
        `Restaurado para a versão #${version.versionNumber}`
      );

      await logAuditAction('RESTORE', `Documento ${version.collectionName}/${version.documentId} restaurado com sucesso para a versão #${version.versionNumber}.`);
    } catch (err) {
      console.error("Error restoring version:", err);
      throw err;
    }
  },

  // === TRASH BIN (90 DAYS EXPIRY PREPARATION) ===
  async getTrashItems(): Promise<TrashItem[]> {
    try {
      const snap = await getDocs(collection(db, 'trash_bin'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrashItem));
      const limitTime = Date.now() - 7776000000; // 90 days
      return list.filter(item => item.deletedAt >= limitTime).sort((a, b) => b.deletedAt - a.deletedAt);
    } catch (err) {
      console.error("Error fetching trash items:", err);
      return [];
    }
  },

  async moveToTrash(
    collectionName: TrashItem['originalCollection'],
    documentId: string,
    data: any,
    title: string
  ): Promise<void> {
    try {
      const colRef = collection(db, 'trash_bin');
      const id = doc(colRef).id;
      const email = auth.currentUser?.email || 'Sistema';

      const trashDoc: TrashItem = {
        id,
        originalId: documentId,
        originalCollection: collectionName,
        title,
        deletedAt: Date.now(),
        deletedBy: email,
        data
      };

      await setDoc(doc(db, 'trash_bin', id), trashDoc);
      await logAuditAction('DELETE', `Item '${title}' movido para a Lixeira Inteligente.`);
    } catch (err) {
      console.error("Error moving to trash:", err);
    }
  },

  async restoreFromTrash(trashItemId: string): Promise<void> {
    try {
      const trashDocRef = doc(db, 'trash_bin', trashItemId);
      const snap = await getDoc(trashDocRef);
      if (!snap.exists()) throw new Error('Item não encontrado na lixeira');

      const item = snap.data() as TrashItem;
      const targetDocRef = doc(db, item.originalCollection, item.originalId);

      await setDoc(targetDocRef, item.data);
      await deleteDoc(trashDocRef);

      await logAuditAction('TRASH_RESTORE', `Item '${item.title}' recuperado com sucesso da lixeira.`);
    } catch (err) {
      console.error("Error restoring from trash:", err);
      throw err;
    }
  },

  async deletePermanentlyFromTrash(trashItemId: string): Promise<void> {
    try {
      const trashDocRef = doc(db, 'trash_bin', trashItemId);
      const snap = await getDoc(trashDocRef);
      if (!snap.exists()) throw new Error('Item não encontrado na lixeira');

      const item = snap.data() as TrashItem;
      await deleteDoc(trashDocRef);

      await logAuditAction('TRASH_DELETE', `Exclusão permanente: '${item.title}' removido definitivamente.`);
    } catch (err) {
      console.error("Error deleting permanently from trash:", err);
      throw err;
    }
  }
};
