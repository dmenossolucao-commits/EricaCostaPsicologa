import { 
  db 
} from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { Tenant, License, SaaSPlanId } from '../types';
import { withTimeout, getLocalData, setLocalData } from '../services/contentService';

/**
 * Helper to safely sanitize timestamps or date numbers from Firestore
 */
export function sanitizeTimestamp(val: any, fallback: number): number {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  if (typeof val === 'object') {
    if (typeof val.seconds === 'number') {
      return val.seconds * 1000;
    }
    if (typeof val._seconds === 'number') {
      return val._seconds * 1000;
    }
    if (val.toDate && typeof val.toDate === 'function') {
      try {
        return val.toDate().getTime();
      } catch (e) {}
    }
  }
  const num = Number(val);
  if (!isNaN(num)) return num;
  const parsedDate = Date.parse(val);
  if (!isNaN(parsedDate)) return parsedDate;
  return fallback;
}

/**
 * TenantRepository - Single source of truth for Firestore tenant & license persistence.
 * Isolates data operations, ensures single listener management and LGPD data isolation.
 */
export class TenantRepository {
  /**
   * Subscribe to real-time updates on the 'tenants' collection.
   */
  subscribeTenants(onUpdate: (tenants: Tenant[]) => void, onError?: (err: any) => void): () => void {
    try {
      const colRef = collection(db, 'tenants');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const remoteList = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              name: data.name || data.clinicName || d.id,
              createdAt: sanitizeTimestamp(data.createdAt, Date.now()),
              updatedAt: sanitizeTimestamp(data.updatedAt, Date.now()),
              status: data.status || 'Ativo',
              ownerEmail: data.ownerEmail || data.email || ''
            } as Tenant;
          });
          setLocalData('tenants', remoteList);
          onUpdate(remoteList);
        },
        (error) => {
          console.warn('Real-time tenant listener warning:', error);
          if (onError) onError(error);
          this.getTenants().then(onUpdate).catch(() => {});
        }
      );
    } catch (err) {
      console.warn('Could not establish real-time tenant listener:', err);
      if (onError) onError(err);
      this.getTenants().then(onUpdate).catch(() => {});
      return () => {};
    }
  }

  /**
   * Subscribe to real-time updates on the 'licenses' collection.
   */
  subscribeLicenses(onUpdate: (licenses: License[]) => void, onError?: (err: any) => void): () => void {
    try {
      const colRef = collection(db, 'licenses');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const remoteList = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              tenantId: data.tenantId || '',
              plan: data.plan || 'Pro',
              status: data.status || 'Ativa',
              activatedAt: sanitizeTimestamp(data.activatedAt || data.startDate, Date.now()),
              expiresAt: sanitizeTimestamp(data.expiresAt || data.expirationDate, Date.now() + 365 * 24 * 60 * 60 * 1000)
            } as License;
          });
          setLocalData('licenses', remoteList);
          onUpdate(remoteList);
        },
        (error) => {
          console.warn('Real-time license listener warning:', error);
          if (onError) onError(error);
          this.getLicenses().then(onUpdate).catch(() => {});
        }
      );
    } catch (err) {
      console.warn('Could not establish real-time license listener:', err);
      if (onError) onError(err);
      this.getLicenses().then(onUpdate).catch(() => {});
      return () => {};
    }
  }

  /**
   * Fetch all tenants from Firestore
   */
  async getTenants(): Promise<Tenant[]> {
    try {
      const colRef = collection(db, 'tenants');
      const snap = await withTimeout(getDocs(colRef), 2500, null);
      if (snap) {
        const remoteList = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            name: data.name || data.clinicName || d.id,
            createdAt: sanitizeTimestamp(data.createdAt, Date.now()),
            updatedAt: sanitizeTimestamp(data.updatedAt, Date.now()),
            status: data.status || 'Ativo',
            ownerEmail: data.ownerEmail || data.email || ''
          } as Tenant;
        });
        setLocalData('tenants', remoteList);
        return remoteList;
      }
      return getLocalData<Tenant>('tenants');
    } catch (err) {
      console.error('Error in TenantRepository.getTenants:', err);
      return getLocalData<Tenant>('tenants');
    }
  }

  /**
   * Fetch single tenant by ID
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      if (!tenantId) return null;
      const docRef = doc(db, 'tenants', tenantId);
      const snap = await withTimeout(getDoc(docRef), 2500, null);
      if (snap && snap.exists()) {
        const data = snap.data();
        return {
          ...data,
          id: snap.id,
          name: data.name || data.clinicName || snap.id,
          createdAt: sanitizeTimestamp(data.createdAt, Date.now()),
          updatedAt: sanitizeTimestamp(data.updatedAt, Date.now()),
          status: data.status || 'Ativo',
          ownerEmail: data.ownerEmail || data.email || ''
        } as Tenant;
      }
      const local = getLocalData<Tenant>('tenants');
      return local.find((t) => t.id === tenantId) || null;
    } catch (err) {
      console.error(`Error in TenantRepository.getTenantById(${tenantId}):`, err);
      const local = getLocalData<Tenant>('tenants');
      return local.find((t) => t.id === tenantId) || null;
    }
  }

  /**
   * Check if a tenant with the same ID/subdomain, email, or name already exists.
   */
  async checkTenantDuplicate(
    tenantId: string,
    email?: string,
    name?: string
  ): Promise<{ isDuplicate: boolean; reason?: string }> {
    const existingTenants = await this.getTenants();

    const cleanId = tenantId.trim().toLowerCase();
    const idMatch = existingTenants.find(
      (t) =>
        (t.id && t.id.toLowerCase() === cleanId) ||
        (t.subdomain && t.subdomain.toLowerCase() === cleanId)
    );
    if (idMatch) {
      return {
        isDuplicate: true,
        reason: `Já existe um cliente cadastrado com o identificador/subdomínio '${cleanId}'.`
      };
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailMatch = existingTenants.find(
        (t) =>
          (t.ownerEmail && t.ownerEmail.trim().toLowerCase() === cleanEmail) ||
          ((t as any).email && (t as any).email.trim().toLowerCase() === cleanEmail)
      );
      if (emailMatch) {
        return {
          isDuplicate: true,
          reason: `Já existe um cliente cadastrado com o e-mail '${email.trim()}'.`
        };
      }
    }

    if (name && name.trim()) {
      const cleanName = name.trim().toLowerCase();
      const nameMatch = existingTenants.find(
        (t) =>
          (t.name && t.name.trim().toLowerCase() === cleanName) ||
          (t.clinicName && t.clinicName.trim().toLowerCase() === cleanName)
      );
      if (nameMatch) {
        return {
          isDuplicate: true,
          reason: `Já existe um cliente cadastrado com o nome '${name.trim()}'.`
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Create tenant document in Firestore after verifying no duplicates exist
   */
  async createTenant(tenant: Tenant): Promise<Tenant> {
    const rawId = tenant.id || tenant.subdomain || `tenant_${Date.now()}`;
    const cleanId = rawId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const docRef = doc(db, 'tenants', cleanId);
    try {
      const snap = await withTimeout(getDoc(docRef), 2000, null);
      if (snap && snap.exists()) {
        throw new Error(`Já existe um cliente com o identificador '${cleanId}'. Não é permitido criar duplicados.`);
      }
    } catch (err: any) {
      if (err?.message && err.message.includes('Já existe')) {
        throw err;
      }
    }

    const dupCheck = await this.checkTenantDuplicate(
      cleanId,
      tenant.ownerEmail || (tenant as any).email,
      tenant.name || tenant.clinicName
    );
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.reason);
    }

    const finalTenant: Tenant = {
      ...tenant,
      id: cleanId,
      subdomain: tenant.subdomain || cleanId,
      createdAt: tenant.createdAt || Date.now(),
      updatedAt: Date.now(),
      status: tenant.status || 'Ativo'
    };

    try {
      await withTimeout(setDoc(docRef, finalTenant, { merge: true }), 3000);
    } catch (e) {
      console.warn("Notice: setDoc for createTenant timed out or failed, saving locally:", e);
    }

    const localTenants = getLocalData<Tenant>('tenants');
    const existingIndex = localTenants.findIndex(t => t.id === cleanId);
    if (existingIndex >= 0) {
      localTenants[existingIndex] = finalTenant;
    } else {
      localTenants.unshift(finalTenant);
    }
    setLocalData('tenants', localTenants);

    // Auto-provision a linked license if one doesn't exist for this tenant
    const licenseId = `lic_${cleanId}`;
    const autoLicense: License = {
      id: licenseId,
      code: `LIC-${cleanId.toUpperCase()}-PRO-${Math.floor(1000 + Math.random() * 9000)}`,
      activatedAt: Date.now(),
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      plan: 'Pro',
      maxUsers: 3,
      maxPatients: 150,
      features: ['dashboard', 'agenda', 'pacientes', 'financeiro'],
      status: 'Ativa',
      tenantId: cleanId
    };
    try {
      await withTimeout(setDoc(doc(db, 'licenses', licenseId), autoLicense, { merge: true }), 3000);
    } catch (e) {
      console.warn("Notice: auto setDoc for license timed out:", e);
    }
    const localLics = getLocalData<License>('licenses');
    if (!localLics.some(l => l.tenantId === cleanId)) {
      localLics.unshift(autoLicense);
      setLocalData('licenses', localLics);
    }

    return finalTenant;
  }

  /**
   * Update existing tenant fields
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<void> {
    if (!tenantId) return;
    const docRef = doc(db, 'tenants', tenantId);
    const sanitizedUpdates = {
      ...updates,
      updatedAt: Date.now()
    };
    try {
      await withTimeout(setDoc(docRef, sanitizedUpdates, { merge: true }), 3000);
    } catch (e) {
      console.warn("Notice: setDoc for updateTenant timed out, updating locally:", e);
    }
    const localTenants = getLocalData<Tenant>('tenants');
    const idx = localTenants.findIndex(t => t.id === tenantId);
    if (idx >= 0) {
      localTenants[idx] = { ...localTenants[idx], ...sanitizedUpdates };
      setLocalData('tenants', localTenants);
    }
  }

  /**
   * Delete tenant from Firestore along with its associated license
   */
  async deleteTenant(tenantId: string): Promise<void> {
    if (!tenantId) return;

    // 1. Delete tenant doc in Firestore
    try {
      await withTimeout(deleteDoc(doc(db, 'tenants', tenantId)), 3000);
    } catch (e) {
      console.warn("Notice: deleteDoc on tenants timed out or failed:", e);
    }

    // 2. Local storage cleanup for tenant
    const tenants = getLocalData<Tenant>('tenants');
    setLocalData('tenants', tenants.filter((t) => t.id !== tenantId));

    // 3. Delete associated license doc(s)
    try {
      const localLics = getLocalData<License>('licenses');
      const associated = localLics.filter((l) => l.tenantId === tenantId);
      for (const lic of associated) {
        try {
          await withTimeout(deleteDoc(doc(db, 'licenses', lic.id)), 2000);
        } catch (e) {
          console.warn("Notice: deleteDoc on license timed out:", e);
        }
      }
      try {
        await withTimeout(deleteDoc(doc(db, 'licenses', `lic_${tenantId}`)), 2000);
      } catch (e) {}
    } catch (err) {
      console.warn('Notice: Could not delete associated licenses for tenant:', tenantId, err);
    }

    const licList = getLocalData<License>('licenses');
    setLocalData('licenses', licList.filter((l) => l.tenantId !== tenantId));

    // 4. Delete site_content docs if present
    try {
      await withTimeout(deleteDoc(doc(db, 'site_content', `${tenantId}_published`)), 2000);
      await withTimeout(deleteDoc(doc(db, 'site_content', `${tenantId}_draft`)), 2000);
    } catch (e) {
      console.warn('Could not remove site_content for tenant:', e);
    }
  }

  /**
   * Fetch all licenses
   */
  async getLicenses(): Promise<License[]> {
    try {
      const colRef = collection(db, 'licenses');
      const snap = await withTimeout(getDocs(colRef), 2500, null);
      if (snap) {
        const remoteList = snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            tenantId: data.tenantId || '',
            plan: data.plan || 'Pro',
            status: data.status || 'Ativa',
            activatedAt: sanitizeTimestamp(data.activatedAt || data.startDate, Date.now()),
            expiresAt: sanitizeTimestamp(data.expiresAt || data.expirationDate, Date.now() + 365 * 24 * 60 * 60 * 1000)
          } as License;
        });
        const merged = [...remoteList];

        // Ensure every registered tenant has a linked license
        try {
          const tenants = getLocalData<Tenant>('tenants');
          for (const tenant of tenants) {
            if (tenant.id && tenant.id !== 'mentecare_platform' && !merged.some(l => l.tenantId === tenant.id)) {
              const newLic: License = {
                id: `lic_${tenant.id}`,
                code: `LIC-${tenant.id.toUpperCase()}-PRO-${Math.floor(1000 + Math.random() * 9000)}`,
                activatedAt: tenant.createdAt || Date.now(),
                expiresAt: (tenant.createdAt || Date.now()) + 365 * 24 * 60 * 60 * 1000,
                plan: 'Pro',
                maxUsers: 3,
                maxPatients: 150,
                features: ['dashboard', 'agenda', 'pacientes', 'financeiro'],
                status: (tenant.status as string) === 'Inativo' || (tenant.status as string) === 'Suspensa' || (tenant.status as string) === 'Suspenso' ? 'Suspensa' : 'Ativa',
                tenantId: tenant.id
              };
              merged.push(newLic);
              setDoc(doc(db, 'licenses', newLic.id), newLic, { merge: true }).catch(() => {});
            }
          }
        } catch (tErr) {
          console.warn("Notice: check for tenant license links erred:", tErr);
        }

        setLocalData('licenses', merged);
        return merged;
      }
      return getLocalData<License>('licenses');
    } catch (err) {
      console.error('Error in TenantRepository.getLicenses:', err);
      return getLocalData<License>('licenses');
    }
  }

  /**
   * Save or update license
   */
  async saveLicense(license: License): Promise<License> {
    const finalLic: License = {
      ...license,
      id: license.id || `lic_${license.tenantId || Date.now()}`,
      activatedAt: license.activatedAt || Date.now(),
      expiresAt: license.expiresAt || (Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: license.status || 'Ativa'
    };
    const docRef = doc(db, 'licenses', finalLic.id);
    try {
      await withTimeout(setDoc(docRef, finalLic, { merge: true }), 3000);
    } catch (e) {
      console.warn("Notice: setDoc for saveLicense timed out, saving locally:", e);
    }

    const localLics = getLocalData<License>('licenses');
    const idx = localLics.findIndex(l => l.id === finalLic.id);
    if (idx >= 0) {
      localLics[idx] = finalLic;
    } else {
      localLics.unshift(finalLic);
    }
    setLocalData('licenses', localLics);

    return finalLic;
  }

  /**
   * Update license fields
   */
  async updateLicense(licenseId: string, updates: Partial<License>): Promise<void> {
    if (!licenseId) return;
    const docRef = doc(db, 'licenses', licenseId);
    await setDoc(docRef, updates, { merge: true });
  }

  /**
   * Delete license by ID
   */
  async deleteLicense(licenseId: string): Promise<void> {
    if (!licenseId) return;
    try {
      await withTimeout(deleteDoc(doc(db, 'licenses', licenseId)), 3000);
    } catch (e) {
      console.warn("Notice: deleteDoc on license timed out:", e);
    }
    const licList = getLocalData<License>('licenses');
    setLocalData('licenses', licList.filter((l) => l.id !== licenseId));
  }

  /**
   * Provision a new Tenant + License together atomically in Firestore
   */
  async provisionNewTenant(data: {
    clinicName: string;
    ownerEmail: string;
    subdomain: string;
    plan: SaaSPlanId;
    professionalName?: string;
    cpfCnpj?: string;
    crp?: string;
    phone?: string;
  }): Promise<{ tenant: Tenant; license: License }> {
    const finalTenantId = data.subdomain.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const docRef = doc(db, 'tenants', finalTenantId);
    try {
      const snap = await withTimeout(getDoc(docRef), 2000, null);
      if (snap && snap.exists()) {
        throw new Error(`Já existe um cliente cadastrado com o subdomínio/ID '${finalTenantId}'. Escolha outro.`);
      }
    } catch (err: any) {
      if (err?.message && err.message.includes('Já existe')) {
        throw err;
      }
    }

    const dupCheck = await this.checkTenantDuplicate(finalTenantId, data.ownerEmail, data.clinicName);
    if (dupCheck.isDuplicate) {
      throw new Error(dupCheck.reason);
    }

    const tenantDoc: Tenant = {
      id: finalTenantId,
      name: data.clinicName,
      professionalName: data.professionalName || data.clinicName,
      subdomain: finalTenantId,
      crp: data.crp || '',
      cpfCnpj: data.cpfCnpj || '',
      phone: data.phone || '',
      whatsApp: data.phone || '',
      ownerEmail: data.ownerEmail,
      status: 'Ativo',
      plan: data.plan,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const licenseDoc: License = {
      id: `lic_${finalTenantId}`,
      code: `LIC-${finalTenantId.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      tenantId: finalTenantId,
      plan: data.plan,
      activatedAt: Date.now(),
      expiresAt: Date.now() + (data.plan === 'Starter' ? 30 : 365) * 24 * 60 * 60 * 1000,
      maxUsers: data.plan === 'Enterprise' ? 20 : data.plan === 'Premium' ? 10 : data.plan === 'Pro' ? 3 : 1,
      maxPatients: data.plan === 'Enterprise' ? 2000 : data.plan === 'Premium' ? 500 : data.plan === 'Pro' ? 150 : 30,
      features: ['dashboard', 'agenda', 'pacientes', 'financeiro', 'teleconsulta', 'prontuario'],
      status: 'Ativa'
    };

    try {
      await withTimeout(setDoc(doc(db, 'tenants', finalTenantId), tenantDoc, { merge: true }), 3000);
      await withTimeout(setDoc(doc(db, 'licenses', licenseDoc.id), licenseDoc, { merge: true }), 3000);
    } catch (e) {
      console.warn("Notice: setDoc for provisionNewTenant timed out, saving locally:", e);
    }

    const localTenants = getLocalData<Tenant>('tenants');
    localTenants.unshift(tenantDoc);
    setLocalData('tenants', localTenants);

    const localLics = getLocalData<License>('licenses');
    localLics.unshift(licenseDoc);
    setLocalData('licenses', localLics);

    return { tenant: tenantDoc, license: licenseDoc };
  }
}

export const tenantRepository = new TenantRepository();
