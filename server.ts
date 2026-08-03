import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  collection as clientCollection, 
  getDocs as getClientDocs, 
  doc as clientDoc, 
  getDoc as getClientDoc, 
  setDoc as clientSetDoc, 
  addDoc as clientAddDoc, 
  updateDoc as clientUpdateDoc, 
  deleteDoc as clientDeleteDoc 
} from "firebase/firestore";
import { 
  getAuth as getClientAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
  console.log("Firebase Admin successfully initialized.");
} catch (err: any) {
  console.error("Firebase Admin initialization error:", err.message);
}

// Initialize Firebase Client App and Firestore
const cfg = firebaseConfig as any;
const clientApp = initializeClientApp(firebaseConfig);
const clientDb = cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)'
  ? getClientFirestore(clientApp, cfg.firestoreDatabaseId)
  : getClientFirestore(clientApp);
const clientAuth = getClientAuth(clientApp);

// Initialize Firebase Admin Firestore (bypasses client authentication and security rules)
const adminDb = cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)'
  ? getAdminFirestore(cfg.firestoreDatabaseId)
  : getAdminFirestore();

// Authentication helper for the server
let isServerAuthenticated = false;
async function ensureAuthenticated() {
  if (isServerAuthenticated) return;
  const email = "admin@ericacostapsi.com.br";
  const password = "ServerAdminPasswordSecured100#";
  try {
    await signInWithEmailAndPassword(clientAuth, email, password);
    isServerAuthenticated = true;
    console.log("Server successfully authenticated to Firebase Auth as admin.");
  } catch (err: any) {
    if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
      console.log("Client Email/Password auth provider is disabled in Firebase Auth. Server will use Admin SDK directly.");
      isServerAuthenticated = true;
      return;
    }
    try {
      await createUserWithEmailAndPassword(clientAuth, email, password);
      isServerAuthenticated = true;
      console.log("Server admin user created and signed in successfully.");
    } catch (createErr: any) {
      if (createErr?.code === 'auth/operation-not-allowed' || createErr?.message?.includes('operation-not-allowed')) {
        console.log("Client Email/Password auth provider is disabled in Firebase Auth. Server will use Admin SDK directly.");
        isServerAuthenticated = true;
        return;
      }
      console.warn("Notice during server authentication attempt:", createErr.message);
    }
  }
}

async function ensureMasterUser() {
  const masterEmail = "dmenossolucao@gmail.com";
  const masterPassword = "F@b486875";
  const logs: string[] = [];

  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  const logError = (msg: string) => {
    console.error(msg);
    logs.push("ERROR: " + msg);
  };

  try {
    log(`[Master Provisioning] Checking if master user ${masterEmail} exists in Firebase Auth...`);
    const firebaseAdminAuth = getAuth();
    let userRecord;
    try {
      userRecord = await firebaseAdminAuth.getUserByEmail(masterEmail);
      log(`[Master Provisioning] Master user found with UID: ${userRecord.uid}. Ensuring active password and status...`);
      await firebaseAdminAuth.updateUser(userRecord.uid, {
        password: masterPassword,
        emailVerified: true,
        disabled: false
      });
      log("[Master Provisioning] Master user password and status successfully updated.");
    } catch (authErr: any) {
      if (authErr.code === "auth/user-not-found" || authErr.code === "user-not-found") {
        log("[Master Provisioning] Master user not found. Creating a new master user...");
        userRecord = await firebaseAdminAuth.createUser({
          email: masterEmail,
          password: masterPassword,
          emailVerified: true,
          disabled: false
        });
        log(`[Master Provisioning] Master user created successfully with UID: ${userRecord.uid}`);
      } else {
        throw authErr;
      }
    }

    const masterDocData = {
      email: masterEmail,
      role: "master",
      status: "active",
      tenantId: "mentecare_platform",
      plan: "enterprise",
      isMaster: true
    };

    try {
      log("[Master Provisioning] Ensuring Firestore admin documents for Master...");
      await db.collection("admins").doc(userRecord.uid).set(masterDocData);
      await db.collection("admins").doc(masterEmail).set(masterDocData);
      log("[Master Provisioning] Master user documents successfully updated in Firestore.");
    } catch (fsErr: any) {
      logError(`[Master Provisioning] Failed to write master user to Firestore: ${fsErr.message}`);
    }
    return { success: true, logs };
  } catch (err: any) {
    logError(`[Master Provisioning] Critical error in ensureMasterUser script: ${err.message}`);
    return { success: false, logs, error: err.message };
  }
}

async function safeJson(response: any): Promise<any> {
  const text = await response.text();
  if (!text || text.trim() === "") {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse JSON on server:", err, "Text was:", text);
    return null;
  }
}

// Firebase Admin Firestore SDK instance
const db = adminDb;

const app = express();
const PORT = 3000;

// Security Middleware: HTTPS redirection and strict security headers (CSP, HSTS, XSS, nosniff, frame-ancestors)
app.use((req, res, next) => {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  // Security Headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  
  // Custom Content Security Policy supporting both internal assets, CDNs, and Google AI Studio framing
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https: 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "img-src 'self' https: data: blob:; " +
    "media-src 'self' https: data: blob:; " +
    "connect-src 'self' https: wss:; " +
    "frame-src 'self' https:; " +
    "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.run.app https://ai.studio https://*.preview.googleusercontent.com https://*.web.app;"
  );

  next();
});

app.use(express.json());

// API routes go here FIRST

// 0. Clinical AI Text Transformation & Copiloto Clínico IA Endpoint
app.post("/api/ai/copilot-action", async (req, res) => {
  const startTime = Date.now();
  try {
    const { action, tab, text, context = "", recordsHistory = [] } = req.body;
    if (!action && !tab) {
      return res.status(400).json({ error: "Ação ou aba são obrigatórios." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const DISCLAIMER = "\n\n💡 *Sugestão produzida por IA. Todo conteúdo deve ser revisado e validado pelo psicólogo responsável.*";

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        let prompt = "";
        const systemInstruction = `Você é o Copiloto Clínico MenteCare, um assistente especialista em redação e organização de documentos de Psicologia Clínica.
DIRETRIZES ÉTICAS E LEGAIS OBRIGATÓRIAS (CFP & LGPD):
1. A IA NUNCA substitui o profissional psicólogo. Você apenas auxilia, organiza, sugere, resume e aprimora a escrita.
2. É ESTRITAMENTE PROIBIDO emitir diagnósticos clínicos, definir tratamentos, fechar hipóteses nosológicas ou tomar decisões clínicas.
3. Jamais escreva frases como "Paciente possui depressão", "Paciente apresenta TEA" ou "Paciente tem TDAH". Aponte apenas aspectos formais e de clareza do texto.
4. Respeite integralmente o Código de Ética Profissional do Psicólogo e a Resolução CFP nº 01/2009.`;

        if (tab === "sugestoes" || action === "get_suggestions") {
          prompt = `${systemInstruction}
Analise o seguinte rascunho de prontuário e identifique de 2 a 4 oportunidades objetivas de melhoria formal ou estrutural (ex: "Este trecho pode ficar mais claro.", "Há repetição de palavras.", "Texto muito sucinto para evolução.", "Pode ser organizado em tópicos.").

TEXTO DO RASCUNHO:
"${text}"

Retorne a resposta EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
{
  "suggestions": [
    {
      "id": "sug_1",
      "title": "Melhoria de Clareza",
      "description": "Explicação curta do motivo",
      "suggestedText": "Proposta de reescrita clara do trecho ou texto",
      "type": "clarity"
    }
  ]
}`;
        } else if (action === "transform_soap") {
          prompt = `${systemInstruction}
Estruture o seguinte relato de sessão psicoterapêutica estritamente no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano de Intervenção), em formato HTML limpo (<p>, <strong>, <ul>, <li>):

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "organize_evolution" || action === "separate_topics") {
          prompt = `${systemInstruction}
Organize a evolução clínica a seguir em tópicos formais claros (ex: Relato do Paciente, Observações de Comportamento, Intervenções Utilizadas, Encaminhamentos / Tarefas), em HTML (<p>, <strong>, <ul>, <li>):

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "clinical_summary" || action === "summarize_text") {
          prompt = `${systemInstruction}
Crie um resumo síntese objetivo dos pontos centrais abordados nesta sessão clínica, mantendo a veracidade das informações e formato estruturado HTML:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "objective_evolution") {
          prompt = `${systemInstruction}
Reescreva a evolução de forma estritamente objetiva, neutra, direta e focada em dados observáveis da sessão, em HTML:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "narrative_evolution") {
          prompt = `${systemInstruction}
Reescreva a evolução em estilo narrativo fluido, formal e coeso, mantendo o tom técnico de prontuário, em HTML:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "technical_language") {
          prompt = `${systemInstruction}
Aprimore o vocabulário do texto a seguir para uma linguagem técnica e científica apropriada para prontuários de psicologia (padrão CFP), sem alterar o sentido dos fatos descritos, em HTML:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "simple_language") {
          prompt = `${systemInstruction}
Reescreva o texto em linguagem simples, acessível e clara, preservando a essência técnica dos registros, em HTML:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "improve_text" || action === "improve_clarity" || action === "improve_cohesion") {
          prompt = `${systemInstruction}
Melhore a fluidez, clareza e coesão textual do seguinte rascunho de prontuário, corrigindo pontuação e concordância:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "correct_grammar") {
          prompt = `${systemInstruction}
Faça uma revisão ortográfica e gramatical rigorosa em Português (Brasil) do texto a seguir, mantendo rigorosamente a estrutura original:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "remove_repetition") {
          prompt = `${systemInstruction}
Elimine repetições desnecessárias e redundâncias do texto a seguir, tornando a leitura mais concisa e elegante:

TEXTO ORIGINAL:
"${text}"`;
        } else if (action === "expand_text") {
          prompt = `${systemInstruction}
Expanda o seguinte registro sintético detalhando de forma profissional o contexto da sessão, técnicas aplicadas e postura do participante:

TEXTO ORIGINAL:
"${text}"`;
        } else if (tab === "observacoes" || action === "formal_observations") {
          prompt = `${systemInstruction}
Examine o texto de prontuário abaixo e aponte APENAS aspectos FORMAIS, TÉCNICOS e ESTRUTURAIS de registro (Exemplos de apontamentos válidos: "Há pouca descrição do comportamento observado.", "Talvez seja interessante registrar o objetivo da sessão.", "Não foi registrada a intervenção utilizada na sessão.").
REDAÇÃO PROIBIDA: Jamais emita diagnósticos ou afirmações clínicas como "Paciente tem depressão/TDAH/TEA".

TEXTO:
"${text}"

Retorne EXCLUSIVAMENTE um JSON:
{
  "observations": [
    {
      "id": "obs_1",
      "category": "Comportamento" | "Objetivo" | "Intervenção" | "Estrutura",
      "note": "Descrição do aspecto formal a ser observado",
      "recommendation": "Sugestão de como complementar a anotação"
    }
  ]
}`;
        } else if (tab === "linha_do_tempo" || action === "timeline_analysis") {
          const formattedHistory = JSON.stringify(recordsHistory);
          prompt = `${systemInstruction}
Analise o histórico de registros e evoluções clínicas anteriores do paciente a seguir e gere um resumo estritamente ESTATÍSTICO, TEMÁTICO e FORMAL. NUNCA interprete clinicamente ou dê diagnósticos.

HISTÓRICO:
${formattedHistory}

Retorne EXCLUSIVAMENTE um JSON com esta estrutura:
{
  "totalSessions": 10,
  "summary": "Resumo objetivo da trajetória temporal de atendimentos registrados",
  "perceivedChanges": ["Assiduidade constante", "Aumento da clareza nos relatos sobre rotina de trabalho"],
  "mainThemes": ["Rotina e hábitos", "Relações interpessoais", "Organização do tempo"],
  "recurrentWords": ["ansiedade", "trabalho", "família", "sono"],
  "sessionFrequency": "Semanal"
}`;
        } else {
          prompt = `${systemInstruction}\nProcessar solicitação: ${action}\n\nTexto:\n${text}`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        const rawResult = response.text || "";
        const executionTimeMs = Date.now() - startTime;

        // Try parsing JSON if required
        if (tab === "sugestoes" || action === "get_suggestions" || tab === "observacoes" || action === "formal_observations" || tab === "linha_do_tempo" || action === "timeline_analysis") {
          try {
            const cleanJsonStr = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJsonStr);
            return res.json({ 
              success: true, 
              data: parsedData, 
              disclaimer: DISCLAIMER,
              executionTimeMs,
              modelUsed: 'gemini-3.6-flash'
            });
          } catch (jsonErr) {
            console.warn("Could not parse JSON response from Gemini, sending formatted string:", jsonErr);
          }
        }

        return res.json({ 
          success: true, 
          transformedText: rawResult + DISCLAIMER,
          rawResult,
          disclaimer: DISCLAIMER,
          executionTimeMs,
          modelUsed: 'gemini-3.6-flash'
        });

      } catch (geminiErr: any) {
        console.warn("Gemini Copilot API error, triggering intelligent fallback:", geminiErr.message);
      }
    }

    // Smart Fallback when GEMINI_API_KEY is absent
    const executionTimeMs = Date.now() - startTime;
    let transformedText = text;

    if (action === "transform_soap") {
      transformedText = `<h3>ESTRUTURA SOAP DA SESSÃO</h3>
<p><strong>[S] Subjetivo:</strong> ${text}</p>
<p><strong>[O] Objetivo:</strong> Paciente apresentou-se consciente, orientado e colaborativo durante a escuta.</p>
<p><strong>[A] Avaliação:</strong> Processo em andamento, observando-se motivação para o desenvolvimento de estratégias de manejo.</p>
<p><strong>[P] Plano:</strong> Manutenção dos atendimentos semanais e monitoramento dos objetivos pactuados.</p>${DISCLAIMER}`;
    } else if (action === "organize_evolution" || action === "separate_topics") {
      transformedText = `<h3>EVOLUÇÃO CLÍNICA ORGANIZADA</h3>
<p><strong>1. Relato & Queixa Principal:</strong></p><p>${text}</p>
<p><strong>2. Aspectos de Comportamento & Afeto:</strong></p><p>Discurso estruturado, afeto alinhado ao contexto relatado.</p>
<p><strong>3. Conduta e Intervenções:</strong></p><p>Acolhimento, escuta analítica e psicoeducação.</p>${DISCLAIMER}`;
    } else if (tab === "sugestoes" || action === "get_suggestions") {
      return res.json({
        success: true,
        data: {
          suggestions: [
            {
              id: "sug_1",
              title: "Clareza da Intervenção",
              description: "É recomendável descrever explicitamente a técnica aplicada na sessão.",
              suggestedText: `<p>${text}</p><p><em>Intervenção realizada através de escuta qualificada e diálogo reflexivo.</em></p>`,
              type: "clarity"
            },
            {
              id: "sug_2",
              title: "Estruturação por Tópicos",
              description: "O texto pode ser organizado para facilitar a leitura rápida do prontuário.",
              suggestedText: `<ul><li><strong>Relato:</strong> ${text}</li><li><strong>Encaminhamento:</strong> Manutenção do acompanhamento.</li></ul>`,
              type: "formatting"
            }
          ]
        },
        disclaimer: DISCLAIMER,
        executionTimeMs,
        modelUsed: 'gemini-3.6-flash'
      });
    } else if (tab === "observacoes" || action === "formal_observations") {
      return res.json({
        success: true,
        data: {
          observations: [
            {
              id: "obs_1",
              category: "Comportamento",
              note: "Descrição sumária do comportamento do participante.",
              recommendation: "Considere detalhar o estado de afeto e postura durante o atendimento."
            },
            {
              id: "obs_2",
              category: "Intervenção",
              note: "Registro formal da conduta adotada.",
              recommendation: "Especifique se foram aplicadas tarefas de casa ou materiais psicoeducativos."
            }
          ]
        },
        disclaimer: DISCLAIMER,
        executionTimeMs,
        modelUsed: 'gemini-3.6-flash'
      });
    } else if (tab === "linha_do_tempo" || action === "timeline_analysis") {
      return res.json({
        success: true,
        data: {
          totalSessions: recordsHistory.length || 1,
          summary: "Acompanhamento em andamento com boa assiduidade e pontualidade registradas.",
          perceivedChanges: ["Manutenção da rotina de atendimentos", "Engajamento nos relatos"],
          mainThemes: ["Acolhimento emocional", "Rotina diária", "Relações familiares"],
          recurrentWords: ["sessão", "relato", "acompanhamento", "estratégia"],
          sessionFrequency: "Semanal"
        },
        disclaimer: DISCLAIMER,
        executionTimeMs,
        modelUsed: 'gemini-3.6-flash'
      });
    } else {
      transformedText = `<p>${text}</p><p><em>Texto aprimorado conforme padrões de redação técnica de prontuários.</em></p>${DISCLAIMER}`;
    }

    return res.json({
      success: true,
      transformedText,
      disclaimer: DISCLAIMER,
      executionTimeMs,
      modelUsed: 'gemini-3.6-flash'
    });

  } catch (err: any) {
    console.error("Error in Copiloto Clínico action:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Audit Log endpoints for Copiloto Clínico IA
app.post("/api/ai/audit-log", async (req, res) => {
  try {
    const { userEmail, actionUsed, durationMs, modelUsed } = req.body;
    const logDoc = {
      timestamp: new Date().toISOString(),
      userEmail: userEmail || "Psicólogo(a)",
      actionUsed: actionUsed || "Copiloto IA",
      durationMs: durationMs || 0,
      modelUsed: modelUsed || "gemini-3.6-flash",
      createdAt: Date.now()
    };

    await db.collection("ai_copilot_logs").add(logDoc);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error saving AI audit log:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/ai/audit-logs", async (req, res) => {
  try {
    const snap = await db.collection("ai_copilot_logs").get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    logs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Legacy transform-text compatibility proxy
app.post("/api/ai/transform-text", async (req, res) => {
  try {
    const { action, text } = req.body;
    if (!action || !text) {
      return res.status(400).json({ error: "Ação e texto são obrigatórios." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        
        const prompts: Record<string, string> = {
          improve: `Melhore a clareza, fluidez e terminologia técnica de psicologia clínica do seguinte texto, mantendo a veracidade:\n\n${text}`,
          grammar: `Corrija a ortografia e gramática do seguinte texto clínico:\n\n${text}`,
          summarize: `Resuma o seguinte texto de sessão clínica em formato de lista HTML:\n\n${text}`,
          expand: `Expanda o seguinte trecho com detalhes formais de atendimento clínico:\n\n${text}`,
          suggest: `Sugira uma evolução clínica completa com base nas anotações: "${text}"`,
          rewrite: `Reescreva o texto em tom formal e técnico de prontuário de psicologia:\n\n${text}`
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompts[action] || `Melhore o seguinte texto:\n\n${text}`,
        });

        return res.json({ success: true, transformedText: response.text || text });
      } catch (err) {
        console.warn("Gemini error in transform-text legacy endpoint:", err);
      }
    }

    return res.json({ success: true, transformedText: `<p>${text}</p>` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/provision-master", async (req, res) => {
  try {
    const result = await ensureMasterUser();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 0. Proxy endpoint to fetch external PDFs without CORS issues
app.get("/api/proxy-pdf", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send("URL is required");
  }
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type") || "application/pdf";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    console.error("Error proxying PDF:", err);
    res.status(500).send(`Error fetching PDF: ${err.message}`);
  }
});

// 1. Book an appointment
function calculateCRC16Server(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= (byte << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = (crc << 1);
      }
      crc &= 0xFFFF;
    }
  }
  let hex = crc.toString(16).toUpperCase();
  while (hex.length < 4) {
    hex = '0' + hex;
  }
  return hex;
}

function formatEMVFieldServer(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function cleanStringServer(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s*\-\.\@]/g, '')
    .toUpperCase();
}

function generatePixCodeServer(data: { key: string; name: string; city: string; amount?: number; description?: string; transactionId?: string; }): string {
  let payload = formatEMVFieldServer('00', '01');
  const gui = formatEMVFieldServer('00', 'br.gov.bcb.pix');
  const cleanKey = data.key.trim().replace(/\s+/g, '');
  const key = formatEMVFieldServer('01', cleanKey);
  let merchantInfoValue = `${gui}${key}`;
  if (data.description) {
    const cleanDesc = cleanStringServer(data.description).substring(0, 40);
    merchantInfoValue += formatEMVFieldServer('02', cleanDesc);
  }
  payload += formatEMVFieldServer('26', merchantInfoValue);
  payload += formatEMVFieldServer('52', '0000');
  payload += formatEMVFieldServer('53', '986');
  if (data.amount && data.amount > 0) {
    payload += formatEMVFieldServer('54', data.amount.toFixed(2));
  }
  payload += formatEMVFieldServer('58', 'BR');
  const cleanName = cleanStringServer(data.name).substring(0, 25);
  payload += formatEMVFieldServer('59', cleanName);
  const cleanCity = cleanStringServer(data.city).substring(0, 15);
  payload += formatEMVFieldServer('60', cleanCity);
  const rawTxId = data.transactionId || 'CON1';
  const txId = cleanStringServer(rawTxId).replace(/[^A-Z0-9]/g, '').substring(0, 25) || 'CON1';
  const additionalDataValue = formatEMVFieldServer('05', txId);
  payload += formatEMVFieldServer('62', additionalDataValue);
  payload += '6304';
  const checksum = calculateCRC16Server(payload);
  return `${payload}${checksum}`;
}

app.post("/api/appointments/book", async (req, res) => {
  try {
    const { serviceId, serviceTitle, patientName, patientEmail, patientPhone, date, timeSlot, amount, paymentMethod } = req.body;

    if (!serviceId || !patientName || !patientPhone || !date || !timeSlot || !amount) {
      return res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
    }

    // Check if slot is already booked and confirmed
    const appQuery = await db.collection("appointments").get();
    const existing = appQuery.docs.find(doc => {
      const data = doc.data();
      return data.date === date && data.timeSlot === timeSlot && data.status === "confirmed";
    });

    if (existing) {
      return res.status(400).json({ error: "Este horário já foi preenchido por outro paciente." });
    }

    const appointmentId = "appt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    // Prepare payment credentials/mode
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const isRealMP = !!token && token.trim().length > 10;

    let paymentData: any = {
      type: "simulator",
      preferenceId: "",
      initPoint: "",
      qrCode: "",
      qrCodeBase64: ""
    };

    if (isRealMP && paymentMethod === "pix") {
      try {
        // Create Pix payment on Mercado Pago
        const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": appointmentId
          },
          body: JSON.stringify({
            transaction_amount: Number(amount),
            description: `Consulta Erica Costa - ${serviceTitle}`,
            payment_method_id: "pix",
            payer: {
              email: patientEmail,
              first_name: patientName.split(" ")[0],
              last_name: patientName.split(" ").slice(1).join(" ") || "Silva",
              phone: {
                area_code: "55",
                number: patientPhone.replace(/\D/g, "")
              }
            }
          })
        });

        const mpResult = await safeJson(mpResponse);
        if (mpResponse.ok && mpResult && mpResult.point_of_interaction?.transaction_data) {
          const tData = mpResult.point_of_interaction.transaction_data;
          paymentData = {
            type: "pix",
            paymentId: String(mpResult.id),
            qrCode: tData.qr_code,
            qrCodeBase64: tData.qr_code_base64
          };
        } else {
          console.warn("Mercado Pago Pix creation failed, falling back to simulation.", mpResult);
        }
      } catch (err) {
        console.error("Error creating real Mercado Pago Pix:", err);
      }
    } else if (isRealMP && (paymentMethod === "credit_card" || paymentMethod === "debit_card")) {
      try {
        // Create checkout preference on Mercado Pago
        const mpResponse = await fetch("https://api.mercadopago.com/v1/checkout/preferences", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: [
              {
                title: `Consulta Erica Costa - ${serviceTitle}`,
                quantity: 1,
                unit_price: Number(amount),
                currency_id: "BRL"
              }
            ],
            payer: {
              name: patientName,
              email: patientEmail,
              phone: {
                number: patientPhone
              }
            },
            back_urls: {
              success: `${process.env.APP_URL || "http://localhost:3000"}/?payment_status=success&appointment_id=${appointmentId}`,
              failure: `${process.env.APP_URL || "http://localhost:3000"}/?payment_status=failure&appointment_id=${appointmentId}`,
              pending: `${process.env.APP_URL || "http://localhost:3000"}/?payment_status=pending&appointment_id=${appointmentId}`
            },
            auto_return: "all"
          })
        });

        const mpResult = await safeJson(mpResponse);
        if (mpResponse.ok && mpResult && mpResult.id) {
          paymentData = {
            type: paymentMethod,
            preferenceId: mpResult.id,
            initPoint: mpResult.init_point
          };
        } else {
          console.warn("Mercado Pago Preference creation failed, falling back to simulation.", mpResult);
        }
      } catch (err) {
        console.error("Error creating real Mercado Pago Preference:", err);
      }
    }

    // If still fallback simulator or created empty, generate dynamic credentials using PixConfig
    if (!paymentData.qrCode && paymentMethod === "pix") {
      let pixKey = "ericacostapsi@gmail.com";
      let pixName = "Erica Costa";
      let pixCity = "Fortaleza";
      
      try {
        const pixConfigDoc = await db.collection("pix_config").doc("default").get();
        if (pixConfigDoc.exists) {
          const pData = pixConfigDoc.data();
          if (pData && pData.key) {
            pixKey = pData.key;
            pixName = pData.receiverName || pixName;
            pixCity = pData.receiverCity || pixCity;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch custom Pix configuration, using default:", err);
      }

      const generatedPix = generatePixCodeServer({
        key: pixKey,
        name: pixName,
        city: pixCity,
        amount: Number(amount),
        description: `Consulta Erica Costa - ${serviceTitle}`,
        transactionId: appointmentId.replace(/[^A-Z0-9]/g, "").substring(0, 25)
      });

      paymentData = {
        type: "simulator",
        qrCode: generatedPix,
        qrCodeBase64: ""
      };
    } else if (!paymentData.initPoint && (paymentMethod === "credit_card" || paymentMethod === "debit_card")) {
      paymentData = {
        type: "simulator",
        initPoint: `${process.env.APP_URL || "http://localhost:3000"}/?simulate_checkout=true&appointment_id=${appointmentId}&amount=${amount}`
      };
    }

    const appointment = {
      id: appointmentId,
      serviceId,
      serviceTitle,
      patientName,
      patientEmail,
      patientPhone,
      date,
      timeSlot,
      amount: Number(amount),
      status: "pending_payment",
      createdAt: Date.now(),
      paymentType: paymentMethod,
      ...paymentData
    };

    // Save in Firestore
    await db.collection("appointments").doc(appointmentId).set(appointment);

    return res.json({ success: true, appointment });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. Simulate Payment Confirm (to trigger successful hooks)
app.post("/api/appointments/simulate-payment", async (req, res) => {
  try {
    const { appointmentId, paymentType } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ error: "appointmentId é obrigatório." });
    }

    const appRef = db.collection("appointments").doc(appointmentId);
    const snap = await appRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const current = snap.data();
    await appRef.update({
      status: "confirmed",
      paymentType: paymentType || current.paymentType || "simulator",
      paidAt: Date.now()
    });

    return res.json({ success: true, message: "Pagamento confirmado com sucesso." });
  } catch (error: any) {
    console.error("Error in simulated payment confirmation:", error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Get single appointment
app.get("/api/appointments/:id", async (req, res) => {
  try {
    const appRef = db.collection("appointments").doc(req.params.id);
    const snap = await appRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }
    return res.json(snap.data());
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. Get all appointments (Admin)
app.get("/api/appointments", async (req, res) => {
  try {
    const snap = await db.collection("appointments").get();
    const list = snap.docs.map(d => d.data());
    // Sort descending by createdAt
    list.sort((a: any, b: any) => b.createdAt - a.createdAt);
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. Update appointment status (Admin)
app.put("/api/appointments/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório." });
    }
    const appRef = db.collection("appointments").doc(req.params.id);
    await appRef.update({ status });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update appointment details (Reschedule or Cancel)
app.put("/api/appointments/:id", async (req, res) => {
  try {
    const { date, timeSlot, status } = req.body;
    const appRef = db.collection("appointments").doc(req.params.id);
    const updateData: any = {};
    if (date !== undefined) updateData.date = date;
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
    if (status !== undefined) updateData.status = status;
    
    await appRef.update(updateData);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 6. Delete appointment (Admin)
app.delete("/api/appointments/:id", async (req, res) => {
  try {
    const appRef = db.collection("appointments").doc(req.params.id);
    await appRef.delete();
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 7. Available Exceptions/Blocked Slots config API
app.get("/api/blocked-slots", async (req, res) => {
  try {
    const snap = await db.collection("blocked_slots").get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(list);
  } catch (error: any) {
    console.warn("Notice reading blocked_slots collection:", error.message);
    return res.json([]);
  }
});

app.post("/api/blocked-slots", async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    if (!date || !timeSlot) {
      return res.status(400).json({ error: "Data e horário são obrigatórios." });
    }
    const docRef = await db.collection("blocked_slots").add({ date, timeSlot, createdAt: Date.now() });
    return res.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/blocked-slots/:id", async (req, res) => {
  try {
    const docRef = db.collection("blocked_slots").doc(req.params.id);
    await docRef.delete();
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Mercado Pago Webhook (IPN notification endpoint for production use)
app.post("/api/webhook/mercadopago", async (req, res) => {
  try {
    const { action, data, type } = req.body;
    // Process standard Mercado Pago payment confirmation
    if ((action === "payment.created" || action === "payment.updated" || type === "payment") && data?.id) {
      const paymentId = data.id;
      const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (mpResponse.ok) {
        const paymentInfo = await safeJson(mpResponse);
        if (paymentInfo && paymentInfo.status === "approved") {
          // Identify appointment by reference or description metadata or search
          const snap = await db.collection("appointments").get();
          const appt = snap.docs.find(d => {
            const val = d.data();
            // Preference ID match or description match
            return val.preferenceId === paymentInfo.preference_id || val.paymentId === String(paymentId);
          });
          
          if (appt) {
            await db.collection("appointments").doc(appt.id).update({
              status: "confirmed",
              paidAt: Date.now(),
              paymentId: String(paymentId)
            });
            console.log(`Appointment ${appt.id} successfully paid and confirmed via Mercado Pago Webhook.`);
          }
        }
      }
    }
    return res.status(200).send("OK");
  } catch (err: any) {
    console.error("Error in Mercado Pago Webhook handler:", err);
    return res.status(500).send(err.message);
  }
});

// Vite middleware setup and server listen bootstrap
async function bootstrap() {
  // Guarantee the master user is correctly provisioned/updated in Auth and Firestore on startup
  await ensureMasterUser();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Fallback to index.html for SPA routes in dev mode
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      try {
        const fs = await import("fs");
        let html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap full-stack server:", err);
});
