export interface Service {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  duration: string;
  format: string; // "Presencial" | "Online" | "Ambos"
  iconName: string; // For lucide-react mapping
  targetAudience: string;
  price?: number; // Optional price for scheduling/payment
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceTitle: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: 'pending_payment' | 'confirmed' | 'cancelled';
  paymentId?: string;
  paymentPreferenceId?: string;
  paymentType?: 'pix' | 'credit_card' | 'simulator';
  amount: number;
  createdAt: number;
  qrCode?: string; // for Pix
  qrCodeBase64?: string; // for Pix
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  date: string;
  imageUrl: string;
  author: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  stars: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: 'pending' | 'responded';
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  dateOfBirth?: string;
  address?: string;
  history?: string; // Clinical evolution history
  notes?: string; // Private psychologist notes
  createdAt: number;
  recibos?: {
    id: string;
    date: string;
    amount: number;
    description: string;
  }[];
}
