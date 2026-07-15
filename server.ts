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
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Client App and Firestore
const clientApp = initializeClientApp(firebaseConfig);
const clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
const clientAuth = getClientAuth(clientApp);

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
    console.log("Initial sign-in failed, attempting to register server admin user...", err.message);
    try {
      await createUserWithEmailAndPassword(clientAuth, email, password);
      isServerAuthenticated = true;
      console.log("Server admin user created and signed in successfully.");
    } catch (createErr: any) {
      console.error("Failed to authenticate server:", createErr.message);
    }
  }
}

// Custom wrapper object acting exactly like Firebase Admin Firestore SDK
const db = {
  collection(collectionName: string) {
    return {
      async get() {
        await ensureAuthenticated();
        const snap = await getClientDocs(clientCollection(clientDb, collectionName));
        return {
          docs: snap.docs.map(d => ({
            id: d.id,
            data() {
              return d.data();
            },
            exists: true
          }))
        };
      },
      async add(data: any) {
        await ensureAuthenticated();
        const ref = await clientAddDoc(clientCollection(clientDb, collectionName), data);
        return { id: ref.id };
      },
      doc(id: string) {
        return {
          async get() {
            await ensureAuthenticated();
            const d = await getClientDoc(clientDoc(clientDb, collectionName, id));
            return {
              id: d.id,
              exists: d.exists(),
              data() {
                return d.data();
              }
            };
          },
          async set(data: any) {
            await ensureAuthenticated();
            await clientSetDoc(clientDoc(clientDb, collectionName, id), data);
          },
          async update(data: any) {
            await ensureAuthenticated();
            await clientUpdateDoc(clientDoc(clientDb, collectionName, id), data);
          },
          async delete() {
            await ensureAuthenticated();
            await clientDeleteDoc(clientDoc(clientDb, collectionName, id));
          }
        };
      }
    };
  }
};

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes go here FIRST

// 1. Book an appointment
app.post("/api/appointments/book", async (req, res) => {
  try {
    const { serviceId, serviceTitle, patientName, patientEmail, patientPhone, date, timeSlot, amount, paymentMethod } = req.body;

    if (!serviceId || !patientName || !patientEmail || !patientPhone || !date || !timeSlot || !amount) {
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

        const mpResult = await mpResponse.json();
        if (mpResponse.ok && mpResult.point_of_interaction?.transaction_data) {
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
    } else if (isRealMP && paymentMethod === "credit_card") {
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

        const mpResult = await mpResponse.json();
        if (mpResponse.ok && mpResult.id) {
          paymentData = {
            type: "credit_card",
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

    // If still fallback simulator or created empty, generate dynamic simulator credentials
    if (!paymentData.qrCode && paymentMethod === "pix") {
      paymentData = {
        type: "simulator",
        qrCode: `00020101021226930014br.gov.bcb.pix2571pix.ericacostapsi.com/qr/booking/${appointmentId}5204000053039865405${Number(amount).toFixed(2)}5802BR5911Erica Costa6009Fortaleza62070503***6304${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
        // Clean elegant procedural mock QR Base64 or a styled design
        qrCodeBase64: "" // Frontend can render with a QR library or nice styled placeholder SVG
      };
    } else if (!paymentData.initPoint && paymentMethod === "credit_card") {
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
    return res.status(500).json({ error: error.message });
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
        const paymentInfo = await mpResponse.json();
        if (paymentInfo.status === "approved") {
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
