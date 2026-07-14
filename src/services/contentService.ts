import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Service, BlogPost, FAQ, Testimonial, Patient } from '../types';
import { PSYCHOLOGIST_INFO, SERVICES, PROCESS_STEPS, FAQS, TESTIMONIALS, BLOG_POSTS } from '../data';

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

  // Upload image to Firebase Storage (with Base64 fallback)
  async uploadImage(file: File, folder: string = 'site'): Promise<string> {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileRef = ref(storage, `${folder}/${fileName}`);
      const snap = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snap.ref);
      return url;
    } catch (err) {
      console.warn("Storage upload failed, falling back to Base64 in Firestore:", err);
      // Fallback to base64 string
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert image to Base64"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
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

  // Retrieve all appointments (Admin)
  async getAppointments(): Promise<any[]> {
    const response = await fetch('/api/appointments');
    if (!response.ok) {
      throw new Error('Erro ao buscar agendamentos.');
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

  // Update appointment details (Reschedule or Cancel)
  async updateAppointment(id: string, data: { date?: string; timeSlot?: string; status?: 'pending_payment' | 'confirmed' | 'cancelled' }): Promise<any> {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erro ao atualizar dados do agendamento.');
    }
    return response.json();
  },

  // Delete appointment (Admin)
  async deleteAppointment(id: string): Promise<any> {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Erro ao deletar agendamento.');
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
      return [];
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
      throw err;
    }
  },

  async updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    try {
      const docRef = doc(db, 'patients', id);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error("Error updating patient:", err);
      throw err;
    }
  },

  async deletePatient(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'patients', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting patient:", err);
      throw err;
    }
  }
};
