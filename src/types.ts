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
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'confirmada' | 'pendente' | 'remarcada' | 'cancelada' | 'nao_compareceu';
  paymentId?: string;
  paymentPreferenceId?: string;
  paymentType?: 'pix' | 'credit_card' | 'debit_card' | 'simulator' | 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência';
  amount: number;
  createdAt: number;
  qrCode?: string; // for Pix
  qrCodeBase64?: string; // for Pix
  patientId?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  modality?: 'Online' | 'Presencial';
  notes?: string;
  discount?: number;
  
  // Teleconsulta Google Meet fields
  meetingId?: string;
  meetingLink?: string;
  meetingProvider?: 'google_meet' | 'teams' | 'zoom' | 'jitsi' | 'whereby';
  meetingStatus?: 'created' | 'in_progress' | 'ended' | 'cancelled';
  meetingCreatedAt?: number;
  meetingEndedAt?: number;
  meetingDuration?: number; // in seconds
  meetingInvited?: boolean;
  meetingJoined?: boolean;
  meetingNotes?: string;
}

export interface MeetingSession {
  id: string;
  meetingId: string;
  meetingLink: string;
  meetingProvider: 'google_meet' | 'teams' | 'zoom' | 'jitsi' | 'whereby';
  meetingStatus: 'created' | 'in_progress' | 'ended' | 'cancelled';
  meetingCreatedAt: number;
  meetingEndedAt?: number;
  meetingDuration?: number; // duration in seconds
  meetingInvited?: boolean;
  meetingJoined?: boolean;
  meetingNotes?: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientId?: string;
  appointmentId?: string;
  createdAt: number;
}

export interface FinancialTransaction {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  discount: number;
  status: 'Pendente' | 'Pago' | 'Cancelado' | 'Reembolsado';
  paymentMethod: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência';
  notes?: string;
  createdAt: number;
}

export interface Receipt {
  id: string;
  patientId: string;
  patientName: string;
  psychologistName: string;
  psychologistCrp?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência';
  signatureVerified: boolean;
  signedAt?: number;
  createdAt: number;
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

export interface PatientAddress {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Patient {
  id: string;
  tenantId?: string;
  name: string;
  email?: string;
  phone?: string;
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

  // Portuguese fields required for the "patients" collection
  nome?: string;
  rg?: string;
  dataNascimento?: string;
  sexo?: string;
  estadoCivil?: string;
  profissao?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: PatientAddress;
  convenio?: string;
  contatoEmergencia?: string;
  nomeResponsavel?: string;
  observacoes?: string;
  updatedAt?: number;
  status?: 'Ativo' | 'Inativo';
  photoUrl?: string;
  ultimaConsulta?: string;
  proximaConsulta?: string;
  login?: string;
  senha?: string;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  sessionDate: string;
  startTime: string;
  duration: string;
  modality: 'Online' | 'Presencial';
  status: 'Realizada' | 'Cancelada' | 'Remarcada';
  objective: string;
  clinicalEvolution: string;
  observations: string;
  nextSessionPlan: string;
  attachments: {
    name: string;
    url: string;
    type: string;
    size?: number;
  }[];
  signature: {
    signedBy: string;
    signedAt: number;
    ip?: string;
    verified: boolean;
  };
  meetingId?: string;
  meetingLink?: string;
  meetingProvider?: 'google_meet' | 'teams' | 'zoom' | 'jitsi' | 'whereby';
  meetingStatus?: 'created' | 'in_progress' | 'ended' | 'cancelled';
  meetingDuration?: number;
}

export interface PatientDocument {
  id: string;
  patientId: string;
  category: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  downloadURL: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: number;
  description: string;
  tags: string[];
  linkedRecordIds?: string[]; // structure prepared for clinical records
}

export interface AuditLog {
  id: string;
  userId: string;
  email: string;
  action: 'LOGIN' | 'LOGOUT' | 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'UPDATE' | 'PRINT' | 'RESTORE' | 'BACKUP_CREATE' | 'BACKUP_RESTORE' | 'TRASH_RESTORE' | 'TRASH_DELETE' | 'BLOCKED_ATTEMPT' | 'NEW_DEVICE_ALERT' | string;
  details: string;
  timestamp: number;
  ip: string;
  browser: string;
  os: string;
  tenantId?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  collectionName: 'patient_records' | 'patient_documents' | 'blog_posts' | 'site_content';
  versionNumber: number;
  updatedAt: number;
  updatedBy: string;
  data: any;
  changes: string;
}

export interface TrashItem {
  id: string;
  originalId: string;
  originalCollection: string;
  title: string;
  deletedAt: number;
  deletedBy: string;
  deleteReason?: string;
  restoreUntil?: number;
  tenantId?: string;
  data: any;
}

export interface PixConfig {
  id: string;
  keyType: string;
  key: string;
  cpf?: string;
  phone?: string;
  email?: string;
  randomKey?: string;
  receiverName: string;
  receiverCity: string;
  bank?: string;
  updatedAt: number;
}

export type SaaSPlanId = 'Starter' | 'Pro' | 'Premium' | 'Clinic' | 'Enterprise';

export interface SaaSPlanLimits {
  id: SaaSPlanId;
  name: string;
  price: number;
  maxPatients: number;
  maxUsers: number;
  storageGb: number;
  maxSchedules: number;
  maxPsychologists: number;
  hasIaClinical: boolean;
  hasWhatsAppIntegration: boolean;
  hasNfse: boolean;
  hasDesktopVersion: boolean;
  hasMobileApps: boolean;
  hasDesigner: boolean;
  hasCms: boolean;
  hasBackup: boolean;
  hasApi: boolean;
  hasIntegrations: boolean;
  features: string[];
}

export interface License {
  id: string;
  code: string;
  activatedAt: number;
  expiresAt: number;
  plan: SaaSPlanId;
  maxUsers: number;
  maxPatients: number;
  features: string[]; // e.g. ["agenda", "financeiro", "documentos", "designer", "api"]
  status: 'Ativa' | 'Suspensa' | 'Expirada';
  tenantId: string;
}

export interface Tenant {
  id: string; // matches tenantId
  name: string; // Nome da Clínica / Nome Fantasia
  clinicName?: string;
  professionalName?: string; // Nome do Psicólogo / Profissional Responsável
  subdomain?: string;
  crp?: string;
  cpfCnpj?: string;
  phone?: string;
  whatsApp?: string;
  ownerEmail: string; // Email de acesso principal
  adminEmail?: string;
  adminPassword?: string; // Senha de acesso do cliente
  status: 'Ativo' | 'Bloqueado' | 'Teste' | 'Suspenso' | 'Cancelado';
  plan?: SaaSPlanId;
  subscriptionId?: string;
  createdAt: number;
  updatedAt?: number;
  integrations?: {
    google?: any;
    mercadoPago?: any;
    firebase?: any;
  };
  permissions?: string[];
}


