import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Tenant, License, SaaSPlanId } from '../types';
import { tenantRepository } from '../repositories/tenantRepository';

export interface TenantContextType {
  tenants: Tenant[];
  licenses: License[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTenant: (tenant: Tenant) => Promise<Tenant>;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  saveLicense: (license: License) => Promise<License>;
  updateLicense: (licenseId: string, updates: Partial<License>) => Promise<void>;
  deleteLicense: (licenseId: string) => Promise<void>;
  getTenantById: (id: string) => Tenant | undefined;
  getTenantLicense: (tenantId: string) => License | undefined;
  provisionTenant: (data: {
    clinicName: string;
    ownerEmail: string;
    subdomain: string;
    plan: SaaSPlanId;
    professionalName?: string;
    cpfCnpj?: string;
    crp?: string;
    phone?: string;
  }) => Promise<{ tenant: Tenant; license: License }>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Single global real-time listeners for Firestore
  useEffect(() => {
    setLoading(true);
    let unsubTenants: (() => void) | null = null;
    let unsubLicenses: (() => void) | null = null;

    try {
      unsubTenants = tenantRepository.subscribeTenants(
        (tenantList) => {
          setTenants(tenantList);
          setLoading(false);
        },
        (err) => {
          console.warn('Tenant real-time error:', err);
          setError('Aviso: Falha na sincronização em tempo real de clientes.');
          setLoading(false);
        }
      );

      unsubLicenses = tenantRepository.subscribeLicenses(
        (licenseList) => {
          setLicenses(licenseList);
        },
        (err) => {
          console.warn('License real-time error:', err);
        }
      );
    } catch (err: any) {
      console.error('Error initializing TenantProvider listeners:', err);
      setError(err?.message || 'Erro ao conectar aos serviços de clientes');
      setLoading(false);
    }

    return () => {
      if (unsubTenants) unsubTenants();
      if (unsubLicenses) unsubLicenses();
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [tList, lList] = await Promise.all([
        tenantRepository.getTenants(),
        tenantRepository.getLicenses()
      ]);
      setTenants(tList);
      setLicenses(lList);
      setError(null);
    } catch (err: any) {
      console.error('Error refreshing tenants:', err);
      setError('Erro ao recarregar dados de clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTenant = useCallback(async (tenant: Tenant): Promise<Tenant> => {
    const created = await tenantRepository.createTenant(tenant);
    setTenants(prev => {
      const exists = prev.some(t => t.id === created.id);
      if (exists) return prev.map(t => t.id === created.id ? created : t);
      return [created, ...prev];
    });
    return created;
  }, []);

  const updateTenant = useCallback(async (tenantId: string, updates: Partial<Tenant>): Promise<void> => {
    await tenantRepository.updateTenant(tenantId, updates);
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, ...updates } : t));
  }, []);

  const deleteTenant = useCallback(async (tenantId: string): Promise<void> => {
    setTenants(prev => prev.filter(t => t.id !== tenantId));
    setLicenses(prev => prev.filter(l => l.tenantId !== tenantId));
    await tenantRepository.deleteTenant(tenantId);
  }, []);

  const saveLicense = useCallback(async (license: License): Promise<License> => {
    const saved = await tenantRepository.saveLicense(license);
    return saved;
  }, []);

  const updateLicense = useCallback(async (licenseId: string, updates: Partial<License>): Promise<void> => {
    await tenantRepository.updateLicense(licenseId, updates);
  }, []);

  const deleteLicense = useCallback(async (licenseId: string): Promise<void> => {
    setLicenses(prev => prev.filter(l => l.id !== licenseId));
    await tenantRepository.deleteLicense(licenseId);
  }, []);

  const getTenantById = useCallback((id: string): Tenant | undefined => {
    if (!id) return undefined;
    return tenants.find(t => t.id === id || t.subdomain === id);
  }, [tenants]);

  const getTenantLicense = useCallback((tenantId: string): License | undefined => {
    if (!tenantId) return undefined;
    return licenses.find(l => l.tenantId === tenantId);
  }, [licenses]);

  const provisionTenant = useCallback(async (data: {
    clinicName: string;
    ownerEmail: string;
    subdomain: string;
    plan: SaaSPlanId;
    professionalName?: string;
    cpfCnpj?: string;
    crp?: string;
    phone?: string;
  }) => {
    return await tenantRepository.provisionNewTenant(data);
  }, []);

  const value = useMemo<TenantContextType>(() => ({
    tenants,
    licenses,
    loading,
    error,
    refresh,
    createTenant,
    updateTenant,
    deleteTenant,
    saveLicense,
    updateLicense,
    deleteLicense,
    getTenantById,
    getTenantLicense,
    provisionTenant
  }), [
    tenants,
    licenses,
    loading,
    error,
    refresh,
    createTenant,
    updateTenant,
    deleteTenant,
    saveLicense,
    updateLicense,
    deleteLicense,
    getTenantById,
    getTenantLicense,
    provisionTenant
  ]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Alias for convenience
export const useTenants = useTenant;
