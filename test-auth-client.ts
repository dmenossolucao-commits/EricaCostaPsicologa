import firebaseConfig from "./firebase-applet-config.json";

async function testFullFlow() {
  const apiKey = firebaseConfig.apiKey;
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const email = "dmenossolucao@gmail.com";
  const password = "F@b486875";

  console.log("--- REAL CLIENT FLOW AUDIT ---");
  console.log(`Email: ${email}`);

  // 1. Authenticate with Password
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  let idToken = "";
  let uid = "";
  try {
    const res = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const authData = await res.json();
    console.log(`Auth Sign-In Status: ${res.status}`);
    
    if (res.ok) {
      console.log("✅ LOGIN REALIZADO COM SUCESSO!");
      idToken = authData.idToken;
      uid = authData.localId;
      console.log(`- Local UID: ${uid}`);
    } else {
      console.log("❌ LOGIN FALHOU via REST API.");
      console.log("Erro:", JSON.stringify(authData, null, 2));
      
      // Let's also check if the user is missing and we should try to create it
      if (authData.error?.message === "EMAIL_NOT_FOUND" || authData.error?.message === "INVALID_LOGIN_CREDENTIALS") {
        console.log("\nTentando criar o usuário master no Firebase Auth...");
        const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
        const signUpRes = await fetch(signUpUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const signUpData = await signUpRes.json();
        console.log(`Sign-Up Status: ${signUpRes.status}`);
        if (signUpRes.ok) {
          console.log("✅ USUÁRIO CRIADO COM SUCESSO NO AUTH!");
          idToken = signUpData.idToken;
          uid = signUpData.localId;
          console.log(`- Novo UID: ${uid}`);
        } else {
          console.log("❌ FALHA AO CRIAR USUÁRIO NO AUTH:", JSON.stringify(signUpData, null, 2));
        }
      }
    }
  } catch (err: any) {
    console.error("Erro na autenticação:", err.message);
  }

  // 2. If authenticated, fetch the Firestore document
  if (idToken && uid) {
    console.log(`\nBuscando documento no Firestore em /admins/${uid} usando o ID Token...`);
    const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/admins/${uid}`;
    try {
      const res = await fetch(docUrl, {
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });
      console.log(`Fetch Document Status: ${res.status}`);
      const docData = await res.json();
      if (res.ok) {
        console.log("✅ DOCUMENTO FIRESTORE EXISTE!");
        console.log("Campos do documento:");
        const fields = docData.fields || {};
        const parsedFields: any = {};
        for (const [key, val] of Object.entries(fields)) {
          const valueObj: any = val;
          parsedFields[key] = valueObj.stringValue || valueObj.booleanValue || valueObj.integerValue || JSON.stringify(valueObj);
        }
        console.log(JSON.stringify(parsedFields, null, 2));
      } else {
        console.log("❌ DOCUMENTO FIRESTORE NÃO EXISTE OU FALHOU:");
        console.log(JSON.stringify(docData, null, 2));

        // If the document doesn't exist, let's create it!
        if (res.status === 404) {
          console.log("\nCriando o documento Firestore correspondente em /admins/[UID]...");
          const createDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/admins/${uid}?key=${apiKey}`;
          
          const fieldsData = {
            fields: {
              email: { stringValue: email },
              role: { stringValue: "master" },
              tenantId: { stringValue: "mentecare_platform" },
              status: { stringValue: "active" },
              plan: { stringValue: "enterprise" },
              isMaster: { booleanValue: true }
            }
          };

          const createRes = await fetch(createDocUrl, {
            method: "PATCH", // Using PATCH on a specific document path acts as setDoc
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify(fieldsData)
          });

          console.log(`Create Document Status: ${createRes.status}`);
          const createData = await createRes.json();
          if (createRes.ok) {
            console.log("✅ DOCUMENTO FIRESTORE CRIADO COM SUCESSO!");
            console.log(JSON.stringify(createData, null, 2));
          } else {
            console.log("❌ FALHA AO CRIAR DOCUMENTO NO FIRESTORE:", JSON.stringify(createData, null, 2));
          }
        }
      }
    } catch (err: any) {
      console.error("Erro ao ler/escrever no Firestore:", err.message);
    }
  }

  console.log("\n--- FIM DO TESTE ---");
}

testFullFlow();
