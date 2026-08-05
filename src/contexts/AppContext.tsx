import { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth/AuthContext';
import { DataProvider, useData } from '@/contexts/data/DataContext';
import { usePlans } from '@/lib/plans';
import { Plan, isUnlimited } from '@/types';

function isPlanCurrentlyActive(plan: Plan, expiresAt: string): boolean {
  if (plan === 'free') return true;
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

const AppContext = createContext<ReturnType<typeof useAppValue> | null>(null);

function useAppValue() {
  const auth = useAuth();
  const data = useData();
  const { plans } = usePlans();

  const rawPlanId: Plan = auth.currentUser?.plan ?? 'free';
  const planId: Plan = auth.currentUser && isPlanCurrentlyActive(rawPlanId, auth.currentUser.planExpiresAt)
    ? rawPlanId
    : 'free';
  const isFree = planId === 'free';
  const isPro = planId === 'pro';
  const planLimits = plans[planId];
  const canAddPet = isUnlimited(planLimits.maxPets) || data.pets.length < planLimits.maxPets;
  const canUploadPhoto = planLimits.photoUpload;
  return { ...auth, ...data, planId, isFree, isPro, planLimits, canAddPet, canUploadPhoto };
}

function AppContextBridge({ children }: { children: ReactNode }) {
  const value = useAppValue();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContextBridge>{children}</AppContextBridge>
      </DataProvider>
    </AuthProvider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Provider + hook colocated by design
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}